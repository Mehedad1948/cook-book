/**
 * Source text for `npm run new-recipe <slug>`. The skeleton is schema-valid but deliberately
 * unfinished and marked status "draft", so it can never be published by accident: the validator
 * reports its problems as warnings until status becomes "published".
 */
export function skeletonFor(slug: string): string {
  return `import { defineRecipe } from "@/lib/recipe/schema";

// Follow docs/recipe-guide/README.md. Change status to "published" only when
// \`npm run validate:recipes\` reports no errors for this file.
export default defineRecipe({
  slug: "${slug}",
  status: "draft",
  access: "free",
  title: "عنوان دستور",
  category: "main",
  tags: [],
  summary: "یک یا دو جمله دربارهٔ غذا.",
  accent: { accent: "#5535c4", soft: "#d3c9fb", line: "#ddd5f8" },

  facts: { servings: 4, totalMinutes: 30, difficulty: 1 },

  ingredients: [{ items: [{ name: "مادهٔ اول", amount: 100, unit: "g" }] }],

  stages: [
    {
      title: "مرحلهٔ اول",
      actions: [{ text: "کار اول را انجام بده." }, { text: "کار دوم را انجام بده." }],
    },
  ],

  mistakes: [{ problem: "مشکل", fix: "علت و راه‌حل." }],

  storage: { lines: ["نگهداری."] },

  closing: "مقدارها نقطهٔ شروع‌اند.",
});
`;
}
