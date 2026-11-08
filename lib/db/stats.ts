import { getPool } from "./pool";

export type Stats = {
  users: number;
  activeSubscribers: number;
  paidPayments: number;
  revenueIRR: number;
  events30d: { name: string; count: number }[];
  topCooked: { slug: string; count: number }[];
};

/** Read-only summary for the admin page. Everything is aggregated in SQL; no personal data is returned. */
export async function getStats(): Promise<Stats> {
  const p = getPool();
  const [u, s, pay, ev, top] = await Promise.all([
    p.query("SELECT count(*)::int AS n FROM users"),
    p.query("SELECT count(DISTINCT user_id)::int AS n FROM subscriptions WHERE period_start <= now() AND period_end > now()"),
    p.query("SELECT count(*)::int AS n, coalesce(sum(amount_irr), 0)::bigint AS total FROM payments WHERE status = 'paid'"),
    p.query(
      "SELECT name, count(*)::int AS count FROM events WHERE created_at > now() - interval '30 days' GROUP BY name ORDER BY count DESC",
    ),
    p.query(
      "SELECT recipe_slug AS slug, count(*)::int AS count FROM events WHERE name = 'cook_start' AND recipe_slug IS NOT NULL GROUP BY recipe_slug ORDER BY count DESC LIMIT 5",
    ),
  ]);
  return {
    users: u.rows[0].n,
    activeSubscribers: s.rows[0].n,
    paidPayments: pay.rows[0].n,
    revenueIRR: Number(pay.rows[0].total),
    events30d: ev.rows,
    topCooked: top.rows,
  };
}
