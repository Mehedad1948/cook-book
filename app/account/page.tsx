import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/dal";
import { maskPhone } from "@/lib/auth/phone";
import { formatJalali, formatToman } from "@/lib/format";
import { listPaidPayments } from "@/lib/db/billing";
import { getPlan } from "@/lib/billing/plans";
import { logoutAction } from "./actions";

export const metadata: Metadata = { title: "حساب من", robots: { index: false } };

export default function AccountPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="section-title mb-6">حساب من</h1>
      <Suspense fallback={<div className="skeleton h-56" />}>
        <AccountBody />
      </Suspense>
    </div>
  );
}

async function AccountBody() {
  const v = await getViewer();
  if (!v.user) redirect("/login?next=/account");

  const payments = await listPaidPayments(v.user.id, 5);

  return (
    <div className="grid max-w-xl gap-4">
      <section className="card p-5">
        <p className="text-sm text-muted">شمارهٔ موبایل</p>
        <p className="text-lg font-bold" dir="ltr" style={{ textAlign: "start" }}>{maskPhone(v.user.phone)}</p>
      </section>

      <section className="card p-5">
        <p className="text-sm text-muted">اشتراک</p>
        {v.subscription ? (
          <>
            <p className="text-lg font-bold">فعال تا {formatJalali(v.subscription.periodEnd)}</p>
            <p className="text-sm text-muted">تمدید خودکار ندارد. هر زمان خواستی دوباره تمدید کن؛ زمان جدید بعد از پایان زمان فعلی شروع می‌شود.</p>
          </>
        ) : (
          <p className="text-lg font-bold">اشتراک فعال نداری</p>
        )}
        <Link href="/pricing" className="btn btn-primary mt-4">{v.subscription ? "تمدید اشتراک" : "مشاهدهٔ اشتراک‌ها"}</Link>
      </section>

      {payments.length > 0 && (
        <section className="card p-5">
          <p className="mb-2 text-sm text-muted">پرداخت‌ها</p>
          <ul className="divide-y divide-line">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                <span>{getPlan(p.planKey)?.name ?? p.planKey} · {formatJalali(p.verifiedAt ?? p.createdAt)}</span>
                <span className="font-bold">{formatToman(p.amountIRR)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form action={logoutAction}>
        <button className="btn btn-ghost w-full">خروج از حساب</button>
      </form>
    </div>
  );
}
