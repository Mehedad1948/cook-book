import type { Category, Occasion, Ingredient, Action } from "./schema";
import { formatAmount, formatRange } from "../format";

export const CATEGORY_LABEL: Record<Category, string> = {
  main: "غذای اصلی",
  stew: "خورش و خوراک",
  rice: "پلو و برنج",
  soup: "سوپ و آش",
  sauce: "سس و چاشنی",
  appetizer: "پیش‌غذا",
  dessert: "دسر و شیرینی",
  "street-food": "غذای خیابانی",
};

export const CATEGORY_BLURB: Record<Category, string> = {
  main: "غذاهای سیر و کامل برای سفرهٔ هر روز و مهمانی.",
  stew: "خورش‌ها و خوراک‌هایی که با صبر و نشانه‌های درست خوش‌طعم می‌شوند.",
  rice: "پلو، چلو و ته‌دیگ؛ نسبت‌ها و زمان‌ها دقیق.",
  soup: "سوپ و آش برای روزهای سرد و سفرهٔ نذری.",
  sauce: "سس و چاشنی‌هایی که یک بار می‌پزی و چند هفته استفاده می‌کنی.",
  appetizer: "پیش‌غذاهای سریع و مهمان‌پسند.",
  dessert: "دسر و شیرینی با مقدارهای دقیق.",
  "street-food": "طعم غذاهای خیابانی، در آشپزخانهٔ خودت.",
};

export const OCCASION_LABEL: Record<Occasion, string> = {
  daily: "غذای روزمره",
  guests: "مهمانی",
  nowruz: "نوروز",
  yalda: "یلدا",
  ramadan: "ماه رمضان",
  nazri: "نذری",
};

export const HEAT_LABEL = {
  low: "حرارت کم",
  "medium-low": "حرارت متوسط رو به کم",
  medium: "حرارت متوسط",
  high: "حرارت زیاد",
} as const;

export const UNIT_LABEL = {
  g: "گرم",
  ml: "میلی‌لیتر",
  tsp: "قاشق چای‌خوری",
  tbsp: "قاشق غذاخوری",
  cup: "لیوان",
  piece: "عدد",
  clove: "حبه",
  bunch: "دسته",
  pinch: "پنس",
} as const;

export const DIFFICULTY_LABEL = { 1: "آسان", 2: "متوسط", 3: "نیازمند حوصله" } as const;

/** Builds the Persian display string for an ingredient quantity from its parts. */
export function ingredientQuantity(i: Ingredient): string {
  const parts: string[] = [];
  if (i.toTaste) parts.push("به مقدار لازم");
  if (i.amount !== undefined) {
    const amount = formatRange(i.amount, formatAmount);
    parts.push(`${i.approx ? "حدود " : ""}${amount}${i.unit ? " " + UNIT_LABEL[i.unit] : ""}`);
  }
  if (i.note) parts.push(i.note);
  let line = parts.join(" ");
  if (i.household) line += line ? ` (${i.household})` : i.household;
  if (i.optional) line += line ? "، اختیاری" : "اختیاری";
  return line;
}

export function actionMinutes(a: Pick<Action, "minutes">): string | null {
  if (a.minutes === undefined) return null;
  return `${formatRange(a.minutes, (n) => formatAmount(n))} دقیقه`;
}
