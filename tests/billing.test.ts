import { test, after } from "node:test";
import assert from "node:assert/strict";
import { nextPeriod } from "../lib/billing/subscription";
import { PLANS } from "../lib/billing/plans";
import { dbConfigured, getPool } from "../lib/db/pool";
import { upsertUserByPhone, deleteUserByPhone } from "../lib/db/users";
import { getActiveSubscription } from "../lib/db/billing";
import { completePayment, startCheckout } from "../lib/billing/service";

const DAY = 86_400_000;

test("nextPeriod: starts now when nothing is active, otherwise after the current end", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  assert.equal(nextPeriod(null, now, 30).end.getTime(), now.getTime() + 30 * DAY);
  assert.equal(nextPeriod(new Date(now.getTime() - DAY), now, 30).start.getTime(), now.getTime(), "expired -> from now");
  const end = new Date(now.getTime() + 10 * DAY);
  const p = nextPeriod(end, now, 30);
  assert.equal(p.start.getTime(), end.getTime(), "renewal keeps paid days");
  assert.equal(p.end.getTime(), end.getTime() + 30 * DAY);
});

test("plans are valid Rial integers", () => {
  for (const p of PLANS) assert.ok(Number.isInteger(p.priceIRR) && p.priceIRR > 0 && p.days > 0);
});

const db = { skip: !dbConfigured() && "no database configured" };
const phones: string[] = [];
const newUser = async () => {
  const phone = "+98901" + String(Math.floor(1000000 + Math.random() * 8999999));
  phones.push(phone);
  return upsertUserByPhone(phone);
};
const authorityOf = (url: string) => new URL(url, "http://x").searchParams.get("authority")!;

after(async () => {
  if (!dbConfigured()) return;
  for (const p of phones) {
    const u = await getPool().query("SELECT id FROM users WHERE phone = $1", [p]);
    for (const r of u.rows) {
      await getPool().query("DELETE FROM subscriptions WHERE user_id = $1", [r.id]);
      await getPool().query("DELETE FROM events WHERE user_id = $1", [r.id]);
      await getPool().query("DELETE FROM payments WHERE user_id = $1", [r.id]);
    }
    await deleteUserByPhone(p);
  }
  await getPool().end();
});

test("paid callback unlocks access; replaying it does not extend twice", db, async () => {
  const u = await newUser();
  const start = await startCheckout(u.id, "monthly");
  assert.ok("redirectUrl" in start);
  if (!("redirectUrl" in start)) return;
  const authority = authorityOf(start.redirectUrl);

  assert.equal(await getActiveSubscription(u.id), null, "nothing before payment");
  const first = await completePayment(authority, "OK");
  assert.equal(first.status, "paid");
  const sub = await getActiveSubscription(u.id);
  assert.ok(sub);
  const end1 = sub!.periodEnd.getTime();

  const replay = await completePayment(authority, "OK");
  assert.ok(replay.status === "paid" && replay.alreadyProcessed);
  assert.equal((await getActiveSubscription(u.id))!.periodEnd.getTime(), end1);
  const n = await getPool().query("SELECT count(*)::int AS n FROM subscriptions WHERE user_id = $1", [u.id]);
  assert.equal(n.rows[0].n, 1);
});

test("concurrent callbacks still create exactly one subscription", db, async () => {
  const u = await newUser();
  const start = await startCheckout(u.id, "quarterly");
  if (!("redirectUrl" in start)) return assert.fail("checkout failed");
  const authority = authorityOf(start.redirectUrl);
  await Promise.all([completePayment(authority, "OK"), completePayment(authority, "OK"), completePayment(authority, "OK")]);
  const n = await getPool().query("SELECT count(*)::int AS n FROM subscriptions WHERE user_id = $1", [u.id]);
  assert.equal(n.rows[0].n, 1);
});

test("a second purchase extends from the current end", db, async () => {
  const u = await newUser();
  for (let i = 0; i < 2; i++) {
    const s = await startCheckout(u.id, "monthly");
    if (!("redirectUrl" in s)) return assert.fail("checkout failed");
    await completePayment(authorityOf(s.redirectUrl), "OK");
  }
  const sub = await getActiveSubscription(u.id);
  const days = (sub!.periodEnd.getTime() - Date.now()) / DAY;
  assert.ok(days > 59 && days < 60.1, `expected ~60 days, got ${days}`);
});

test("cancelled or unknown callbacks grant nothing", db, async () => {
  const u = await newUser();
  const s = await startCheckout(u.id, "monthly");
  if (!("redirectUrl" in s)) return assert.fail("checkout failed");
  assert.equal((await completePayment(authorityOf(s.redirectUrl), "NOK")).status, "failed");
  assert.equal(await getActiveSubscription(u.id), null);
  assert.equal((await completePayment("FAKE-does-not-exist", "OK")).status, "unknown");
  // a cancelled payment cannot be revived by a later forged OK
  assert.equal((await completePayment(authorityOf(s.redirectUrl), "OK")).status, "failed");
  assert.equal(await getActiveSubscription(u.id), null);
});

test("an expired subscription no longer grants access", db, async () => {
  const u = await newUser();
  const s = await startCheckout(u.id, "monthly");
  if (!("redirectUrl" in s)) return assert.fail("checkout failed");
  await completePayment(authorityOf(s.redirectUrl), "OK");
  assert.ok(await getActiveSubscription(u.id));
  await getPool().query(
    "UPDATE subscriptions SET period_start = now() - interval '40 days', period_end = now() - interval '10 days' WHERE user_id = $1",
    [u.id],
  );
  assert.equal(await getActiveSubscription(u.id), null);
});
