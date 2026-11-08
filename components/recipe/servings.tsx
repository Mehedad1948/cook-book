"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Ingredient } from "@/lib/recipe/schema";
import { fa, toLatinDigits } from "@/lib/format";
import { ingredientQuantity } from "@/lib/recipe/labels";
import { clampServings, factorOf, MAX_SERVINGS, scaleAdvice, scaleIngredient } from "@/lib/recipe/scale";
import { WarnIcon } from "../icons";

/**
 * Client island for the servings scaler. It only ever receives data the viewer is already
 * entitled to (rendered from RecipeSections, which is reached only through the DAL).
 */

type Ctx = { servings: number; base: number; range: { min: number; max: number }; set: (n: number) => void };
const ServingsContext = createContext<Ctx | null>(null);

function useServings() {
  const c = useContext(ServingsContext);
  if (!c) throw new Error("ServingsProvider missing");
  return c;
}

export function ServingsProvider({
  base,
  range,
  children,
}: {
  base: number;
  range: { min: number; max: number };
  children: ReactNode;
}) {
  const [servings, setServings] = useState(base);
  return (
    <ServingsContext value={{ servings, base, range, set: (n) => setServings(clampServings(n)) }}>
      {children}
    </ServingsContext>
  );
}

const PRESETS = [2, 4, 6, 8];

export function ServingsControl() {
  const { servings, base, set, range } = useServings();
  const advice = scaleAdvice(servings, base, range);
  return (
    <div className="border-b px-5 py-4" style={{ borderColor: "var(--r-line)" }}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold" id="servings-label">تعداد نفرات</span>
        <div className="flex items-center gap-1" role="group" aria-labelledby="servings-label">
          <button type="button" className="chip !min-h-11 !min-w-11 justify-center text-lg" onClick={() => set(servings - 1)} aria-label="کمتر" disabled={servings <= 1}>
            −
          </button>
          <input
            inputMode="numeric"
            dir="ltr"
            value={fa(servings).replace(/٬/g, "")}
            onChange={(e) => {
              const n = parseInt(toLatinDigits(e.target.value).replace(/\D/g, ""), 10);
              if (!Number.isNaN(n)) set(n);
            }}
            aria-label="تعداد نفرات"
            className="h-11 w-14 rounded-xl border border-line bg-surface text-center font-bold"
          />
          <button type="button" className="chip !min-h-11 !min-w-11 justify-center text-lg" onClick={() => set(servings + 1)} aria-label="بیشتر" disabled={servings >= MAX_SERVINGS}>
            +
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((n) => (
          <button key={n} type="button" className="chip" aria-pressed={servings === n} onClick={() => set(n)}>
            {fa(n)} نفر
          </button>
        ))}
        {servings !== base && (
          <button type="button" className="chip" onClick={() => set(base)}>
            برگرد به {fa(base)} نفر
          </button>
        )}
      </div>
      {advice.outOfRange && (
        <p className="mt-3 flex items-start gap-2 text-sm" role="status">
          <WarnIcon width={18} height={18} className="mt-1 shrink-0" />
          این دستور برای {fa(range.min)} تا {fa(range.max)} نفر آزمایش شده. برای تعداد {servings > range.max ? "بیشتر" : "کمتر"}، بهتر است در چند نوبت بپزی یا اندازهٔ ظرف را با مقدار هماهنگ کنی.
        </p>
      )}
      {advice.timeWarning && !advice.outOfRange && (
        <p className="mt-3 flex items-start gap-2 text-sm text-muted" role="status">
          <WarnIcon width={18} height={18} className="mt-1 shrink-0" />
          زمان پخت با دو برابر شدن مواد دو برابر نمی‌شود؛ با نشانه‌ها جلو برو و اندازهٔ تابه یا قابلمه را هم با مقدار هماهنگ کن.
        </p>
      )}
    </div>
  );
}

export function ScaledIngredients({ groups }: { groups: { group?: string; items: Ingredient[] }[] }) {
  const { servings, base } = useServings();
  const factor = factorOf(servings, base);
  return (
    <>
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.group && <h3 className="bg-sunken px-5 py-2 text-sm font-bold text-muted">{g.group}</h3>}
          <table className="w-full text-[0.95rem]">
            <tbody>
              {g.items.map((it, i) => (
                <tr key={i} className="border-b last:border-b-0" style={{ borderColor: "var(--r-line)" }}>
                  <th scope="row" className="py-2.5 ps-5 pe-2 text-start font-medium">
                    {it.name}
                    {factor >= 2 && it.adjustToTaste && (
                      <span className="mt-0.5 block text-xs font-normal text-muted">بچش و تنظیم کن</span>
                    )}
                  </th>
                  <td className="py-2.5 pe-5 ps-2 text-end font-bold" style={{ color: "var(--r-accent)" }}>
                    {ingredientQuantity(scaleIngredient(it, factor))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}

/** Steps keep the authored amounts; this tells the cook how to convert them. */
export function StepsNotice() {
  const { servings, base, range } = useServings();
  const advice = scaleAdvice(servings, base, range);
  if (!advice.stepFactor) return null;
  return (
    <p className="tipbox" role="status">
      <span className="tip-label">توجه: </span>
      مقدارهایی که داخل مراحل نوشته شده برای {fa(base)} نفر است. برای {fa(servings)} نفر آن‌ها را در <strong>{advice.stepFactor}</strong> ضرب کن؛ مقدارهای جدول مواد بالا همین حالا حساب شده است.
    </p>
  );
}
