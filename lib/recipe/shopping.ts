import type { Ingredient, Recipe } from "./schema";
import { ingredientQuantity } from "./labels";
import { scaleIngredient } from "./scale";
import { factorOf } from "./scale";
import { normalizeSearch } from "../format";

/**
 * Merges ingredients across recipes. Same normalized name AND same unit are summed (ranges add
 * both ends); everything else stays a separate line rather than guessing a conversion.
 * Household measures and size notes ("متوسط") are dropped from merged lines because they cannot be added reliably.
 */

export type ShoppingLine = { name: string; quantity: string; recipes: string[] };

type Acc = { name: string; unit?: Ingredient["unit"]; lo: number; hi: number; toTaste: boolean; optionalOnly: boolean; noAmount: boolean; recipes: Set<string> };

export function buildShoppingList(entries: { recipe: Recipe; servings: number }[]): ShoppingLine[] {
  const acc = new Map<string, Acc>();
  for (const { recipe, servings } of entries) {
    const factor = factorOf(servings, recipe.facts.servings);
    for (const item of recipe.ingredients.flatMap((g) => g.items)) {
      const it = scaleIngredient(item, factor);
      const key = `${normalizeSearch(it.name)}|${it.unit ?? ""}|${it.toTaste ? "t" : it.amount === undefined ? "n" : "a"}`;
      const [lo, hi] = it.amount === undefined ? [0, 0] : Array.isArray(it.amount) ? it.amount : [it.amount, it.amount];
      const cur = acc.get(key);
      if (cur) {
        cur.lo += lo;
        cur.hi += hi;
        cur.optionalOnly = cur.optionalOnly && Boolean(it.optional);
        cur.recipes.add(recipe.title);
      } else {
        acc.set(key, {
          name: it.name,
          unit: it.unit,
          lo,
          hi,
          toTaste: Boolean(it.toTaste),
          noAmount: it.amount === undefined && !it.toTaste,
          optionalOnly: Boolean(it.optional),
          recipes: new Set([recipe.title]),
        });
      }
    }
  }

  return [...acc.values()].map((a) => {
    const base: Ingredient = { name: a.name, unit: a.unit };
    if (a.toTaste) base.toTaste = true;
    else if (!a.noAmount) base.amount = a.lo === a.hi ? a.lo : [a.lo, a.hi];
    if (a.optionalOnly) base.optional = true;
    return { name: a.name, quantity: ingredientQuantity(base), recipes: [...a.recipes] };
  });
}

/** Plain text for Telegram/WhatsApp sharing. */
export function shoppingText(lines: ShoppingLine[], title = "لیست خرید راز سرآشپز"): string {
  return [title, "", ...lines.map((l) => `▫️ ${l.name}${l.quantity ? `: ${l.quantity}` : ""}`)].join("\n");
}
