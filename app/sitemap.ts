import type { MetadataRoute } from "next";
import { listSlugs } from "@/lib/recipe/load";
import { CATEGORIES } from "@/lib/recipe/schema";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await listSlugs();
  return [
    "",
    "/recipes",
    "/pricing",
    "/about",
    "/terms",
    "/privacy",
    "/refund",
    ...CATEGORIES.map((c) => `/category/${c}`),
    ...slugs.map((s) => `/recipes/${s}`),
  ].map((path) => ({ url: `${SITE_URL}${path}` }));
}
