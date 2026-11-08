import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isFakePayments } from "@/lib/payments";
import { formatToman } from "@/lib/format";

export const metadata: Metadata = { title: "درگاه آزمایشی", robots: { index: false } };

/** Stands in for the bank while no real gateway is connected. Not reachable when another provider is configured. */
export default function FakeGatewayPage({ searchParams }: { searchParams: Promise<{ authority?: string; amount?: string }> }) {
  if (!isFakePayments()) notFound();
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-12">
      <Suspense fallback={<div className="skeleton h-56 w-full max-w-md" />}>
        <Gateway searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Gateway({ searchParams }: { searchParams: Promise<{ authority?: string; amount?: string }> }) {
  const { authority, amount } = await searchParams;
  if (!authority?.startsWith("FAKE-")) notFound();
  const cb = `/payment/callback?authority=${encodeURIComponent(authority)}`;
  return (
    <div className="card w-full max-w-md p-6 text-center">
      <p className="badge-premium mx-auto mb-3 w-fit rounded-full px-3 py-0.5 text-xs font-bold">درگاه آزمایشی</p>
      <h1 className="text-xl font-extrabold">پرداخت آزمایشی</h1>
      <p className="mt-2 text-muted">مبلغ: <strong className="text-ink">{formatToman(Number(amount) || 0)}</strong></p>
      <p className="mt-1 text-sm text-muted">هیچ پولی برداشت نمی‌شود.</p>
      <div className="mt-6 grid gap-3">
        <Link prefetch={false} href={`${cb}&status=OK`} className="btn btn-primary">پرداخت موفق</Link>
        <Link prefetch={false} href={`${cb}&status=NOK`} className="btn btn-ghost">انصراف</Link>
      </div>
    </div>
  );
}
