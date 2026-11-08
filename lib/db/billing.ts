import { getPool, withTx } from "./pool";
import { nextPeriod } from "../billing/subscription";

export type Subscription = { id: string; planKey: string; periodStart: Date; periodEnd: Date };

/**
 * Active right now = some purchased period contains "now". `periodEnd` is the END OF ALL PAID
 * COVERAGE (renewals are queued back to back), so a renewal made early shows the full date.
 */
export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  const { rows } = await getPool().query(
    `SELECT id, plan_key, period_start,
            (SELECT max(period_end) FROM subscriptions s2 WHERE s2.user_id = $1) AS total_end
     FROM subscriptions
     WHERE user_id = $1 AND period_start <= now() AND period_end > now()
     ORDER BY period_end DESC LIMIT 1`,
    [userId],
  );
  const r = rows[0];
  return r ? { id: r.id, planKey: r.plan_key, periodStart: r.period_start, periodEnd: r.total_end } : null;
}

// ---------------------------------------------------------------- payments

export type PaymentRow = {
  id: string;
  userId: string;
  planKey: string;
  provider: string;
  amountIRR: number;
  status: "pending" | "paid" | "failed";
  authority: string;
  refId: string | null;
  createdAt: Date;
  verifiedAt: Date | null;
};
type PRow = {
  id: string;
  user_id: string;
  plan_key: string;
  provider: string;
  amount_irr: string;
  status: PaymentRow["status"];
  authority: string;
  ref_id: string | null;
  created_at: Date;
  verified_at: Date | null;
};
const mapPayment = (r: PRow): PaymentRow => ({
  id: r.id,
  userId: r.user_id,
  planKey: r.plan_key,
  provider: r.provider,
  amountIRR: Number(r.amount_irr),
  status: r.status,
  authority: r.authority,
  refId: r.ref_id,
  createdAt: r.created_at,
  verifiedAt: r.verified_at,
});

export async function createPayment(p: {
  userId: string;
  planKey: string;
  provider: string;
  amountIRR: number;
  authority: string;
}): Promise<PaymentRow> {
  const { rows } = await getPool().query<PRow>(
    "INSERT INTO payments (user_id, plan_key, provider, amount_irr, authority) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [p.userId, p.planKey, p.provider, p.amountIRR, p.authority],
  );
  return mapPayment(rows[0]);
}

export async function findPaymentByAuthority(authority: string): Promise<PaymentRow | null> {
  const { rows } = await getPool().query<PRow>("SELECT * FROM payments WHERE authority = $1", [authority]);
  return rows[0] ? mapPayment(rows[0]) : null;
}

export async function listPaidPayments(userId: string, limit = 10): Promise<PaymentRow[]> {
  const { rows } = await getPool().query<PRow>(
    "SELECT * FROM payments WHERE user_id = $1 AND status = 'paid' ORDER BY created_at DESC LIMIT $2",
    [userId, limit],
  );
  return rows.map(mapPayment);
}

/** Only a still-pending payment can fail; a paid one is never downgraded by a late callback. */
export async function markPaymentFailed(authority: string): Promise<void> {
  await getPool().query("UPDATE payments SET status = 'failed' WHERE authority = $1 AND status = 'pending'", [authority]);
}

/**
 * Idempotent on `authority`: the payment row is locked, so concurrent or replayed callbacks
 * produce exactly one subscription period (payment_id is also UNIQUE on subscriptions).
 */
export async function recordVerifiedPayment(
  authority: string,
  refId: string | undefined,
  days: number,
  now = new Date(),
): Promise<{ created: boolean; periodEnd: Date } | null> {
  return withTx(async (c) => {
    const { rows } = await c.query<PRow>("SELECT * FROM payments WHERE authority = $1 FOR UPDATE", [authority]);
    const pay = rows[0];
    if (!pay) return null;

    if (pay.status === "failed") return null; // terminal: a cancelled payment cannot be revived by a later callback

    if (pay.status === "paid") {
      const s = await c.query("SELECT period_end FROM subscriptions WHERE payment_id = $1", [pay.id]);
      return { created: false, periodEnd: s.rows[0].period_end as Date };
    }

    // serialize per user so two different purchases cannot both start "now"
    await c.query("SELECT 1 FROM users WHERE id = $1 FOR UPDATE", [pay.user_id]);
    const cur = await c.query("SELECT max(period_end) AS e FROM subscriptions WHERE user_id = $1", [pay.user_id]);
    const { start, end } = nextPeriod(cur.rows[0].e as Date | null, now, days);

    await c.query("UPDATE payments SET status = 'paid', ref_id = $2, verified_at = now() WHERE id = $1", [pay.id, refId ?? null]);
    await c.query(
      `INSERT INTO subscriptions (user_id, plan_key, period_start, period_end, source, payment_id)
       VALUES ($1, $2, $3, $4, 'payment', $5)`,
      [pay.user_id, pay.plan_key, start, end, pay.id],
    );
    return { created: true, periodEnd: end };
  });
}
