"use client";

import { useOptimistic, useTransition } from "react";
import { toggleFavoriteAction, setShoppingAction } from "@/app/recipes/actions";
import { HeartIcon, ListIcon } from "../icons";
import { useServings } from "./servings";

/** Heart button. Optimistic: flips instantly, the server action confirms. */
export function FavoriteToggle({ slug, initial }: { slug: string; initial: boolean }) {
  const [on, setOn] = useOptimistic(initial, (_s, next: boolean) => next);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOn(!on);
          await toggleFavoriteAction(slug, !on);
        })
      }
      className="btn !min-h-11 !px-4 bg-surface text-ink"
    >
      <HeartIcon width={20} height={20} fill={on ? "currentColor" : "none"} style={{ color: on ? "#d6336c" : undefined }} />
      <span className="text-sm">{on ? "در علاقه‌مندی‌ها" : "ذخیره"}</span>
    </button>
  );
}

/** Adds the recipe, at the servings currently selected, to the shopping list (subscribers only). */
export function ShoppingToggle({ slug, initialServings }: { slug: string; initialServings: number | null }) {
  const { servings } = useServings();
  const [inList, setInList] = useOptimistic(initialServings, (_s, next: number | null) => next);
  const [pending, start] = useTransition();
  const changed = inList !== null && inList !== servings;
  return (
    <button
      type="button"
      className="btn btn-ghost !min-h-11 !px-4"
      aria-pressed={inList !== null}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const next = inList !== null && !changed ? null : servings;
          setInList(next);
          await setShoppingAction(slug, next);
        })
      }
    >
      <ListIcon width={20} height={20} />
      <span className="text-sm">{inList === null ? "افزودن به لیست خرید" : changed ? "به‌روزرسانی تعداد در لیست" : "در لیست خرید (حذف)"}</span>
    </button>
  );
}
