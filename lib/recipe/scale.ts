import type { Ingredient, Recipe } from "./schema";
import { formatAmount, toLatinDigits } from "../format";

/**
 * Servings scaler. Pure functions, no I/O. Rules (docs/app-guide section 8.3):
 *  - amounts scale linearly unless `scalable === false` (frying oil, "to taste" items);
 *  - results are rounded to kitchen-sensible steps per unit;
 *  - a household measure is scaled only when it is a plain "number unit" string, otherwise hidden;
 *  - cooking TIME never scales; the UI warns instead (see scaleAdvice).
 */

export const DEFAULT_RANGE = { min: 2, max: 8 };
export const MAX_SERVINGS = 100;

export function factorOf(servings: number, base: number): number {
  return servings / base;
}

function roundTo(n: number, step: number): number {
  const r = Math.round(n / step) * step;
  return Math.max(step, Math.round(r * 100) / 100);
}

/** Sensible rounding per unit: grams to 5 (1 below 20), spoons to ¼, pieces and cloves to ½, etc. */
export function roundAmount(n: number, unit?: Ingredient["unit"]): number {
  switch (unit) {
    case "g":
    case "ml":
      return n < 20 ? roundTo(n, 1) : roundTo(n, 5);
    case "tsp":
    case "tbsp":
    case "cup":
      return roundTo(n, 0.25);
    case "piece":
    case "clove":
    case "bunch":
      return roundTo(n, 0.5);
    case "pinch":
      return roundTo(n, 1);
    default:
      return roundTo(n, 0.25);
  }
}

const FA = "۰۱۲۳۴۵۶۷۸۹";
const FRAC: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75 };

/** Parses "۳۵۰", "۱½", "½", "۲٫۵" into a number; null if it is not a plain number. */
export function parseFaNumber(s: string): number | null {
  let t = s.trim().replace(/٫/g, ".");
  t = t.replace(/[۰-۹]/g, (d) => String(FA.indexOf(d)));
  const m = /^(\d+(?:\.\d+)?)?([½¼¾])?$/.exec(t);
  if (!m || (m[1] === undefined && m[2] === undefined)) return null;
  return (m[1] ? parseFloat(m[1]) : 0) + (m[2] ? FRAC[m[2]] : 0);
}

const HOUSEHOLD = /^(\S+)(?: تا (\S+))? (.+)$/;

/** Scales a household string like "۳۵۰ گرم" or "۱ تا ۲ لیوان"; returns null when it cannot be scaled safely. */
export function scaleHousehold(h: string, factor: number): string | null {
  const m = HOUSEHOLD.exec(h.trim());
  if (!m) return null;
  const a = parseFaNumber(m[1]);
  const b = m[2] ? parseFaNumber(m[2]) : undefined;
  if (a === null || b === null) return null;
  const unit = m[3];
  const grams = /^(گرم|میلی‌لیتر)$/.test(unit) ? "g" : undefined;
  const r = (n: number) => roundAmount(n * factor, grams);
  const first = formatAmount(r(a));
  return b === undefined ? `${first} ${unit}` : `${first} تا ${formatAmount(r(b))} ${unit}`;
}

/** Returns a copy of the ingredient scaled by `factor`. Factor 1 returns it unchanged. */
export function scaleIngredient(i: Ingredient, factor: number): Ingredient {
  if (factor === 1) return i;
  const out: Ingredient = { ...i };
  if (i.amount !== undefined && i.scalable !== false && !i.toTaste) {
    out.amount = Array.isArray(i.amount)
      ? ([roundAmount(i.amount[0] * factor, i.unit), roundAmount(i.amount[1] * factor, i.unit)] as [number, number])
      : roundAmount(i.amount * factor, i.unit);
    if (Array.isArray(out.amount) && out.amount[0] === out.amount[1]) out.amount = out.amount[0];
  }
  if (i.household && i.scalable !== false) {
    const scaled = scaleHousehold(i.household, factor);
    if (scaled) out.household = scaled;
    else delete out.household; // cannot scale text like "با استخوان حدود ۷۵۰ گرم"
  }
  return out;
}

export function servingRange(r: Pick<Recipe, "scaling">) {
  return r.scaling ?? DEFAULT_RANGE;
}

export type ScaleAdvice = {
  /** step text keeps the original amounts; tell the cook how to convert */
  stepFactor: string | null;
  timeWarning: boolean;
  outOfRange: boolean;
};

export function scaleAdvice(servings: number, base: number, range: { min: number; max: number }): ScaleAdvice {
  const factor = factorOf(servings, base);
  return {
    stepFactor: factor === 1 ? null : formatAmount(Math.round(factor * 100) / 100),
    timeWarning: factor >= 2,
    outOfRange: servings < range.min || servings > range.max,
  };
}

/** Plain-number check used by the control; clamps to 1..MAX_SERVINGS. */
export function clampServings(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_SERVINGS, Math.max(1, Math.round(n)));
}

export { toLatinDigits };
