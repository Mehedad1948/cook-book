"use server";

import { revalidatePath } from "next/cache";
import { getViewer, getRecipeForViewer } from "@/lib/dal";
import { listSlugs } from "@/lib/recipe/load";
import { clampServings } from "@/lib/recipe/scale";
import { markCooked, setFavorite, setShoppingItem } from "@/lib/db/userdata";
import { recordEvent } from "@/lib/db/events";

/** Every action re-checks the session itself; the client is never trusted. */

export async function toggleFavoriteAction(slug: string, on: boolean): Promise<{ ok: boolean }> {
  const v = await getViewer();
  if (!v.user) return { ok: false };
  if (!(await listSlugs()).includes(slug)) return { ok: false };
  await setFavorite(v.user.id, slug, on);
  if (on) await recordEvent("favorite_add", { userId: v.user.id, slug });
  revalidatePath("/favorites");
  return { ok: true };
}

/** Shopping list is a subscriber feature and only for recipes the viewer may read. */
export async function setShoppingAction(slug: string, servings: number | null): Promise<{ ok: boolean }> {
  const v = await getViewer();
  if (!v.user || v.access !== "subscriber") return { ok: false };
  if (!(await getRecipeForViewer(slug))) return { ok: false };
  await setShoppingItem(v.user.id, slug, servings === null ? null : clampServings(servings));
  revalidatePath("/shopping-list");
  return { ok: true };
}

export async function cookStartAction(slug: string): Promise<void> {
  const v = await getViewer();
  if (!(await getRecipeForViewer(slug))) return;
  await recordEvent("cook_start", { userId: v.user?.id ?? null, slug });
}

export async function cookDoneAction(slug: string): Promise<void> {
  const v = await getViewer();
  if (!v.user || !(await getRecipeForViewer(slug))) return;
  await markCooked(v.user.id, slug);
}
