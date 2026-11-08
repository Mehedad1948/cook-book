import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { Recipe } from "@/lib/recipe/schema";
import { loadFullRecipe } from "@/lib/recipe/load";
import { hashToken } from "@/lib/auth/crypto";
import { dbConfigured } from "@/lib/db/pool";
import { findSessionUser } from "@/lib/db/sessions";
import { findUserById, type User } from "@/lib/db/users";
import { getActiveSubscription, type Subscription } from "@/lib/db/billing";

/**
 * Data Access Layer: the ONLY place that decides who may read what.
 * Authorization is checked here, close to the data, never in proxy.ts.
 *
 * Every call reads the session cookie, so callers must sit inside <Suspense>. The result is
 * memoized per request with React cache() and never stored in a shared ('use cache') scope.
 * Fail closed: any problem reading the session means "anonymous".
 */

export type Access = "anonymous" | "free" | "subscriber";
export type Viewer = {
  access: Access;
  user: Pick<User, "id" | "phone" | "name" | "role"> | null;
  subscription: Subscription | null;
};

export const SESSION_COOKIE = "rs_session";
const ANONYMOUS: Viewer = { access: "anonymous", user: null, subscription: null };

export const getViewer = cache(async (): Promise<Viewer> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !dbConfigured()) return ANONYMOUS;
  try {
    const session = await findSessionUser(hashToken(token));
    if (!session) return ANONYMOUS;
    const user = await findUserById(session.userId);
    if (!user) return ANONYMOUS;
    const subscription = await getActiveSubscription(user.id);
    return {
      access: subscription ? "subscriber" : "free",
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
      subscription,
    };
  } catch (e) {
    console.error("session lookup failed", e);
    return ANONYMOUS;
  }
});

export async function getAccess(): Promise<Access> {
  return (await getViewer()).access;
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

/** For server actions and pages that need a signed-in user. Returns null when signed out. */
export async function requireUser(): Promise<Viewer & { user: NonNullable<Viewer["user"]> }> {
  const v = await getViewer();
  if (!v.user) throw new Error("UNAUTHENTICATED");
  return v as Viewer & { user: NonNullable<Viewer["user"]> };
}
