"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { RecipeCard as Card } from "@/lib/recipe/public";
import { CATEGORY_LABEL, OCCASION_LABEL } from "@/lib/recipe/labels";
import type { Category, Occasion } from "@/lib/recipe/schema";
import { normalizeSearch, fa } from "@/lib/format";
import { RecipeCard } from "./recipe-card";
import { SearchIcon } from "./icons";

type Mode = "name" | "pantry";
const TIME = [
  { id: "any", label: "هر زمانی", max: Infinity },
  { id: "30", label: "تا ۳۰ دقیقه", max: 30 },
  { id: "60", label: "تا ۱ ساعت", max: 60 },
] as const;

const minOf = (t: number | [number, number]) => (Array.isArray(t) ? t[0] : t);

/** Client-side search and filters over teaser-safe card data (no premium text is ever in `cards`). */
export function Catalog({ cards }: { cards: Card[] }) {
  const sp = useSearchParams();
  const [mode, setMode] = useState<Mode>(sp.get("mode") === "pantry" ? "pantry" : "name");
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [category, setCategory] = useState<Category | "all">((sp.get("category") as Category) ?? "all");
  const [occasion, setOccasion] = useState<Occasion | "all">((sp.get("occasion") as Occasion) ?? "all");
  const [time, setTime] = useState<(typeof TIME)[number]["id"]>(
    (TIME.find((t) => t.id === sp.get("time"))?.id) ?? "any",
  );
  const [access, setAccess] = useState<"all" | "free" | "premium">("all");

  const categories = useMemo(() => [...new Set(cards.map((c) => c.category))], [cards]);
  const occasions = useMemo(() => [...new Set(cards.flatMap((c) => c.occasion ?? []))], [cards]);

  const results = useMemo(() => {
    const maxTime = TIME.find((t) => t.id === time)!.max;
    const tokens = normalizeSearch(q)
      .split(/[\s,،؛;+]+/)
      .filter(Boolean);
    return cards
      .map((c) => {
        if (category !== "all" && c.category !== category) return null;
        if (occasion !== "all" && !c.occasion?.includes(occasion)) return null;
        if (access !== "all" && c.access !== access) return null;
        if (minOf(c.facts.totalMinutes) > maxTime) return null;
        let score = 0;
        if (tokens.length) {
          const hay =
            mode === "pantry"
              ? c.ingredientNames.map(normalizeSearch)
              : [c.title, c.altTitle ?? "", c.region ?? "", ...c.tags, ...c.ingredientNames].map(normalizeSearch);
          score = tokens.filter((t) => hay.some((h) => h.includes(t))).length;
          if (mode === "name" && score < tokens.length) return null;
          if (mode === "pantry" && score === 0) return null;
        }
        return { c, score };
      })
      .filter((x): x is { c: Card; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .map((x) => ({ card: x.c, score: x.score }));
  }, [cards, q, mode, category, occasion, time, access]);

  const pantryTokens = normalizeSearch(q).split(/[\s,،؛;+]+/).filter(Boolean).length;
  const reset = () => {
    setQ("");
    setCategory("all");
    setOccasion("all");
    setTime("any");
    setAccess("all");
  };

  return (
    <div>
      <div className="card grid gap-4 p-4 sm:p-5">
        <div role="tablist" aria-label="نوع جستجو" className="inline-flex w-fit rounded-full bg-sunken p-1">
          {([
            ["name", "نام غذا"],
            ["pantry", "چی تو یخچال دارم؟"],
          ] as const).map(([m, label]) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`min-h-10 rounded-full px-4 text-sm font-bold transition-colors ${
                mode === m ? "bg-surface text-brand-ink" : "text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="relative block">
          <span className="sr-only">جستجو</span>
          <SearchIcon className="pointer-events-none absolute inset-y-0 start-4 my-auto text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={mode === "name" ? "مثلاً: سوسیس، بریونی، اصفهان" : "مواد را با ویرگول جدا کن: سیب‌زمینی، پیاز، سوسیس"}
            className="h-14 w-full rounded-2xl border border-line bg-paper ps-12 pe-4 text-base outline-offset-2 placeholder:text-muted/70"
            enterKeyHint="search"
          />
        </label>

        <FilterRow label="دسته">
          <Chip on={category === "all"} onClick={() => setCategory("all")}>همه</Chip>
          {categories.map((c) => (
            <Chip key={c} on={category === c} onClick={() => setCategory(c)}>{CATEGORY_LABEL[c]}</Chip>
          ))}
        </FilterRow>
        <FilterRow label="مناسبت">
          <Chip on={occasion === "all"} onClick={() => setOccasion("all")}>همه</Chip>
          {occasions.map((o) => (
            <Chip key={o} on={occasion === o} onClick={() => setOccasion(o)}>{OCCASION_LABEL[o]}</Chip>
          ))}
        </FilterRow>
        <FilterRow label="زمان">
          {TIME.map((t) => (
            <Chip key={t.id} on={time === t.id} onClick={() => setTime(t.id)}>{t.label}</Chip>
          ))}
        </FilterRow>
        <FilterRow label="دسترسی">
          <Chip on={access === "all"} onClick={() => setAccess("all")}>همه</Chip>
          <Chip on={access === "free"} onClick={() => setAccess("free")}>رایگان</Chip>
          <Chip on={access === "premium"} onClick={() => setAccess("premium")}>ویژهٔ مشترکین</Chip>
        </FilterRow>
      </div>

      <p className="mt-6 text-sm text-muted" role="status" aria-live="polite">
        {fa(results.length)} دستور پخت
        {mode === "pantry" && pantryTokens > 0 && " (به ترتیب بیشترین تطابق با مواد تو)"}
      </p>

      {results.length > 0 ? (
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map(({ card, score }) => (
            <li key={card.slug} className="relative">
              {mode === "pantry" && pantryTokens > 0 && (
                <span className="absolute start-3 top-3 z-10 rounded-full bg-surface px-3 py-0.5 text-xs font-bold text-brand-ink">
                  {fa(score)} از {fa(pantryTokens)} ماده
                </span>
              )}
              <RecipeCard recipe={card} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="card mt-3 grid place-items-center gap-3 p-10 text-center">
          <p className="text-lg font-bold">چیزی پیدا نشد</p>
          <p className="max-w-md text-muted">املای دیگری امتحان کن یا فیلترها را بردار. دستورهای جدید مرتب اضافه می‌شود.</p>
          <button className="btn btn-ghost" onClick={reset}>پاک کردن فیلترها</button>
        </div>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-sm font-bold text-muted">{label}</span>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="chip" aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}
