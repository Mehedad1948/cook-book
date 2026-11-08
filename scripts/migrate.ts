/** Applies db/migrations/*.sql in order, once each. Usage: npm run db:migrate */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getPool } from "../lib/db/pool";

async function main() {
  const pool = getPool();
  await pool.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const done = new Set((await pool.query("SELECT name FROM schema_migrations")).rows.map((r) => r.name));
  const dir = join(process.cwd(), "db", "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    if (done.has(f)) continue;
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      await c.query(readFileSync(join(dir, f), "utf8"));
      await c.query("INSERT INTO schema_migrations (name) VALUES ($1)", [f]);
      await c.query("COMMIT");
      console.log("applied", f);
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  }
  console.log("database is up to date");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
