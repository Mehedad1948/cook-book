/** Persian formatting helpers. Never print a raw number in JSX; go through these. */

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const FRACTIONS: Record<number, string> = { 0.25: "¼", 0.5: "½", 0.75: "¾" };

/** Latin/Arabic digits -> Persian digits. */
export function toFaDigits(s: string): string {
  return s
    .replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)])
    .replace(/[٠-٩]/g, (d) => FA_DIGITS[d.charCodeAt(0) - 0x0660]);
}

/** Persian/Arabic digits -> Latin digits (for inputs and search matching). */
export function toLatinDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/** fa(12) -> "۱۲"; fa(1234) -> "۱٬۲۳۴" */
export function fa(n: number): string {
  return new Intl.NumberFormat("fa-IR").format(n);
}

/** Recipe quantity: 1.5 -> "۱½", 0.5 -> "½", 2 -> "۲", 2.3 -> "۲٫۳" */
export function formatAmount(n: number): string {
  const plain = (x: number) => new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(x);
  const whole = Math.floor(n + 1e-9);
  const frac = Math.round((n - whole) * 100) / 100;
  if (frac === 0) return plain(whole);
  const glyph = FRACTIONS[frac];
  if (glyph) return whole === 0 ? glyph : `${plain(whole)}${glyph}`;
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1, useGrouping: false }).format(n);
}

export function formatRange(v: number | [number, number], f = formatAmount): string {
  return Array.isArray(v) ? `${f(v[0])} تا ${f(v[1])}` : f(v);
}

/** Minutes -> "۴۰ دقیقه", "۱ ساعت", "۳٫۵ ساعت", "۱ ساعت و ۲۰ دقیقه" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${fa(minutes)} دقیقه`;
  const h = minutes / 60;
  if (Number.isInteger(h * 2)) return `${formatDecimal(h)} ساعت`;
  const hh = Math.floor(h);
  const mm = minutes - hh * 60;
  return `${fa(hh)} ساعت و ${fa(mm)} دقیقه`;
}

function formatDecimal(n: number): string {
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(n);
}

/** Total time which may be a range; ranges inside the same unit read "۳ تا ۳٫۵ ساعت". */
export function formatTotalTime(m: number | [number, number], approx = false): string {
  const prefix = approx ? "حدود " : "";
  if (!Array.isArray(m)) return prefix + formatDuration(m);
  const [a, b] = m;
  if (a >= 60 && b >= 60) return `${formatDecimal(a / 60)} تا ${formatDecimal(b / 60)} ساعت`;
  if (a < 60 && b < 60) return `${fa(a)} تا ${fa(b)} دقیقه`;
  return `${formatDuration(a)} تا ${formatDuration(b)}`;
}

/** Jalali date for display. Stored dates are UTC. */
export function formatJalali(date: Date | number): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tehran",
  }).format(date);
}

/** Money is stored in Rial; the UI shows Toman. */
export function formatToman(irr: number): string {
  return `${fa(Math.round(irr / 10))} تومان`;
}

/** Normalize Persian text for search: Arabic ي/ك, ZWNJ, diacritics, digits, case. */
export function normalizeSearch(s: string): string {
  return toLatinDigits(s)
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[أإآ]/g, "ا")
    .replace(/ۀ/g, "ه")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[‌‍]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
