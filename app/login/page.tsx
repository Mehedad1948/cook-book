import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ورود",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-12">
      <div className="card w-full max-w-md p-8 text-center">
        <h1 className="text-2xl font-extrabold">ورود با شمارهٔ موبایل</h1>
        <p className="mt-3 text-muted">
          ورود و ثبت‌نام با کد یک‌بارمصرف در مرحلهٔ بعد فعال می‌شود. فقط شمارهٔ موبایل لازم است و هیچ نمایهٔ عمومی ساخته نمی‌شود.
        </p>
        <Link href="/recipes" className="btn btn-primary mt-6">دیدن دستورهای رایگان</Link>
      </div>
    </div>
  );
}
