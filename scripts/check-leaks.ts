/**
 * Security regression: premium text must not appear in anything a non-subscriber can receive.
 *
 *   npm run build && npm run check:leaks            # scans client chunks + prerendered output
 *   BASE_URL=http://localhost:3000 npm run check:leaks   # also requests live pages as anonymous
 *
 * The server bundle (.next/server/chunks) is allowed to contain the text; only outputs that are
 * sent to browsers are checked.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { recipes } from "../content/recipes";
import { collectStrings } from "../lib/recipe/rules";
import { toPublic } from "../lib/recipe/public";
import { ingredientQuantity } from "../lib/recipe/labels";
import { scaleIngredient } from "../lib/recipe/scale";

type Needle = { slug: string; path: string; needle: string; scoped?: boolean };
function sentinels(): Needle[] {
  const out: Needle[] = [];
  for (const r of recipes.filter((x) => x.access === "premium")) {
    const pub = JSON.stringify(toPublic(r));
    for (const [path, text] of collectStrings(r)) {
      // the longest plain run between **bold** markers is what appears verbatim in output
      const run = text.split("**").sort((a, b) => b.length - a.length)[0].trim();
      if (run.length < 18 || pub.includes(run)) continue; // short or legitimately public
      out.push({ slug: r.slug, path, needle: run.slice(0, 40) });
    }
  }
  // amounts, as authored and as the scaler would print them: ingredient amounts are gated too
  for (const r of recipes.filter((x) => x.access === "premium")) {
    for (const it of r.ingredients.flatMap((g) => g.items)) {
      for (const f of [1, 0.5, 1.5, 2]) {
        const line = ingredientQuantity(scaleIngredient(it, f));
        if (line.length >= 8 && /[۰-۹]/.test(line)) if (!JSON.stringify(toPublic(r)).includes(line)) out.push({ slug: r.slug, path: `ingredient "${it.name}" x${f}`, needle: line, scoped: true });
      }
    }
  }
  return out;
}

function* walk(dir: string): Generator<string> {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

const needles = sentinels();
let leaks = 0;
const report = (where: string, n: (typeof needles)[number]) => {
  console.error(`✗ LEAK in ${where}: ${n.slug} ${n.path} -> "${n.needle}"`);
  leaks++;
};

console.log(`${needles.length} sentinel strings from premium recipes`);

// 1. client chunks and prerendered HTML/RSC output
const roots = [
  join(".next", "static"),
  join(".next", "server", "app"),
];
const exts = [".js", ".html", ".rsc", ".segment.rsc", ".meta", ".json"];
let scanned = 0;
for (const root of roots) {
  for (const file of walk(root)) {
    if (!exts.some((e) => file.endsWith(e))) continue;
    if (root.includes("server") && file.endsWith(".js")) continue; // server code may hold content
    scanned++;
    const body = readFileSync(file, "utf8");
    for (const n of needles) {
      // short amount strings also occur legitimately on other recipes: only check them where the premium page lives
      if (n.scoped && !(file.includes(n.slug) || file.includes(join(".next", "static")))) continue;
      if (body.includes(n.needle)) report(file, n);
    }
  }
}
console.log(`scanned ${scanned} files in .next (client chunks + prerendered output)`);

// 1b. positive control: the shell must actually contain the public content (an empty shell would pass the scan above)
for (const r of recipes) {
  const file = join(".next", "server", "app", "recipes", `${r.slug}.html`);
  if (!existsSync(file)) {
    console.error(`✗ missing prerendered shell ${file}`);
    leaks++;
    continue;
  }
  const html = readFileSync(file, "utf8");
  const must =
    r.access === "free"
      ? [r.stages[1].title, "recipeInstructions", r.mistakes[0].problem]
      : [r.stages[0].title, r.ingredients[0].items[0].name, '"@type":"Recipe"', "ویژهٔ مشترکین"];
  for (const m of must) {
    if (!html.includes(m)) {
      console.error(`✗ shell for ${r.slug} is missing expected public content: "${m}"`);
      leaks++;
    }
  }
  if (r.access === "premium" && html.includes("recipeInstructions")) {
    console.error(`✗ premium shell for ${r.slug} contains recipeInstructions`);
    leaks++;
  }
}

// 2. live requests as an anonymous visitor
const base = process.env.BASE_URL;
async function live() {
  if (!base) return;
  for (const slug of new Set(needles.map((n) => n.slug))) {
    for (const [label, headers] of [
      ["html", {}],
      ["rsc", { RSC: "1" }],
    ] as const) {
      const res = await fetch(`${base}/recipes/${slug}`, { headers });
      const body = await res.text();
      for (const n of needles.filter((x) => x.slug === slug)) if (body.includes(n.needle)) report(`GET /recipes/${slug} (${label})`, n);
      console.log(`GET /recipes/${slug} (${label}): ${res.status}, ${body.length} bytes`);
    }
  }
}

live().then(() => {
  if (leaks) {
    console.error(`\n${leaks} leak(s) found`);
    process.exit(1);
  }
  console.log("✓ no premium text outside the server bundle");
});
