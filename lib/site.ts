export const BRAND = "راز سرآشپز";
export const BRAND_LATIN = "Raze Sarashpaz";

/** Set NEXT_PUBLIC_SITE_URL in production; used for canonical URLs, sitemap and JSON-LD. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const NAV = [
  { href: "/", label: "خانه" },
  { href: "/recipes", label: "دستور پخت‌ها" },
  { href: "/pricing", label: "اشتراک" },
] as const;
