import type { Recipe } from "./schema";

/**
 * The recipe-guide checklist, automated (docs/app-guide/README.md section 3.3).
 * Pure function: returns issues, never throws. Errors fail the build.
 */
export type Issue = { level: "error" | "warn"; path: string; message: string };

const DIGIT_START = /^[\s*_]*[0-9۰-۹٠-٩]/;
const LATIN_DIGIT = /[0-9]/;
const ZWNJ_PATTERNS: [RegExp, string][] = [
  [/(^|\s)(ن?می) (?=[؀-ۿ])/, "می‌ must be joined with a ZWNJ (e.g. می‌شود)"],
  [/سیب زمینی/, "سیب‌زمینی needs a ZWNJ"],
  [/گوجه فرنگی/, "گوجه‌فرنگی needs a ZWNJ"],
  [/چای خوری/, "چای‌خوری needs a ZWNJ"],
  [/غذا خوری/, "غذاخوری is one word"],
  [/فلفل دلمه ای/, "دلمه‌ای needs a ZWNJ"],
];
const SALT_PEPPER = /نمک|فلفل سیاه|فلفل/;
const MEAT = /گوشت|مرغ|ماهی|میگو/;
const BONE_OR_SHELL = /استخوان|پوست|صدف|بی‌/;

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luminance(h: string): number {
  const [r, g, b] = hexToRgb(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Every user-visible string in the recipe with its path. */
export function* collectStrings(r: Recipe): Generator<[string, string]> {
  const top: (keyof Recipe)[] = ["title", "altTitle", "region", "makeAhead", "summary", "closing"];
  for (const k of top) if (typeof r[k] === "string") yield [k, r[k] as string];
  for (const [i, t] of r.tags.entries()) yield [`tags.${i}`, t];
  yield* Object.entries({
    ...(r.facts.servingsNote ? { "facts.servingsNote": r.facts.servingsNote } : {}),
    ...(r.facts.portion ? { "facts.portion": r.facts.portion } : {}),
    ...(r.facts.shelfLife ? { "facts.shelfLife": r.facts.shelfLife } : {}),
  });
  for (const [g, grp] of r.ingredients.entries()) {
    if (grp.group) yield [`ingredients.${g}.group`, grp.group];
    for (const [i, it] of grp.items.entries()) {
      const p = `ingredients.${g}.items.${i}`;
      yield [`${p}.name`, it.name];
      if (it.note) yield [`${p}.note`, it.note];
      if (it.household) yield [`${p}.household`, it.household];
    }
  }
  for (const [i, t] of (r.tools ?? []).entries()) yield [`tools.${i}`, t];
  for (const [i, t] of (r.servedWith ?? []).entries()) yield [`servedWith.${i}`, t];
  if (r.chooseTip) yield ["chooseTip.text", r.chooseTip.text];
  for (const [s, st] of r.stages.entries()) {
    yield [`stages.${s}.title`, st.title];
    if (st.tip) yield [`stages.${s}.tip.text`, st.tip.text];
    if (st.note) yield [`stages.${s}.note`, st.note];
    for (const [a, ac] of st.actions.entries()) {
      yield [`stages.${s}.actions.${a}.text`, ac.text];
      if (ac.cue) yield [`stages.${s}.actions.${a}.cue`, ac.cue];
      for (const [u, sub] of (ac.sub ?? []).entries())
        yield [`stages.${s}.actions.${a}.sub.${u}`, sub.text];
    }
  }
  if (r.extraTable) {
    yield ["extraTable.title", r.extraTable.title];
    for (const [i, row] of r.extraTable.rows.entries())
      for (const [j, c] of row.entries()) yield [`extraTable.rows.${i}.${j}`, c];
    if (r.extraTable.tip) yield ["extraTable.tip.text", r.extraTable.tip.text];
  }
  for (const [i, m] of r.mistakes.entries()) {
    yield [`mistakes.${i}.problem`, m.problem];
    yield [`mistakes.${i}.fix`, m.fix];
  }
  for (const [i, l] of r.storage.lines.entries()) yield [`storage.lines.${i}`, l];
  for (const [i, v] of (r.storage.variations ?? []).entries()) {
    yield [`storage.variations.${i}.title`, v.title];
    yield [`storage.variations.${i}.text`, v.text];
  }
}

export function checkRecipe(r: Recipe, filename?: string): Issue[] {
  const out: Issue[] = [];
  const err = (path: string, message: string) => out.push({ level: "error", path, message });
  const warn = (path: string, message: string) => out.push({ level: "warn", path, message });

  if (filename && filename !== r.slug) err("slug", `slug "${r.slug}" must match filename "${filename}"`);

  for (const [g, grp] of r.ingredients.entries()) {
    for (const [i, it] of grp.items.entries()) {
      const p = `ingredients.${g}.items.${i}`;
      if (it.amount === undefined && !it.toTaste && !it.optional)
        err(p, `"${it.name}" has no amount (only optional items or salt/pepper may omit it)`);
      if (it.toTaste && !SALT_PEPPER.test(it.name))
        err(p, `toTaste is only allowed for salt and pepper, not "${it.name}"`);
      if (it.amount !== undefined && !it.unit && !it.note && !it.household)
        warn(p, `"${it.name}" has an amount without a unit`);
      if (MEAT.test(it.name) && !BONE_OR_SHELL.test(`${it.note ?? ""} ${it.household ?? ""}`))
        warn(p, `"${it.name}": say with or without bone/skin/shell (guide section 2)`);
    }
  }

  let tips = r.chooseTip ? 1 : 0;
  for (const [s, st] of r.stages.entries()) {
    if (st.actions.length < 2 || st.actions.length > 6)
      err(`stages.${s}`, `stage "${st.title}" has ${st.actions.length} actions (allowed 2–6)`);
    if (st.tip) tips++;
    for (const [a, ac] of st.actions.entries())
      if (DIGIT_START.test(ac.text))
        err(
          `stages.${s}.actions.${a}.text`,
          "a numbered action must not start with a digit (RTL number collision); reorder the sentence",
        );
  }
  if (r.extraTable?.tip) tips++;
  if (tips < 3 || tips > 6) warn("tips", `${tips} highlighted tips in total (typical 3–6)`);

  if (r.mistakes.length < 4 || r.mistakes.length > 6)
    err("mistakes", `mistakes table has ${r.mistakes.length} rows (allowed 4–6)`);

  if (r.extraTable) {
    const cols = r.extraTable.columns.length;
    for (const [i, row] of r.extraTable.rows.entries())
      if (row.length !== cols) err(`extraTable.rows.${i}`, `row has ${row.length} cells, expected ${cols}`);
  }

  for (const [path, text] of collectStrings(r)) {
    if (LATIN_DIGIT.test(text)) err(path, `Latin digit in Persian text: "${text.slice(0, 40)}"`);
    for (const [re, why] of ZWNJ_PATTERNS) if (re.test(text)) err(path, why);
    if (text.includes("به مقدار لازم")) err(path, 'write an amount; "به مقدار لازم" is generated for salt/pepper via toTaste');
    if (path !== "closing" && /به سلیقه/.test(text) && !/[۰-۹½¼¾]/.test(text))
      err(path, '"به سلیقه" needs a starting amount');
    if (/<[a-z]|&nbsp;/i.test(text)) err(path, "raw HTML is not allowed; use **bold** only");
  }

  const { accent, soft } = r.accent;
  for (const [bg, label] of [["#ffffff", "white"], [soft, "soft"]] as const) {
    const c = contrast(accent, bg);
    if (c < 4.5) err("accent", `accent on ${label} has contrast ${c.toFixed(2)} (< 4.5)`);
  }

  return out;
}
