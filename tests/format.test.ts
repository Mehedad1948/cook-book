import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fa,
  formatAmount,
  formatDuration,
  formatTotalTime,
  formatJalali,
  normalizeSearch,
  toLatinDigits,
  formatToman,
} from "../lib/format";

test("fa converts digits", () => {
  assert.equal(fa(12), "۱۲");
  assert.equal(fa(0), "۰");
});
test("formatAmount uses fractions", () => {
  assert.equal(formatAmount(1.5), "۱½");
  assert.equal(formatAmount(0.5), "½");
  assert.equal(formatAmount(0.25), "¼");
  assert.equal(formatAmount(2), "۲");
  assert.equal(formatAmount(2.3), "۲٫۳");
});
test("durations", () => {
  assert.equal(formatDuration(40), "۴۰ دقیقه");
  assert.equal(formatDuration(60), "۱ ساعت");
  assert.equal(formatDuration(210), "۳٫۵ ساعت");
  assert.equal(formatDuration(80), "۱ ساعت و ۲۰ دقیقه");
  assert.equal(formatTotalTime([180, 210]), "۳ تا ۳٫۵ ساعت");
  assert.equal(formatTotalTime(40, true), "حدود ۴۰ دقیقه");
});
test("jalali", () => {
  assert.match(formatJalali(new Date("2026-03-21T12:00:00Z")), /۱۴۰۵/);
});
test("toman", () => assert.equal(formatToman(1_000_000), "۱۰۰٬۰۰۰ تومان"));
test("search normalization", () => {
  assert.equal(normalizeSearch("سيب‌زمینی"), "سیبزمینی");
  assert.equal(toLatinDigits("۱۲٣"), "123");
});
