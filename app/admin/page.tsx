import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getViewer } from "@/lib/dal";
import { getStats } from "@/lib/db/stats";
import { fa, formatToman } from "@/lib/format";

export const metadata: Metadata = { title: "مدیریت", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="section-title mb-6">خلاصهٔ مدیریت</h1>
      <Suspense fallback={<div className="skeleton h-64" />}>
        <Body />
      </Suspense>
    </div>
  );
}

/** Authorization lives here, next to the data (not in proxy.ts): signed in AND role = admin, else 404. */
async function Body() {
  const v = await getViewer();
  if (!v.user) redirect("/login?next=/admin");
  if (v.user.role !== "admin") notFound();

  const s = await getStats();
  const cards = [
    ["کاربران", fa(s.users)],
    ["مشترکین فعال", fa(s.activeSubscribers)],
    ["پرداخت‌های موفق", fa(s.paidPayments)],
    ["درآمد", formatToman(s.revenueIRR)],
  ];
  return (
    <div className="grid gap-6">
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([k, val]) => (
          <div key={k} className="card p-4">
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="text-xl font-extrabold">{val}</dd>
          </div>
        ))}
      </dl>
      <section className="card p-5">
        <h2 className="mb-2 text-lg font-extrabold">رویدادهای ۳۰ روز اخیر</h2>
        {s.events30d.length ? (
          <ul className="divide-y divide-line">
            {s.events30d.map((e) => (
              <li key={e.name} className="flex justify-between py-2"><span dir="ltr">{e.name}</span><strong>{fa(e.count)}</strong></li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">هنوز رویدادی ثبت نشده است.</p>
        )}
      </section>
      <section className="card p-5">
        <h2 className="mb-2 text-lg font-extrabold">بیشترین شروع حالت آشپزی</h2>
        {s.topCooked.length ? (
          <ul className="divide-y divide-line">
            {s.topCooked.map((e) => (
              <li key={e.slug} className="flex justify-between py-2"><span dir="ltr">{e.slug}</span><strong>{fa(e.count)}</strong></li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">هنوز دادهای نیست.</p>
        )}
      </section>
    </div>
  );
}
