import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "اشتراک",
  description: "اشتراک راز سرآشپز: دسترسی به همهٔ دستورهای ویژه، پیش‌پرداخت و بدون تمدید خودکار.",
  alternates: { canonical: "/pricing" },
};

const PERKS = [
  "همهٔ دستورهای ویژه با مقدار دقیق و نشانه‌های هر مرحله",
  "جدول اشتباه‌های رایج، نگهداری و فریز",
  "دستورهای جدید با اضافه شدن به سایت",
  "پیش‌پرداخت؛ هیچ مبلغی خودکار برداشت نمی‌شود",
];

const PLANS = [
  { name: "ماهانه", days: "۳۰ روز" },
  { name: "سه‌ماهه", days: "۹۰ روز", popular: true },
  { name: "سالانه", days: "۳۶۵ روز" },
];

export default function PricingPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="section-title">اشتراک راز سرآشپز</h1>
      <p className="mb-8 mt-1 max-w-2xl text-muted">
        دستورهای رایگان همیشه رایگان می‌مانند. اشتراک، دستورهای ویژه و جزئیات کامل آن‌ها را باز می‌کند.
      </p>

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
          <div key={p.name} className={`card p-6 ${p.popular ? "ring-2 ring-brand" : ""}`}>
            {p.popular && <p className="badge-premium mb-2 inline-block rounded-full px-3 py-0.5 text-xs font-bold">محبوب‌ترین</p>}
            <h2 className="text-xl font-extrabold">{p.name}</h2>
            <p className="text-muted">{p.days} دسترسی</p>
            <p className="my-6 text-2xl font-extrabold text-muted">به‌زودی</p>
            <button className="btn btn-ghost w-full" disabled aria-disabled="true">پرداخت به‌زودی فعال می‌شود</button>
          </div>
        ))}
      </div>

      <p className="mt-8 text-muted">
        قیمت‌ها و درگاه پرداخت در مرحلهٔ بعد اضافه می‌شود. تا آن زمان{" "}
        <Link href="/recipes" className="font-bold text-brand-ink underline">دستورهای رایگان</Link> را ببین.
      </p>
    </div>
  );
}
