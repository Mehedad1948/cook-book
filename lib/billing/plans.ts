/**
 * Plans. Money is Rial integers. The prices below are TEST VALUES, not market research:
 * the owner must set real prices (docs/app-guide section 9.2). The UI labels them as test
 * prices whenever PAYMENT_PROVIDER is "fake".
 */
export type PlanKey = "monthly" | "quarterly" | "yearly";
export type Plan = { key: PlanKey; name: string; days: number; priceIRR: number; popular?: boolean };

export const PLANS: Plan[] = [
  { key: "monthly", name: "ماهانه", days: 30, priceIRR: 1_500_000 },
  { key: "quarterly", name: "سه‌ماهه", days: 90, priceIRR: 3_600_000, popular: true },
  { key: "yearly", name: "سالانه", days: 365, priceIRR: 12_000_000 },
];

export const getPlan = (key: string): Plan | undefined => PLANS.find((p) => p.key === key);
