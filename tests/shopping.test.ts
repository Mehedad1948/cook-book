import { test } from "node:test";
import assert from "node:assert/strict";
import { recipes } from "../content/recipes";
import { buildShoppingList, shoppingText } from "../lib/recipe/shopping";

const khorak = recipes.find((r) => r.slug === "khorak-bandari")!;
const beryani = recipes.find((r) => r.slug === "beryani-isfahani")!;
const line = (list: ReturnType<typeof buildShoppingList>, name: string) => list.find((l) => l.name.startsWith(name))!;

test("same ingredient from two recipes is merged; scaling applies", () => {
  const list = buildShoppingList([
    { recipe: khorak, servings: 4 },
    { recipe: khorak, servings: 8 },
  ]);
  assert.equal(line(list, "سوسیس").quantity, "۱۵۰۰ گرم");
  assert.equal(line(list, "پیاز").quantity, "۶ عدد");
});

test("different units or recipes stay separate and salt is listed once", () => {
  const list = buildShoppingList([
    { recipe: khorak, servings: 4 },
    { recipe: beryani, servings: 4 },
  ]);
  assert.equal(list.filter((l) => l.name.includes("نمک")).length, 1);
  assert.equal(line(list, "پیاز").recipes.length, 2);
  assert.match(line(list, "پیاز").quantity, /^۳ عدد$/);
});

test("share text is plain and complete", () => {
  const text = shoppingText(buildShoppingList([{ recipe: khorak, servings: 4 }]));
  assert.ok(text.startsWith("لیست خرید"));
  assert.ok(text.includes("سوسیس"));
  assert.ok(!text.includes("<"));
});
