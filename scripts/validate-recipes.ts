import { recipes } from "../content/recipes";
import { checkRecipe } from "../lib/recipe/rules";

let errors = 0;
let warns = 0;
const seen = new Set<string>();
for (const r of recipes) {
  if (seen.has(r.slug)) {
    console.error(`✗ duplicate slug ${r.slug}`);
    errors++;
  }
  seen.add(r.slug);
  const issues = checkRecipe(r, r.slug);
  for (const i of issues) {
    // problems in a draft never fail the build; they must be fixed before status becomes "published"
    const level = r.status === "published" ? i.level : "warn";
    const tag = level === "error" ? "✗" : "!";
    console.log(`${tag} ${r.slug}${r.status === "published" ? "" : ` [${r.status}]`} ${i.path}: ${i.message}`);
    if (level === "error") errors++;
    else warns++;
  }
}
console.log(`\n${recipes.length} recipes, ${errors} errors, ${warns} warnings`);
process.exit(errors ? 1 : 0);
