import type { Category, Occasion, Recipe } from "./schema";

/**
 * Public projections. These are the ONLY shapes allowed into cached/shared
 * output (static shell, catalog, search index, JSON-LD, sitemap).
 * Premium recipes are physically stripped here; see tests/public.test.ts.
 */

export type RecipeMeta = Pick<
  Recipe,
  | "slug"
  | "access"
  | "title"
  | "altTitle"
  | "category"
  | "region"
  | "tags"
  | "occasion"
  | "kidFriendly"
  | "summary"
  | "accent"
  | "image"
  | "facts"
>;

export type Teaser = RecipeMeta & {
  kind: "teaser";
  /** Ingredient names only, no amounts. */
  ingredientGroups: { group?: string; names: string[] }[];
  tools?: string[];
  servedWith?: string[];
  stageTitles: string[];
  mistakesCount: number;
  storageBadges: { fridgeDays?: number; freezerDays?: number; freezable?: boolean };
};

export type FullView = { kind: "full"; recipe: Recipe };
export type PublicRecipe = FullView | Teaser;

/** Card data for catalogs and search: teaser-safe by construction. */
export type RecipeCard = RecipeMeta & { ingredientNames: string[] };

function meta(r: Recipe): RecipeMeta {
  return {
    slug: r.slug,
    access: r.access,
    title: r.title,
    altTitle: r.altTitle,
    category: r.category,
    region: r.region,
    tags: r.tags,
    occasion: r.occasion,
    kidFriendly: r.kidFriendly,
    summary: r.summary,
    accent: r.accent,
    image: r.image,
    facts: r.facts,
  };
}

export function toTeaser(r: Recipe): Teaser {
  return {
    ...meta(r),
    kind: "teaser",
    ingredientGroups: r.ingredients.map((g) => ({
      group: g.group,
      names: g.items.map((i) => i.name),
    })),
    tools: r.tools,
    servedWith: r.servedWith,
    stageTitles: r.stages.map((s) => s.title),
    mistakesCount: r.mistakes.length,
    storageBadges: {
      fridgeDays: r.storage.fridgeDays,
      freezerDays: r.storage.freezerDays,
      freezable: r.storage.freezable,
    },
  };
}

/** Free recipes are public in full; premium recipes become a teaser. */
export function toPublic(r: Recipe): PublicRecipe {
  return r.access === "free" ? { kind: "full", recipe: r } : toTeaser(r);
}

export function toCard(r: Recipe): RecipeCard {
  return { ...meta(r), ingredientNames: r.ingredients.flatMap((g) => g.items.map((i) => i.name)) };
}

export type { Category, Occasion };
