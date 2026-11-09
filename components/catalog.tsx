"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { RecipeCard as Card } from "@/lib/recipe/public";
import { CATEGORY_LABEL, OCCASION_LABEL } from "@/lib/recipe/labels";
import type { Category, Occasion } from "@/lib/recipe/schema";
import { normalizeSearch, fa } from "@/lib/format";
import { RecipeCard } from "./recipe-card";
import { SearchIcon } from "./icons";

type Mode = "name" | "pantry";
type Access = "all" | "free" | "premium";
const TIME = [
  { id: "any", label: "هر زمانی", max: Infinity },
  { id: "30", label: "تا ۳۰ دقیقه", max: 30 },
  { id: "60", label: "تا ۱ ساعت", max: 60 },
] as const;
type TimeId = (typeof TIME)[number]["id"];

const ACCESS_LABEL: Record<Access, string> = { all: "همه", free: "رایگان", premium: "ویژهٔ مشترکین" };
const SPLIT = /[\s,،؛;+]+/;
const LIST_SPLIT = /[,،؛;+]+/;

/** Pantry input is a list: split on commas when present so multi-word ingredients stay whole. */
const tokenize = (q: string, mode: Mode) => {
  const n = normalizeSearch(q);
  const sep = mode === "pantry" && LIST_SPLIT.test(n) ? LIST_SPLIT : SPLIT;
  return n.split(sep).map((t) => t.trim()).filter(Boolean);
};

const minOf = (t: number | [number, number]) => (Array.isArray(t) ? t[0] : t);

