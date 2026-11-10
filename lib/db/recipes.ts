import { getPool } from "./pool";
import { recipeSchema, type Recipe } from "@/lib/recipe/schema";

/**
 * Recipe storage. Holds premium text: only lib/recipe/load.ts and scripts may import this.
 * Rows are re-validated with the Zod schema on read, so a bad row fails loudly instead of rendering.
 */

export async function selectAllRecipes(): Promise<Recipe[]> {
  const { rows } = await getPool().query("SELECT slug, data FROM recipes ORDER BY slug");
  return rows.map((r) => {
    const parsed = recipeSchema.safeParse(r.data);
    if (!parsed.success) throw new Error(`Invalid recipe row "${r.slug}": ${parsed.error.message}`);
    return parsed.data;
  });
}

export async function upsertRecipe(r: Recipe): Promise<void> {
  await getPool().query(
    `INSERT INTO recipes (slug, status, access, data) VALUES ($1, $2, $3, $4)
     ON CONFLICT (slug) DO UPDATE SET status = $2, access = $3, data = $4, updated_at = now()`,
    [r.slug, r.status, r.access, JSON.stringify(r)],
  );
}

export async function listRecipeSlugsInDb(): Promise<string[]> {
  const { rows } = await getPool().query("SELECT slug FROM recipes ORDER BY slug");
  return rows.map((r) => r.slug);
}
