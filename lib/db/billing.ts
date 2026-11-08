import { getPool } from "./pool";

export type Subscription = { id: string; planKey: string; periodStart: Date; periodEnd: Date };

/** The subscription period that is active right now (end in the future), latest end wins. */
export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  const { rows } = await getPool().query(
    `SELECT id, plan_key, period_start, period_end FROM subscriptions
     WHERE user_id = $1 AND period_start <= now() AND period_end > now()
     ORDER BY period_end DESC LIMIT 1`,
    [userId],
  );
  const r = rows[0];
  return r ? { id: r.id, planKey: r.plan_key, periodStart: r.period_start, periodEnd: r.period_end } : null;
}
