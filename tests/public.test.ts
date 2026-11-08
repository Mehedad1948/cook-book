import { test } from "node:test";
import assert from "node:assert/strict";
import { recipes } from "../content/recipes";
import { toPublic, toCard } from "../lib/recipe/public";
import { collectStrings } from "../lib/recipe/rules";

const premium = recipes.filter((r) => r.access === "premium");

test("there is at least one premium and one free seed", () => {
  assert.ok(premium.length > 0 && recipes.some((r) => r.access === "free"));
});

test("premium projections contain no gated text", () => {
  for (const r of premium) {
    const pub = JSON.stringify(toPublic(r)) + JSON.stringify(toCard(r));
    const allowed = new Set<string>([
      r.title,
      r.summary,
      ...r.tags,
      r.facts.portion ?? "",
      ...r.ingredients.flatMap((g) => g.items.map((i) => i.name)),
      ...r.stages.map((s) => s.title),
      ...(r.tools ?? []),
      ...(r.servedWith ?? []),
    ]);
    for (const [path, text] of collectStrings(r)) {
      if (allowed.has(text) || !text) continue;
      assert.ok(!pub.includes(text.slice(0, 30)), `${r.slug} leaks ${path}`);
    }
    assert.ok(!pub.includes('"amount"'), "amount leaked");
    assert.ok(!pub.includes('"actions"'), "actions leaked");
    assert.ok(!pub.includes('"mistakes"'), "mistakes leaked");
  }
});

test("free recipes are public in full", () => {
  for (const r of recipes.filter((x) => x.access === "free")) assert.equal(toPublic(r).kind, "full");
});
