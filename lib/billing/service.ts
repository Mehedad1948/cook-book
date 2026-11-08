import { randomUUID } from "node:crypto";
import { getPlan } from "./plans";
import { getPaymentProvider, paymentProviderName } from "../payments";
import { createPayment, findPaymentByAuthority, markPaymentFailed, recordVerifiedPayment } from "../db/billing";
import { recordEvent } from "../db/events";
import { SITE_URL } from "../site";

/** Framework-free checkout flow. Route handlers and server actions are thin wrappers. */

export async function startCheckout(userId: string, planKey: string, mobile?: string): Promise<{ redirectUrl: string } | { error: string }> {
  const plan = getPlan(planKey);
  if (!plan) return { error: "این پلن وجود ندارد." };

  const { redirectUrl, authority } = await getPaymentProvider().startPayment({
    amountIRR: plan.priceIRR,
    orderId: randomUUID(),
    callbackUrl: `${SITE_URL}/payment/callback`,
    mobile,
  });
  await createPayment({ userId, planKey: plan.key, provider: paymentProviderName(), amountIRR: plan.priceIRR, authority });
  await recordEvent("payment_start", { userId, props: { plan: plan.key } });
  return { redirectUrl };
}

export type CompleteResult =
  | { status: "paid"; alreadyProcessed: boolean; periodEnd: Date }
  | { status: "failed" }
  | { status: "unknown" };

/**
 * Never trusts the browser redirect: access is granted only after the provider verifies the
 * authority server-side, and the grant is idempotent on that authority.
 */
export async function completePayment(authority: string, gatewayStatus: string): Promise<CompleteResult> {
  const pay = await findPaymentByAuthority(authority);
  if (!pay) return { status: "unknown" };

  if (pay.status === "failed") return { status: "failed" };

  if (pay.status === "paid") {
    const again = await recordVerifiedPayment(authority, undefined, 0);
    return { status: "paid", alreadyProcessed: true, periodEnd: again!.periodEnd };
  }

  if (gatewayStatus !== "OK") {
    await markPaymentFailed(authority);
    await recordEvent("payment_failed", { userId: pay.userId });
    return { status: "failed" };
  }

  const plan = getPlan(pay.planKey);
  if (!plan) return { status: "failed" };
  const v = await getPaymentProvider().verifyPayment({ authority, amountIRR: pay.amountIRR });
  if (!v.ok) {
    await markPaymentFailed(authority);
    await recordEvent("payment_failed", { userId: pay.userId });
    return { status: "failed" };
  }

  const res = await recordVerifiedPayment(authority, v.refId, plan.days);
  if (!res) return { status: "unknown" };
  if (res.created) await recordEvent("payment_success", { userId: pay.userId, props: { plan: plan.key } });
  return { status: "paid", alreadyProcessed: !res.created, periodEnd: res.periodEnd };
}
