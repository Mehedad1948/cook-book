import { test } from "node:test";
import assert from "node:assert/strict";
import { recipes } from "../content/recipes";
import { checkRecipe } from "../lib/recipe/rules";
import type { Recipe } from "../lib/recipe/schema";

const base = () => structuredClone(recipes.find((r) => r.slug === "khorak-bandari")!) as Recipe;
const errs = (r: Recipe) => checkRecipe(r).filter((i) => i.level === "error");

test("seed recipes pass every rule", () => {
  for (const r of recipes) assert.deepEqual(errs(r), [], r.slug);
});
test("filename must match slug", () => {
  assert.ok(checkRecipe(base(), "other").some((i) => i.path === "slug"));
});
test("ingredient without amount fails unless optional or toTaste", () => {
  const r = base();
  r.ingredients[0].items[0] = { name: "سوسیس" };
  assert.ok(errs(r).some((i) => /no amount/.test(i.message)));
});
test("toTaste only for salt and pepper", () => {
  const r = base();
  r.ingredients[0].items[0] = { name: "سوسیس", toTaste: true };
  assert.ok(errs(r).some((i) => /toTaste/.test(i.message)));
});
test("stage with 1 or 7 actions fails", () => {
  const r = base();
  r.stages[0].actions = [r.stages[0].actions[0]];
  assert.ok(errs(r).some((i) => /allowed 2–6/.test(i.message)));
  r.stages[0].actions = Array(7).fill(r.stages[1].actions[0]);
  assert.ok(errs(r).some((i) => /allowed 2–6/.test(i.message)));
});
test("mistakes outside 4–6 fails", () => {
  const r = base();
  r.mistakes = r.mistakes.slice(0, 2);
  assert.ok(errs(r).some((i) => i.path === "mistakes"));
});
test("action starting with a digit fails (Persian and Latin, even after bold)", () => {
  for (const t of ["۲ تا ۳ دقیقه سرخ کن", "2 min", "**۵ دقیقه** صبر کن"]) {
    const r = base();
    r.stages[0].actions[0].text = t;
    assert.ok(errs(r).some((i) => /start with a digit/.test(i.message)), t);
  }
});
test("Latin digits in Persian text fail", () => {
  const r = base();
  r.summary = "برای 4 نفر";
  assert.ok(errs(r).some((i) => /Latin digit/.test(i.message)));
});
test("ZWNJ misuse fails", () => {
  const r = base();
  r.summary = "این غذا خوب می شود";
  assert.ok(errs(r).some((i) => /ZWNJ/.test(i.message)));
  r.summary = "سیب زمینی";
  assert.ok(errs(r).some((i) => /ZWNJ/.test(i.message)));
});
test("bare amount phrases fail", () => {
  const r = base();
  r.stages[0].note = "نمک به مقدار لازم";
  assert.ok(errs(r).some((i) => /به مقدار لازم/.test(i.message)));
  r.stages[0].note = "نمک را به سلیقه بزن";
  assert.ok(errs(r).some((i) => /به سلیقه/.test(i.message)));
});
test("raw HTML fails", () => {
  const r = base();
  r.stages[0].note = "مهم <b>است</b>";
  assert.ok(errs(r).some((i) => /HTML/.test(i.message)));
});
test("low contrast accent fails", () => {
  const r = base();
  r.accent = { accent: "#f0c080", soft: "#fff8f0", line: "#eeeeee" };
  assert.ok(errs(r).some((i) => i.path === "accent"));
});
