/**
 * Copies content/recipes/*.ts into the recipes table (insert or update by slug).
 * Usage: npm run recipes:push   (runs validate:recipes first, so invalid published recipes never reach the DB)
 * Rows whose file was deleted are reported, not removed.
 */
import { recipes } from "../content/recipes";
import { getPool } from "../lib/db/pool";
import { listRecipeSlugsInDb, upsertRecipe } from "../lib/db/recipes";

async function main() {
  for (const r of recipes) {
    await upsertRecipe(r);
    console.log(`pushed ${r.slug} [${r.status}, ${r.access}]`);
  }
  const files = new Set(recipes.map((r) => r.slug));
  const orphans = (await listRecipeSlugsInDb()).filter((s) => !files.has(s));
  if (orphans.length) console.log(`! in the database but not in content/recipes: ${orphans.join(", ")}`);
  console.log(`${recipes.length} recipes pushed`);
  await getPool().end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
