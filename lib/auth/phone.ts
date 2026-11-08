import { toLatinDigits } from "../format";

/**
 * Normalizes an Iranian mobile number to E.164 (+989xxxxxxxxx), or null when invalid.
 * Accepts Persian/Arabic digits, spaces and dashes, and the forms 09..., 9..., +989..., 00989..., 989...
 */
export function normalizePhone(input: string): string | null {
  const digits = toLatinDigits(input).replace(/[\s\-()]/g, "");
  let d = digits.startsWith("+") ? digits.slice(1) : digits;
  if (!/^\d+$/.test(d)) return null;
  if (d.startsWith("0098")) d = d.slice(4);
  else if (d.startsWith("98")) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  return /^9\d{9}$/.test(d) ? `+98${d}` : null;
}

/** "+989123456789" -> "۰۹۱۲ ۳۴۵ ۶۷۸۹" with the middle hidden for display: ۰۹۱۲ ••• ۶۷۸۹ */
export function maskPhone(e164: string): string {
  const local = "0" + e164.slice(3);
  const fa = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
  return `${fa(local.slice(0, 4))} ••• ${fa(local.slice(7))}`;
}
