import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

const DEV_SECRET = "dev-only-secret-change-me";

/** AUTH_SECRET is mandatory in production (see lib/guard.ts); a fixed dev value is used locally. */
function secret(): string {
  return process.env.AUTH_SECRET || DEV_SECRET;
}

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** HMAC over phone+code: a leaked table cannot be brute-forced without the secret. */
export function hashOtp(phone: string, code: string): string {
  return createHmac("sha256", secret()).update(`${phone}:${code}`).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
}

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
