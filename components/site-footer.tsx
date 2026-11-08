import Link from "next/link";
import { LogoMark } from "./icons";
import { BRAND } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="no-print mt-16 border-t border-line bg-sunken">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 text-brand">
            <LogoMark />
            <span className="text-lg font-extrabold text-ink">{BRAND}</span>
          </div>
          <p className="mt-3 text-sm text-muted">
            دستورهایی که بار اول درست درمی‌آیند: مقدار دقیق، حرارت و زمان، نشانهٔ آماده شدن و جدول اشتباه‌های رایج.
          </p>
        </div>
        <nav aria-label="پیوندها" className="grid content-start gap-2 text-sm">
          <Link href="/recipes" className="hover:text-brand-ink">همهٔ دستور پخت‌ها</Link>
          <Link href="/pricing" className="hover:text-brand-ink">اشتراک</Link>
          <Link href="/about" className="hover:text-brand-ink">دربارهٔ ما</Link>
          <Link href="/terms" className="hover:text-brand-ink">قوانین</Link>
          <Link href="/privacy" className="hover:text-brand-ink">حریم خصوصی</Link>
          <Link href="/refund" className="hover:text-brand-ink">بازگشت وجه</Link>
        </nav>
        <p className="text-sm text-muted">
          شمارهٔ موبایل تنها چیزی است که برای ورود لازم داریم. نمایهٔ عمومی نداریم و شمارهٔ شما هرگز نمایش یا به اشتراک گذاشته نمی‌شود.
        </p>
      </div>
    </footer>
  );
}
