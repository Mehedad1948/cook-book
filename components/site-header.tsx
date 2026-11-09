import Link from "next/link";
import { Suspense } from "react";
import { HeaderAuth, LoginLink } from "./header-auth";
import { LogoMark } from "./icons";
import { BRAND, NAV } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="no-print sticky top-0 z-40 bg-paper/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-brand" aria-label={`${BRAND} - صفحهٔ اصلی`}>
          <LogoMark />
          <span className="font-brand text-2xl text-ink">{BRAND}</span>
        </Link>
        <nav aria-label="منوی اصلی" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-4 py-2 font-medium text-ink hover:bg-sunken">
              {n.label}
            </Link>
          ))}
        </nav>
        <Suspense fallback={<LoginLink />}>
          <HeaderAuth />
        </Suspense>
      </div>
    </header>
  );
}
