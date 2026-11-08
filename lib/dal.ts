import "server-only";
import { cookies } from "next/headers";
import type { Recipe } from "@/lib/recipe/schema";
import { loadFullRecipe } from "@/lib/recipe/load";

/**
 * Data Access Layer: the ONLY place that decides who may read what.
 * Authorization is checked here, close to the data, never in proxy.ts.
 *
 * Phase 2 replaces the body of `readSession()` (cookie -> user -> subscription)
 * and nothing else: callers, rendering and caching stay as they are.
 *
 * Never cache an access decision in a shared ('use cache') function.
 */

export type Access = "anonymous" | "free" | "subscriber";

export const SESSION_COOKIE = "rs_session";
/** Dev-only preview cookie, see app/api/dev/access/route.ts. Ignored in production. */
export const DEV_ACCESS_COOKIE = "rs_dev_access";

async function readSession(): Promise<Access> {
  const jar = await cookies(); // request-time read: callers must sit inside <Suspense>

  if (process.env.NODE_ENV !== "production") {
    const dev = jar.get(DEV_ACCESS_COOKIE)?.value;
    if (dev === "subscriber" || dev === "free") return dev;
  }

  // TODO(phase 2): validate jar.get(SESSION_COOKIE), load the user, check the active subscription.
  void SESSION_COOKIE;
  return "anonymous";
}

export async function getAccess(): Promise<Access> {
  return readSession();
}

export function canReadWith(access: Access, recipe: Pick<Recipe, "access">): boolean {
  return recipe.access === "free" || access === "subscriber";
}

export async function canRead(recipe: Pick<Recipe, "access">): Promise<boolean> {
  return canReadWith(await getAccess(), recipe);
}

/** The full recipe if the current viewer may read it, otherwise null. */
export async function getRecipeForViewer(slug: string): Promise<Recipe | null> {
  const recipe = await loadFullRecipe(slug);
  if (!recipe) return null;
  return (await canRead(recipe)) ? recipe : null;
}
