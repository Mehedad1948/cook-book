/** Usage: npm run new-recipe <slug>  (ascii kebab-case). Creates a DRAFT skeleton in content/recipes/. */
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { skeletonFor } from "../lib/recipe/skeleton";

const slug = process.argv[2];
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error("Usage: npm run new-recipe <slug>   (ascii kebab-case, e.g. ghormeh-sabzi)");
  process.exit(1);
}
const file = join(process.cwd(), "content", "recipes", `${slug}.ts`);
if (existsSync(file)) {
  console.error(`content/recipes/${slug}.ts already exists`);
  process.exit(1);
}
writeFileSync(file, skeletonFor(slug));
console.log(`created content/recipes/${slug}.ts (status: draft). Next: npm run validate:recipes`);
