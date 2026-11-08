import { getPool } from "./pool";

export type OtpRow = { id: string; phone: string; codeHash: string; expiresAt: Date; attempts: number };
type Row = { id: string; phone: string; code_hash: string; expires_at: Date; attempts: number };

export async function createOtp(phone: string, codeHash: string, ip: string | null, ttlSeconds: number): Promise<void> {
  await getPool().query(
    `INSERT INTO otp_requests (phone, code_hash, expires_at, ip)
     VALUES ($1, $2, now() + make_interval(secs => $3), $4)`,
    [phone, codeHash, ttlSeconds, ip],
  );
}

export async function countRecentOtpsByPhone(phone: string, minutes: number): Promise<number> {
  const { rows } = await getPool().query(
    "SELECT count(*)::int AS n FROM otp_requests WHERE phone = $1 AND created_at > now() - make_interval(mins => $2)",
    [phone, minutes],
  );
  return rows[0].n;
}

export async function countRecentOtpsByIp(ip: string, minutes: number): Promise<number> {
  const { rows } = await getPool().query(
    "SELECT count(*)::int AS n FROM otp_requests WHERE ip = $1 AND created_at > now() - make_interval(mins => $2)",
    [ip, minutes],
  );
  return rows[0].n;
}

/** The newest code that is neither used nor expired. A new request supersedes older ones. */
export async function findActiveOtp(phone: string): Promise<OtpRow | null> {
  const { rows } = await getPool().query<Row>(
    `SELECT id, phone, code_hash, expires_at, attempts FROM otp_requests
     WHERE phone = $1 AND consumed_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [phone],
  );
  const r = rows[0];
  return r ? { id: r.id, phone: r.phone, codeHash: r.code_hash, expiresAt: r.expires_at, attempts: r.attempts } : null;
}

/**
 * Atomically claims one verification attempt. Concurrent guesses cannot exceed `max`: the
 * counter is incremented inside the same statement that checks it. Returns false when exhausted.
 */
export async function claimOtpAttempt(id: string, max: number): Promise<boolean> {
  const { rowCount } = await getPool().query(
    "UPDATE otp_requests SET attempts = attempts + 1 WHERE id = $1 AND attempts < $2 AND consumed_at IS NULL",
    [id, max],
  );
  return rowCount === 1;
}

/** Single use: returns true only for the one caller that consumed it. */
export async function consumeOtp(id: string): Promise<boolean> {
  const { rowCount } = await getPool().query(
    "UPDATE otp_requests SET consumed_at = now() WHERE id = $1 AND consumed_at IS NULL",
    [id],
  );
  return rowCount === 1;
}

export async function deleteOtpsByPhone(phone: string): Promise<void> {
  await getPool().query("DELETE FROM otp_requests WHERE phone = $1", [phone]);
}
