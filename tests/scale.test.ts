import { test } from "node:test";
import assert from "node:assert/strict";
import { recipes } from "../content/recipes";
import { ingredientQuantity } from "../lib/recipe/labels";
import {
  clampServings,
  parseFaNumber,
  roundAmount,
  scaleAdvice,
  scaleHousehold,
  scaleIngredient,
} from "../lib/recipe/scale";

const khorak = recipes.find((r) => r.slug === "khorak-bandari")!;
const item = (name: string) => khorak.ingredients[0].items.find((i) => i.name.startsWith(name))!;
const line = (name: string, f: number) => ingredientQuantity(scaleIngredient(item(name), f));

test("factor 1 is the identity", () => {
  assert.equal(scaleIngredient(item("سوسیس"), 1), item("سوسیس"));
});
test("halving and doubling grams", () => {
  assert.equal(line("سوسیس", 0.5), "۲۵۰ گرم");
  assert.equal(line("سوسیس", 2), "۱۰۰۰ گرم");
});
test("rounding per unit", () => {
  assert.equal(roundAmount(333, "g"), 335);
  assert.equal(roundAmount(0.6, "tsp"), 0.5);
  assert.equal(roundAmount(0.1, "tsp"), 0.25);
  assert.equal(roundAmount(2.3, "piece"), 2.5);
});
test("ranges scale both ends", () => {
  assert.equal(line("فلفل قرمز", 2), "۱ تا ۲ قاشق چای‌خوری");
});
test("fixed items do not scale", () => {
  assert.equal(line("روغن", 3), "حدود ۶ قاشق غذاخوری");
  assert.equal(line("نمک", 3), "به مقدار لازم");
});
test("household measure scales when numeric, is hidden otherwise", () => {
  assert.equal(line("سیب", 2), "۴ عدد متوسط (۷۰۰ گرم)");
  const beryani = recipes.find((r) => r.slug === "beryani-isfahani")!;
  const meat = beryani.ingredients[0].items[0];
  assert.equal(ingredientQuantity(scaleIngredient(meat, 2)), "۱۰۰۰ گرم بی‌استخوان");
});
test("parsing helpers", () => {
  assert.equal(parseFaNumber("۱½"), 1.5);
  assert.equal(parseFaNumber("۲٫۵"), 2.5);
  assert.equal(parseFaNumber("حدود"), null);
  assert.equal(scaleHousehold("با استخوان حدود ۷۵۰ گرم", 2), null);
  assert.equal(scaleHousehold("۱ لیوان", 2), "۲ لیوان");
});
test("advice: step factor, time warning, tested range", () => {
  const range = { min: 2, max: 8 };
  assert.equal(scaleAdvice(4, 4, range).stepFactor, null);
  assert.equal(scaleAdvice(6, 4, range).stepFactor, "۱½");
  assert.equal(scaleAdvice(8, 4, range).timeWarning, true);
  assert.equal(scaleAdvice(6, 4, range).timeWarning, false);
  assert.equal(scaleAdvice(20, 4, range).outOfRange, true);
  assert.equal(scaleAdvice(1, 4, range).outOfRange, true);
});
test("servings are clamped", () => {
  assert.equal(clampServings(0), 1);
  assert.equal(clampServings(500), 100);
  assert.equal(clampServings(NaN), 1);
});
