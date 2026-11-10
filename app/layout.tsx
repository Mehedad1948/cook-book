import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BottomNav } from "@/components/bottom-nav";
import { BRAND, SITE_URL } from "@/lib/site";

const vazir = localFont({
  src: [
    { path: "./fonts/Vazirmatn-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Vazirmatn-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Vazirmatn-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Vazirmatn-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-vazir",
  display: "swap",
  fallback: ["Tahoma", "sans-serif"],
});

const bahar = localFont({
  src: [{ path: "./fonts/Bahar-Bold.woff2", weight: "700", style: "normal" }],
  variable: "--font-bahar",
  display: "swap",
  fallback: ["Tahoma", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND} | دستور پخت‌های دقیق ایرانی`, template: `%s | ${BRAND}` },
  description:
    "دستور پخت غذاهای ایرانی با مقدار دقیق، حرارت و زمان، نشانهٔ آماده شدن هر مرحله و جدول اشتباه‌های رایج؛ تا بار اول درست دربیاید.",
  applicationName: BRAND,
  openGraph: { siteName: BRAND, locale: "fa_IR", type: "website" },
  twitter: { card: "summary_large_image" },
  // Pre-launch: keep search engines out until the site is ready. Remove to allow indexing.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#130f20" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazir.variable} ${bahar.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        >
          رفتن به محتوا
        </a>
        <SiteHeader />
        <main id="main" className="flex-1 pb-24 md:pb-0">
          {children}
        </main>
        <SiteFooter />
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
