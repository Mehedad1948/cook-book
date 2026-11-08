import { getPool } from "./pool";

export async function insertSession(userId: string, tokenHash: string, ttlDays: number, userAgent: string | null): Promise<void> {
  await getPool().query(
    `INSERT INTO sessions (user_id, token_hash, expires_at, user_agent)
     VALUES ($1, $2, now() + make_interval(days => $3), $4)`,
    [userId, tokenHash, ttlDays, userAgent],
  );
}

/** Valid (unexpired) session joined to its user, or null. */
export async function findSessionUser(tokenHash: string): Promise<{ sessionId: string; userId: string } | null> {
  const { rows } = await getPool().query(
    "SELECT id, user_id FROM sessions WHERE token_hash = $1 AND expires_at > now()",
    [tokenHash],
  );
  return rows[0] ? { sessionId: rows[0].id, userId: rows[0].user_id } : null;
}

export async function deleteSessionByHash(tokenHash: string): Promise<void> {
  await getPool().query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash]);
}
