import { getPool } from "./pool";

export type EventName =
  | "signup"
  | "login"
  | "paywall_hit"
  | "payment_start"
  | "payment_success"
  | "payment_failed"
  | "cook_start"
  | "favorite_add";

/** First-party analytics. Best effort: a failure here must never break a request. */
export async function recordEvent(
  name: EventName,
  o: { userId?: string | null; slug?: string; props?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    await getPool().query("INSERT INTO events (name, user_id, recipe_slug, props) VALUES ($1,$2,$3,$4)", [
      name,
      o.userId ?? null,
      o.slug ?? null,
      JSON.stringify(o.props ?? {}),
    ]);
  } catch (e) {
    console.error("event failed", name, e);
  }
}