/** Client-side search and filters over teaser-safe card data (no premium text is ever in `cards`). */
export function Catalog({ cards }: { cards: Card[] }) {
  const sp = useSearchParams();
  const [mode, setMode] = useState<Mode>(sp.get("mode") === "pantry" ? "pantry" : "name");
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [category, setCategory] = useState<Category | "all">((sp.get("category") as Category) ?? "all");
  const [occasion, setOccasion] = useState<Occasion | "all">((sp.get("occasion") as Occasion) ?? "all");
  const [time, setTime] = useState<TimeId>(TIME.find((t) => t.id === sp.get("time"))?.id ?? "any");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [access, setAccess] = useState<Access>(
    sp.get("access") === "free" || sp.get("access") === "premium" ? (sp.get("access") as Access) : "all",
  );

  const categories = useMemo(() => [...new Set(cards.map((c) => c.category))], [cards]);
  const occasions = useMemo(() => [...new Set(cards.flatMap((c) => c.occasion ?? []))], [cards]);

  // Most common ingredients, offered as one-tap suggestions in pantry mode.
  const popular = useMemo(() => {
    const n = new Map<string, number>();
    for (const c of cards) for (const i of new Set(c.ingredientNames)) n.set(i, (n.get(i) ?? 0) + 1);
    return [...n].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([i]) => i);
  }, [cards]);

  // Keep the URL in sync so a filtered view can be shared, bookmarked and survives refresh.
  useEffect(() => {
    const p = new URLSearchParams();
    if (mode === "pantry") p.set("mode", "pantry");
    if (q.trim()) p.set("q", q.trim());
    if (category !== "all") p.set("category", category);
    if (occasion !== "all") p.set("occasion", occasion);
    if (time !== "any") p.set("time", time);
    if (access !== "all") p.set("access", access);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [mode, q, category, occasion, time, access]);

  const tokens = useMemo(() => tokenize(q, mode), [q, mode]);

  const results = useMemo(() => {
    const maxTime = TIME.find((t) => t.id === time)!.max;
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
  }, [cards, tokens, mode, category, occasion, time, access]);

  const pantryTokens = tokens.length;

  // Active filters, each removable with one tap.
  const active: { key: string; label: string; clear: () => void }[] = [];
  if (category !== "all") active.push({ key: "category", label: CATEGORY_LABEL[category], clear: () => setCategory("all") });
  if (occasion !== "all") active.push({ key: "occasion", label: OCCASION_LABEL[occasion], clear: () => setOccasion("all") });
  if (time !== "any") active.push({ key: "time", label: TIME.find((t) => t.id === time)!.label, clear: () => setTime("any") });
  if (access !== "all") active.push({ key: "access", label: ACCESS_LABEL[access], clear: () => setAccess("all") });

  const resetFilters = () => {
    setCategory("all");
    setOccasion("all");
    setTime("any");
    setAccess("all");
  };
  const resetAll = () => {
    setQ("");
    resetFilters();
  };

  const toggleIngredient = (name: string) => {
    const key = normalizeSearch(name);
    const list = q.split(LIST_SPLIT).map((t) => t.trim()).filter(Boolean);
    setQ((list.some((t) => normalizeSearch(t) === key) ? list.filter((t) => normalizeSearch(t) !== key) : [...list, name]).join("، "));
  };

  return (
    <div>
      <div className="card grid gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="نوع جستجو" className="inline-flex w-fit rounded-full bg-sunken p-1">
            {([
              ["name", "نام غذا"],
              ["pantry", "چی تو یخچال دارم؟"],
            ] as const).map(([m, label]) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`min-h-10 rounded-full px-4 text-sm font-bold transition-colors ${
                  mode === m ? "bg-brand text-white shadow-sm dark:text-[#130f20]" : "text-muted hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted">
            {mode === "name" ? "نام غذا، ماده یا شهر را بنویس" : "هر چه در یخچال داری بنویس؛ بهترین پیشنهادها اول می‌آید"}
          </p>
        </div>

        <label className="relative block">
          <span className="sr-only">جستجو</span>
          <SearchIcon className="pointer-events-none absolute inset-y-0 start-4 my-auto text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={mode === "name" ? "مثلاً: سوسیس، بریونی، اصفهان" : "مواد را با ویرگول جدا کن: سیب‌زمینی، پیاز، سوسیس"}
            className="h-14 w-full rounded-2xl border border-line bg-paper ps-12 pe-12 text-base outline-offset-2 placeholder:text-muted/70 focus:border-brand [&::-webkit-search-cancel-button]:hidden"
            enterKeyHint="search"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="پاک کردن جستجو"
              className="absolute inset-y-0 inset-e-2 my-auto grid size-10 place-items-center rounded-full text-muted hover:bg-sunken hover:text-ink"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          )}
        </label>

        {mode === "pantry" && popular.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-muted">پیشنهاد:</span>
            {popular.map((i) => (
              <button
                key={i}
                type="button"
                className="chip"
                aria-pressed={tokens.includes(normalizeSearch(i))}
                onClick={() => toggleIngredient(i)}
              >
                + {i}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          aria-controls="catalog-filters"
          className="btn btn-ghost h-11 justify-between sm:hidden"
        >
          <span>فیلترها</span>
          {active.length > 0 && (
            <span className="grid size-6 place-items-center rounded-full bg-brand text-xs font-bold text-white dark:text-[#130f20]">{fa(active.length)}</span>
          )}
        </button>

        <div id="catalog-filters" className={`${filtersOpen ? "grid" : "hidden"} gap-4 sm:grid sm:grid-cols-2 sm:gap-x-6`}>
          <Segmented
            label="دسته"
            value={category}
            onChange={(v) => setCategory(v as Category | "all")}
            options={[{ id: "all", label: "همه" }, ...categories.map((c) => ({ id: c, label: CATEGORY_LABEL[c] }))]}
          />
          <Segmented
            label="مناسبت"
            value={occasion}
            onChange={(v) => setOccasion(v as Occasion | "all")}
            options={[{ id: "all", label: "همه" }, ...occasions.map((o) => ({ id: o, label: OCCASION_LABEL[o] }))]}
          />
          <Segmented
            label="زمان پخت"
            value={time}
            onChange={(v) => setTime(v as TimeId)}
            options={TIME.map((t) => ({ id: t.id, label: t.label }))}
          />
          <Segmented
            label="دسترسی"
            value={access}
            onChange={(v) => setAccess(v as Access)}
            options={(Object.keys(ACCESS_LABEL) as Access[]).map((a) => ({ id: a, label: ACCESS_LABEL[a] }))}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <p className="me-2 text-sm font-bold" role="status" aria-live="polite">
          {fa(results.length)} دستور پخت
          {mode === "pantry" && pantryTokens > 0 && (
            <span className="font-normal text-muted"> · به ترتیب بیشترین تطابق</span>
          )}
        </p>
        {active.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={a.clear}
            aria-label={`حذف فیلتر ${a.label}`}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-brand-soft px-3 text-sm font-bold text-brand-ink hover:brightness-95"
          >
            {a.label}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        ))}
        {active.length > 1 && (
          <button type="button" onClick={resetFilters} className="min-h-8 px-2 text-sm font-bold text-brand-ink underline-offset-4 hover:underline">
            پاک کردن همه
          </button>
        )}
      </div>

      {results.length > 0 ? (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="card mt-4 grid place-items-center gap-3 p-10 text-center">
          <p className="text-lg font-bold">چیزی پیدا نشد</p>
          <p className="max-w-md text-muted">املای دیگری امتحان کن یا فیلترها را بردار. دستورهای جدید مرتب اضافه می‌شود.</p>
          <button type="button" className="btn btn-ghost" onClick={resetAll}>پاک کردن جستجو و فیلترها</button>
        </div>
      )}
    </div>
  );
}

type Opt = { id: string; label: string };

/** All options visible at once; falls back to a dropdown only when the list is too long to scan. */
function Segmented({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Opt[] }) {
  if (options.length > 5) {
    return (
      <label className="grid gap-1.5">
        <span className="text-xs font-bold text-muted">{label}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm font-bold"
        >
          {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </label>
    );
  }
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-1.5">
      <span className="text-xs font-bold text-muted">{label}</span>
      <div className="flex w-full rounded-xl bg-sunken p-1">
        {options.map((o) => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.id)}
              className={`min-h-10 flex-1 rounded-lg px-2 text-sm transition-colors ${
                on ? "bg-brand font-bold text-white shadow-sm dark:text-[#130f20]" : "text-muted hover:text-ink"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
