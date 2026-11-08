import "server-only";
import { cacheTag } from "next/cache";
import { recipes } from "@/content/recipes";
import type { Recipe } from "./schema";
import { toCard, toPublic, type PublicRecipe, type RecipeCard } from "./public";

/**
 * Content access. Recipes live in git today. Every read goes through these
 * functions, wrapped in `use cache` with tags, so moving content to a DB or a
 * CMS later changes only this file.
 *
 * INTERNAL: `loadFullRecipe` returns premium text. Only lib/dal.ts may import it.
 */

const published = (r: Recipe) => r.status === "published";

export async function loadFullRecipe(slug: string): Promise<Recipe | null> {
  "use cache";
  cacheTag("recipes", `recipe:${slug}`);
  return recipes.find((r) => r.slug === slug && published(r)) ?? null;
}

export async function listSlugs(): Promise<string[]> {
  "use cache";
  cacheTag("recipes");
  return recipes.filter(published).map((r) => r.slug);
}

/** Teaser-safe catalog data (title, facts, ingredient names). */
export async function listCards(): Promise<RecipeCard[]> {
  "use cache";
  cacheTag("recipes");
  return recipes.filter(published).map(toCard);
}

/** Public projection: full body for free recipes, teaser for premium. Safe to render in a shared cache. */
export async function getPublicRecipe(slug: string): Promise<PublicRecipe | null> {
  "use cache";
  cacheTag("recipes", `recipe:${slug}`);
  const r = recipes.find((x) => x.slug === slug && published(x));
  return r ? toPublic(r) : null;
}
