import type { Metadata } from "next";
import { BRAND } from "@/lib/site";

export const metadata: Metadata = { title: "دربارهٔ ما", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <h1 className="section-title mb-4">دربارهٔ {BRAND}</h1>
      <div className="grid gap-4 leading-9">
        <p>{BRAND} برای کسی ساخته شده که نمی‌خواهد مواد و وقتش هدر برود. هر دستور مقدار دقیق مواد، حرارت و زمان هر مرحله، نشانهٔ دیدنی آماده شدن و جدول اشتباه‌های رایج دارد.</p>
        <h2 className="mt-2 text-xl font-extrabold">قول ما</h2>
        <ul className="list-disc ps-6">
          <li>دستورهای رایگان واقعاً کامل‌اند؛ همان جزئیاتی که مشترک‌ها می‌بینند.</li>
          <li>روش هر دستور با شیوهٔ واقعی پخت آن غذا سنجیده می‌شود و روش‌های نادرست حذف می‌شوند.</li>
          <li>اشتراک پیش‌پرداخت است و خودکار تمدید نمی‌شود.</li>
          <li>برای ورود فقط شمارهٔ موبایل لازم است و نمایهٔ عمومی وجود ندارد.</li>
        </ul>
      </div>
    </div>
  );
}
