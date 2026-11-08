import pg from "pg";

/**
 * One pooled connection per server process (kept on globalThis so dev HMR does not leak pools).
 * Configure with DATABASE_URL, or DATABASE_HOST/PORT/USERNAME/PASSWORD/NAME.
 * Server-only: never import from a client component.
 */
const g = globalThis as unknown as { __pgPool?: pg.Pool };

export function getPool(): pg.Pool {
  if (!g.__pgPool) {
    const e = process.env;
    g.__pgPool = new pg.Pool(
      e.DATABASE_URL
        ? { connectionString: e.DATABASE_URL, max: 10 }
        : {
            host: e.DATABASE_HOST,
            port: e.DATABASE_PORT ? Number(e.DATABASE_PORT) : 5432,
            user: e.DATABASE_USERNAME,
            password: e.DATABASE_PASSWORD,
            database: e.DATABASE_NAME,
            max: 10,
          },
    );
  }
  return g.__pgPool;
}

export function dbConfigured(): boolean {
  const e = process.env;
  return Boolean(e.DATABASE_URL || (e.DATABASE_HOST && e.DATABASE_NAME));
}

export async function withTx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await getPool().connect();
  try {
    await c.query("BEGIN");
    const r = await fn(c);
    await c.query("COMMIT");
    return r;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
