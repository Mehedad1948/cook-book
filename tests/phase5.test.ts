import { test } from "node:test";
import assert from "node:assert/strict";
import { recipes } from "../content/recipes";
import { publishedOnly } from "../lib/recipe/status";
import { skeletonFor } from "../lib/recipe/skeleton";
import { recipeSchema } from "../lib/recipe/schema";
import { toCard } from "../lib/recipe/public";

test("drafts and reviews are excluded from every public listing", () => {
  const draft = { ...structuredClone(recipes[0]), slug: "draft-one", status: "draft" as const };
  const review = { ...structuredClone(recipes[0]), slug: "review-one", status: "review" as const };
  const all = [...recipes, draft, review];
  const slugs = publishedOnly(all).map((r) => r.slug);
  assert.ok(!slugs.includes("draft-one") && !slugs.includes("review-one"));
  assert.deepEqual(publishedOnly(all).map(toCard).map((c) => c.slug), slugs);
});

test("the scaffold is schema-valid and always a draft", () => {
  const src = skeletonFor("ghormeh-sabzi");
  assert.ok(src.includes('slug: "ghormeh-sabzi"') && src.includes('status: "draft"'));
  // evaluate the object literal part to prove it satisfies the schema
  const body = src.slice(src.indexOf("defineRecipe(") + "defineRecipe(".length, src.lastIndexOf(");"));
  const obj = new Function(`return (${body})`)();
  assert.equal(recipeSchema.safeParse(obj).success, true);
  assert.equal(obj.status, "draft");
});
