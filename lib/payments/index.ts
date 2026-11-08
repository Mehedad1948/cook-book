import { randomUUID } from "node:crypto";

/**
 * Payment gateway adapter. This project deliberately ships WITHOUT a real gateway (owner decision);
 * a real one is a new file lib/payments/<name>.ts implementing this interface, selected by
 * PAYMENT_PROVIDER. Only the gateway adapter changes: plans, subscriptions, idempotency and
 * the callback route stay as they are.
 */
export interface PaymentProvider {
  startPayment(input: { amountIRR: number; orderId: string; callbackUrl: string; mobile?: string }): Promise<{
    redirectUrl: string;
    authority: string;
  }>;
  verifyPayment(input: { authority: string; amountIRR: number }): Promise<{ ok: boolean; refId?: string; raw: unknown }>;
}

/** Test gateway: a local page stands in for the bank. Verification trusts any authority it issued. */
const fake: PaymentProvider = {
  async startPayment({ amountIRR }) {
    const authority = `FAKE-${randomUUID()}`;
    return { redirectUrl: `/payment/fake?authority=${authority}&amount=${amountIRR}`, authority };
  },
  async verifyPayment({ authority }) {
    const ok = authority.startsWith("FAKE-");
    return { ok, refId: ok ? `REF-${authority.slice(5, 13)}` : undefined, raw: { fake: true } };
  },
};

export const paymentProviderName = (env: NodeJS.ProcessEnv = process.env) => env.PAYMENT_PROVIDER || "fake";
export const isFakePayments = () => paymentProviderName() === "fake";

export function getPaymentProvider(): PaymentProvider {
  const name = paymentProviderName();
  if (name === "fake") return fake;
  throw new Error(`Payment provider "${name}" is not implemented. Add lib/payments/${name}.ts and register it in lib/payments/index.ts.`);
}
