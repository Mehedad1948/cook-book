import { recipes } from "../content/recipes";
import { checkRecipe } from "../lib/recipe/rules";

let errors = 0;
let warns = 0;
const seen = new Set<string>();
for (const r of recipes) {
  if (seen.has(r.slug)) {
    console.error(`✗ duplicate slug ${r.slug}`);
    errors++;
  }
  seen.add(r.slug);
  const issues = checkRecipe(r, r.slug);
  for (const i of issues) {
    const tag = i.level === "error" ? "✗" : "!";
    console.log(`${tag} ${r.slug} ${i.path}: ${i.message}`);
    if (i.level === "error") errors++;
    else warns++;
  }
}
console.log(`\n${recipes.length} recipes, ${errors} errors, ${warns} warnings`);
process.exit(errors ? 1 : 0);
