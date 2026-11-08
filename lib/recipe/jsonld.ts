import type { PublicRecipe } from "./public";
import { CATEGORY_LABEL } from "./labels";
import { BRAND, SITE_URL } from "../site";

/**
 * schema.org Recipe built ONLY from the public projection.
 * Premium recipes get names, times and yield but never recipeInstructions or amounts.
 */

const plain = (s: string) => s.replace(/\*\*/g, "");
const minutesOf = (m: number | [number, number]) => (Array.isArray(m) ? m[1] : m);
const iso = (m: number) => `PT${Math.floor(m / 60) ? `${Math.floor(m / 60)}H` : ""}${m % 60 ? `${m % 60}M` : ""}`;

export function recipeJsonLd(p: PublicRecipe) {
  const meta = p.kind === "full" ? p.recipe : p;
  const url = `${SITE_URL}/recipes/${meta.slug}`;
  const base = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: meta.title,
    alternateName: meta.altTitle,
    description: meta.summary,
    inLanguage: "fa-IR",
    url,
    author: { "@type": "Organization", name: BRAND },
    publisher: { "@type": "Organization", name: BRAND },
    recipeCategory: CATEGORY_LABEL[meta.category],
    recipeCuisine: meta.region ? `ایرانی - ${meta.region}` : "ایرانی",
    keywords: meta.tags.join("، "),
    totalTime: iso(minutesOf(meta.facts.totalMinutes)),
    recipeYield: `${meta.facts.servings} نفر`,
    isAccessibleForFree: meta.access === "free",
  };
  if (p.kind === "full") {
    const r = p.recipe;
    return {
      ...base,
      recipeIngredient: r.ingredients.flatMap((g) => g.items.map((i) => i.name)),
      recipeInstructions: r.stages.map((s) => ({
        "@type": "HowToSection",
        name: s.title,
        itemListElement: s.actions.map((a) => ({
          "@type": "HowToStep",
          text: plain([a.text, ...(a.sub ?? []).map((x) => `${x.label ?? ""} ${x.text}`)].join(" ")),
        })),
      })),
    };
  }
  return { ...base, recipeIngredient: p.ingredientGroups.flatMap((g) => g.names) };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}
