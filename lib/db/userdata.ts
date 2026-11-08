import { getPool } from "./pool";

/** Per-user data: favorites, shopping list, cooked log. All queries are scoped by user id. */

export async function setFavorite(userId: string, slug: string, on: boolean): Promise<void> {
  if (on) {
    await getPool().query(
      "INSERT INTO favorites (user_id, recipe_slug) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, slug],
    );
  } else {
    await getPool().query("DELETE FROM favorites WHERE user_id = $1 AND recipe_slug = $2", [userId, slug]);
  }
}

export async function isFavorite(userId: string, slug: string): Promise<boolean> {
  const { rowCount } = await getPool().query("SELECT 1 FROM favorites WHERE user_id = $1 AND recipe_slug = $2", [userId, slug]);
  return rowCount === 1;
}

export async function listFavoriteSlugs(userId: string): Promise<string[]> {
  const { rows } = await getPool().query(
    "SELECT recipe_slug FROM favorites WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  return rows.map((r) => r.recipe_slug);
}

export async function setShoppingItem(userId: string, slug: string, servings: number | null): Promise<void> {
  if (servings === null) {
    await getPool().query("DELETE FROM shopping_list WHERE user_id = $1 AND recipe_slug = $2", [userId, slug]);
    return;
  }
  await getPool().query(
    `INSERT INTO shopping_list (user_id, recipe_slug, servings) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, recipe_slug) DO UPDATE SET servings = EXCLUDED.servings`,
    [userId, slug, servings],
  );
}

export async function listShopping(userId: string): Promise<{ slug: string; servings: number }[]> {
  const { rows } = await getPool().query(
    "SELECT recipe_slug, servings FROM shopping_list WHERE user_id = $1 ORDER BY added_at",
    [userId],
  );
  return rows.map((r) => ({ slug: r.recipe_slug, servings: r.servings }));
}

export async function markCooked(userId: string, slug: string): Promise<void> {
  await getPool().query("INSERT INTO cooked_log (user_id, recipe_slug) VALUES ($1, $2)", [userId, slug]);
}

export async function recentlyCooked(userId: string, limit = 6): Promise<string[]> {
  const { rows } = await getPool().query(
    "SELECT recipe_slug FROM cooked_log WHERE user_id = $1 GROUP BY recipe_slug ORDER BY max(at) DESC LIMIT $2",
    [userId, limit],
  );
  return rows.map((r) => r.recipe_slug);
}
