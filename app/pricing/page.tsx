import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { PLANS } from "@/lib/billing/plans";
import { isFakePayments } from "@/lib/payments";
import { fa, formatToman } from "@/lib/format";
import { checkoutAction } from "./actions";

export const metadata: Metadata = {
  title: "اشتراک",
  description: "اشتراک راز سرآشپز: دسترسی به همهٔ دستورهای ویژه، پیش‌پرداخت و بدون تمدید خودکار.",
  alternates: { canonical: "/pricing" },
};

const PERKS = [
  "همهٔ دستورهای ویژه با مقدار دقیق و نشانه‌های هر مرحله",
  "تغییر تعداد نفرات و محاسبهٔ خودکار مقدار مواد",
  "جدول اشتباه‌های رایج، نگهداری و فریز",
  "دستورهای جدید با اضافه شدن به سایت",
  "پیش‌پرداخت؛ هیچ مبلغی خودکار برداشت نمی‌شود",
];

export default function PricingPage() {
  const test = isFakePayments();
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="section-title">اشتراک راز سرآشپز</h1>
      <p className="mb-6 mt-1 max-w-2xl text-muted">
        دستورهای رایگان همیشه رایگان می‌مانند. اشتراک، دستورهای ویژه و جزئیات کامل آن‌ها را باز می‌کند.
      </p>

      {test && (
        <p role="note" className="mb-6 rounded-2xl border border-dashed border-brand bg-brand-soft p-3 text-sm">
          <strong>حالت آزمایشی:</strong> درگاه پرداخت واقعی وصل نیست و قیمت‌ها آزمایشی است. پرداخت در یک صفحهٔ شبیه‌ساز انجام می‌شود و پولی کم نمی‌شود.
        </p>
      )}

      <ul className="mb-8 grid gap-2">
        {PERKS.map((p) => (
          <li key={p} className="flex items-start gap-2">
            <CheckIcon className="mt-1.5 shrink-0 text-olive" width={18} height={18} />
            {p}
          </li>
        ))}
      </ul>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <form key={p.key} action={checkoutAction} className={`card flex flex-col p-6 ${p.popular ? "ring-2 ring-brand" : ""}`}>
            <input type="hidden" name="plan" value={p.key} />
            {p.popular && <p className="badge-premium mb-2 w-fit rounded-full px-3 py-0.5 text-xs font-bold">محبوب‌ترین</p>}
            <h2 className="text-xl font-extrabold">{p.name}</h2>
            <p className="text-muted">{fa(p.days)} روز دسترسی</p>
            <p className="my-5 text-2xl font-extrabold">{formatToman(p.priceIRR)}</p>
            <button className={`btn mt-auto ${p.popular ? "btn-primary" : "btn-ghost"}`}>خرید این پلن</button>
          </form>
        ))}
      </div>

      <p className="mt-8 text-muted">
        پرداخت با هر کارت بانکی انجام می‌شود. تا خرید اشتراک،{" "}
        <Link href="/recipes" className="font-bold text-brand-ink underline">دستورهای رایگان</Link> را ببین.
      </p>
    </div>
  );
}
