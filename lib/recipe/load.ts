import "server-only";
import { cacheTag } from "next/cache";
import { selectAllRecipes } from "@/lib/db/recipes";
import type { Recipe } from "./schema";
import { isPublished } from "./status";
import { toCard, toPublic, type PublicRecipe, type RecipeCard } from "./public";

/**
 * Content access. Recipes are read from the `recipes` table (authored in content/recipes/ and
 * copied there with `npm run recipes:push`). Every read goes through these functions, wrapped in
 * `use cache` with tags, so the rest of the app does not know where recipes are stored.
 *
 * INTERNAL: `loadFullRecipe` returns premium text. Only lib/dal.ts may import it.
 */

const published = isPublished;

async function publishedRecipes(): Promise<Recipe[]> {
  return (await selectAllRecipes()).filter(published);
}

export async function loadFullRecipe(slug: string): Promise<Recipe | null> {
  "use cache";
  cacheTag("recipes", `recipe:${slug}`);
  return (await publishedRecipes()).find((r) => r.slug === slug) ?? null;
}

export async function listSlugs(): Promise<string[]> {
  "use cache";
  cacheTag("recipes");
  return (await publishedRecipes()).map((r) => r.slug);
}

/** Teaser-safe catalog data (title, facts, ingredient names). */
export async function listCards(): Promise<RecipeCard[]> {
  "use cache";
  cacheTag("recipes");
  return (await publishedRecipes()).map(toCard);
}

/** Public projection: full body for free recipes, teaser for premium. Safe to render in a shared cache. */
export async function getPublicRecipe(slug: string): Promise<PublicRecipe | null> {
  "use cache";
  cacheTag("recipes", `recipe:${slug}`);
  const r = (await publishedRecipes()).find((x) => x.slug === slug);
  return r ? toPublic(r) : null;
}
