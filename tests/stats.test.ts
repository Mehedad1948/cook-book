import { test, after } from "node:test";
import assert from "node:assert/strict";
import { dbConfigured, getPool } from "../lib/db/pool";
import { getStats } from "../lib/db/stats";

after(async () => {
  if (dbConfigured()) await getPool().end();
});

test("admin stats aggregate without error", { skip: !dbConfigured() && "no database configured" }, async () => {
  const s = await getStats();
  for (const n of [s.users, s.activeSubscribers, s.paidPayments, s.revenueIRR]) assert.ok(Number.isFinite(n) && n >= 0);
  assert.ok(Array.isArray(s.events30d) && Array.isArray(s.topCooked));
});
