import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "نتیجهٔ پرداخت", robots: { index: false } };

export default function ResultPage({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-12">
      <Suspense fallback={<div className="skeleton h-48 w-full max-w-md" />}>
        <Result searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Result({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { r } = await searchParams;
  const paid = r === "paid";
  return (
    <div className="card w-full max-w-md p-8 text-center" role="status">
      <h1 className="text-2xl font-extrabold">{paid ? "پرداخت موفق بود" : r === "failed" ? "پرداخت انجام نشد" : "پرداخت پیدا نشد"}</h1>
      <p className="mt-3 text-muted">
        {paid
          ? "اشتراکت فعال شد. همهٔ دستورهای ویژه برایت باز است."
          : r === "failed"
            ? "مبلغی از حسابت کم نشده است. هر زمان خواستی دوباره امتحان کن."
            : "اگر مبلغی از حسابت کم شده، با ما تماس بگیر تا پیگیری کنیم."}
      </p>
      <div className="mt-6 grid gap-3">
        <Link href={paid ? "/recipes" : "/pricing"} className="btn btn-primary">{paid ? "دیدن دستورها" : "بازگشت به اشتراک‌ها"}</Link>
        <Link href="/account" className="btn btn-ghost">حساب من</Link>
      </div>
    </div>
  );
}
