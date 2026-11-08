import type { Recipe } from "./schema";

/** Only published recipes reach the catalog, search index, sitemap and pages. Drafts and reviews stay private. */
export const isPublished = (r: Pick<Recipe, "status">): boolean => r.status === "published";

export function publishedOnly<T extends Pick<Recipe, "status">>(list: T[]): T[] {
  return list.filter(isPublished);
}
