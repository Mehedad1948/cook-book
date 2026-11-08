import { test, after } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, maskPhone } from "../lib/auth/phone";
import { configProblems } from "../lib/guard";
import { safeNext } from "../lib/auth/next";
import { dbConfigured, getPool } from "../lib/db/pool";
import { hashToken } from "../lib/auth/crypto";
import { OTP_MAX_ATTEMPTS, PHONE_LIMIT, requestOtp, verifyOtp } from "../lib/auth/service";
import { findSessionUser } from "../lib/db/sessions";
import { deleteOtpsByPhone } from "../lib/db/otp";
import { deleteUserByPhone } from "../lib/db/users";

test("phone normalization", () => {
  for (const v of ["09123456789", "9123456789", "+989123456789", "00989123456789", "۰۹۱۲۳۴۵۶۷۸۹", "0912 345 6789"]) {
    assert.equal(normalizePhone(v), "+989123456789", v);
  }
  for (const v of ["", "0812345678", "0912345", "abc", "+4915112345678"]) assert.equal(normalizePhone(v), null, v);
  assert.equal(maskPhone("+989123456789"), "۰۹۱۲ ••• ۶۷۸۹");
});

test("open redirects are blocked", () => {
  assert.equal(safeNext("/recipes/x"), "/recipes/x");
  for (const v of ["//evil.com", "https://evil.com", "/\\evil.com", undefined, 5]) assert.equal(safeNext(v), "/account");
});

test("production guard: inline SMS with a real payment provider is refused", () => {
  const ok = { NODE_ENV: "production", SMS_PROVIDER: "inline", PAYMENT_PROVIDER: "fake", AUTH_SECRET: "x".repeat(40), DATABASE_HOST: "h", DATABASE_NAME: "d" };
  assert.deepEqual(configProblems(ok), []);
  assert.equal(configProblems({ ...ok, PAYMENT_PROVIDER: "zarinpal" }).length, 1);
  assert.equal(configProblems({ ...ok, SMS_PROVIDER: undefined, PAYMENT_PROVIDER: "zarinpal" }).length, 1);
  assert.equal(configProblems({ ...ok, AUTH_SECRET: "short" }).length, 1);
  assert.equal(configProblems({ ...ok, DATABASE_HOST: undefined }).length, 1);
  assert.deepEqual(configProblems({ NODE_ENV: "development", PAYMENT_PROVIDER: "zarinpal" }), []);
  assert.deepEqual(configProblems({ ...ok, PAYMENT_PROVIDER: "zarinpal", ALLOW_INSECURE_LOCAL: "1" }), []);
});

// ---- integration tests against the real Postgres (skipped when no database is configured) ----
const db = { skip: !dbConfigured() && "no database configured" };
const phones: string[] = [];
const newPhone = () => {
  const p = "+98900" + String(Math.floor(1000000 + Math.random() * 8999999));
  phones.push(p);
  return p;
};
after(async () => {
  if (!dbConfigured()) return;
  for (const p of phones) {
    await deleteOtpsByPhone(p);
    await deleteUserByPhone(p);
  }
  await getPool().end();
});

test("inline provider returns a code; correct code logs in once", db, async () => {
  const phone = newPhone();
  const r = await requestOtp(phone, "203.0.113.1");
  assert.ok(r.ok && r.devCode && /^\d{6}$/.test(r.devCode));
  if (!r.ok || !r.devCode) return;

  const stored = await getPool().query("SELECT code_hash FROM otp_requests WHERE phone = $1", [phone]);
  assert.ok(!JSON.stringify(stored.rows).includes(r.devCode), "code must not be stored in clear text");

  const ok = await verifyOtp(phone, r.devCode, "test");
  assert.ok(ok.ok);
  if (!ok.ok) return;
  assert.ok(await findSessionUser(hashToken(ok.token)));
  const again = await verifyOtp(phone, r.devCode, "test");
  assert.equal(again.ok, false, "a code is single use");
});

test("wrong codes are attempt-limited", db, async () => {
  const phone = newPhone();
  const r = await requestOtp(phone, null);
  assert.ok(r.ok && r.devCode);
  if (!r.ok || !r.devCode) return;
  const wrong = r.devCode === "000000" ? "111111" : "000000";
  for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) assert.equal((await verifyOtp(phone, wrong, null)).ok, false);
  const late = await verifyOtp(phone, r.devCode, null);
  assert.equal(late.ok, false, "the right code is refused after too many attempts");
});

test("expired codes are refused", db, async () => {
  const phone = newPhone();
  const r = await requestOtp(phone, null);
  assert.ok(r.ok && r.devCode);
  if (!r.ok || !r.devCode) return;
  await getPool().query("UPDATE otp_requests SET expires_at = now() - interval '1 second' WHERE phone = $1", [phone]);
  assert.equal((await verifyOtp(phone, r.devCode, null)).ok, false);
});

test("requests are rate-limited per phone", db, async () => {
  const phone = newPhone();
  for (let i = 0; i < PHONE_LIMIT.count; i++) assert.ok((await requestOtp(phone, null)).ok);
  assert.equal((await requestOtp(phone, null)).ok, false);
});

test("a new code supersedes the previous one", db, async () => {
  const phone = newPhone();
  const a = await requestOtp(phone, null);
  const b = await requestOtp(phone, null);
  assert.ok(a.ok && b.ok && a.devCode && b.devCode);
  if (!a.ok || !b.ok || !a.devCode || !b.devCode || a.devCode === b.devCode) return;
  assert.equal((await verifyOtp(phone, a.devCode, null)).ok, false);
});
