import Link from "next/link";
import { Suspense } from "react";
import { RecipeToolbar } from "./toolbar";
import type { Action, Recipe, Stage } from "@/lib/recipe/schema";
import type { RecipeMeta, Teaser } from "@/lib/recipe/public";
import {
  CATEGORY_LABEL,
  DIFFICULTY_LABEL,
  HEAT_LABEL,
  OCCASION_LABEL,
  actionMinutes,
} from "@/lib/recipe/labels";
import { fa, formatDuration, formatRange, formatTotalTime } from "@/lib/format";
import { RichText } from "../rich-text";
import { TipBox } from "../tip-box";
import { ScaledIngredients, ServingsControl, ServingsProvider, StepsNotice } from "./servings";
import { servingRange } from "@/lib/recipe/scale";
import { tileOf } from "../recipe-card";
import {
  CheckIcon,
  ClockIcon,
  FlameIcon,
  LockIcon,
  ShieldIcon,
  SnowflakeIcon,
  SparkIcon,
  UsersIcon,
  ArrowIcon,
} from "../icons";

/* ───────────────────────── Hero ───────────────────────── */

export function RecipeHero({ recipe: r, actions }: { recipe: RecipeMeta; actions?: React.ReactNode }) {
  const premium = r.access === "premium";
  const f = r.facts;
  return (
    <header className={`tile-${tileOf(r.slug)} relative overflow-hidden rounded-b-[2.5rem] text-ink`}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -start-6 select-none text-[16rem] font-extrabold leading-none text-ink/[0.06]"
      >
        {r.title.charAt(0)}
      </span>
      <div className="container-page relative py-8 sm:py-12">
        <nav aria-label="مسیر" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-ink/75">
          <Link href="/recipes" className="hover:text-ink">دستور پخت‌ها</Link>
          <span aria-hidden="true">›</span>
          <Link href={`/category/${r.category}`} className="hover:text-ink">{CATEGORY_LABEL[r.category]}</Link>
        </nav>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`flex items-center gap-1 rounded-full px-3 py-0.5 text-sm font-bold ${premium ? "badge-premium" : "badge-free"}`}>
            {premium && <LockIcon width={15} height={15} />}
            {premium ? "ویژهٔ مشترکین" : "رایگان"}
          </span>
          {r.region && <span className="rounded-full bg-surface/70 px-3 py-0.5 text-sm">{r.region}</span>}
          {r.occasion?.map((o) => (
            <span key={o} className="rounded-full bg-surface/70 px-3 py-0.5 text-sm">{OCCASION_LABEL[o]}</span>
          ))}
        </div>
        <h1 className="text-3xl font-extrabold leading-snug sm:text-5xl">{r.title}</h1>
        {r.altTitle && <p className="mt-1 text-lg text-ink/80">({r.altTitle})</p>}
        <p className="mt-4 max-w-2xl text-base leading-8 text-ink/85 sm:text-lg">{r.summary}</p>

        {actions && <div className="no-print mt-5 flex flex-wrap gap-2">{actions}</div>}

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          <Fact icon={<UsersIcon />} label="تعداد" value={`${fa(f.servings)} نفر${f.servingsNote ? ` (${f.servingsNote})` : ""}`} />
          <Fact
            icon={<ClockIcon />}
            label="زمان کل"
            value={formatTotalTime(f.totalMinutes, f.approxTime)}
            sub={f.extraTime?.map((e) => `${e.label}: ${formatRange(e.minutes, formatDuration)}`).join("، ")}
          />
          <Fact icon={<SparkIcon />} label="سختی" value={DIFFICULTY_LABEL[f.difficulty]} />
          {(f.portion || f.shelfLife) && <Fact icon={<ShieldIcon />} label={f.portion ? "هر پرس" : "ماندگاری"} value={(f.portion ?? f.shelfLife)!.replace(/^هر پرس /, "")} />}
        </dl>
      </div>
    </header>
  );
}

function Fact({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl bg-surface/80 px-4 py-3 backdrop-blur-sm">
      <dt className="flex items-center gap-1.5 text-xs text-muted">
        <span aria-hidden="true" className="text-brand-ink">{icon}</span>
        {label}
      </dt>
      <dd className="font-bold leading-snug">{value}</dd>
      {sub && <dd className="text-xs text-muted">{sub}</dd>}
    </div>
  );
}

/* ───────────────────────── Small pieces ───────────────────────── */

function CueChips({ a }: { a: Action }) {
  const time = actionMinutes(a);
  if (!time && !a.heat && !a.cue) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {a.heat && (
        <span className="chip" style={{ borderColor: "var(--r-line)" }}>
          <FlameIcon width={15} height={15} /> {HEAT_LABEL[a.heat]}
        </span>
      )}
      {time && (
        <span className="chip" style={{ borderColor: "var(--r-line)" }}>
          <ClockIcon width={15} height={15} /> {time}
        </span>
      )}
      {a.cue && (
        <span
          className="chip font-bold !whitespace-normal !rounded-2xl"
          style={{ background: "var(--r-soft)", borderColor: "var(--r-line)", color: "var(--r-accent)" }}
        >
          <CheckIcon width={15} height={15} /> نشانه: {a.cue}
        </span>
      )}
    </div>
  );
}

function StageCard({ stage, index }: { stage: Stage; index: number }) {
  return (
    <section className="stage card p-5 sm:p-6" aria-labelledby={`stage-${index}`}>
      <h3 id={`stage-${index}`} className="flex items-center gap-3 text-xl font-extrabold">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full text-base text-white"
          style={{ background: "var(--r-solid)" }}
        >
          {fa(index + 1)}
        </span>
        {stage.title}
      </h3>
      <ol className="stage-list mt-3">
        {stage.actions.map((a, i) => (
          <li key={i}>
            <RichText text={a.text} />
            {a.sub && (
              <ul className="sub-list">
                {a.sub.map((s, j) => (
                  <li key={j} className="rounded-xl border px-3 py-2" style={{ borderColor: "var(--r-line)", background: "var(--r-soft)" }}>
                    {s.label && <strong className="font-extrabold" style={{ color: "var(--r-accent)" }}>{s.label}: </strong>}
                    <RichText text={s.text} />
                  </li>
                ))}
              </ul>
            )}
            <CueChips a={a} />
          </li>
        ))}
      </ol>
      {stage.tip && <TipBox tip={stage.tip} />}
      {stage.note && <p className="prose-note mt-2">{stage.note}</p>}
    </section>
  );
}

/* ───────────────────────── Ingredients (sidebar) ───────────────────────── */

function IngredientsCard({ recipe: r }: { recipe: Recipe }) {
  return (
    <section id="ingredients" className="card overflow-hidden" aria-labelledby="ingredients-title">
      <h2 id="ingredients-title" className="px-5 py-3 text-lg font-extrabold text-white" style={{ background: "var(--r-solid)" }}>
        مواد لازم
      </h2>
      <ServingsControl />
      {/* the list scrolls on its own so the header and servings control always stay in view */}
      <div className="max-h-[50dvh] overflow-y-auto overscroll-contain lg:max-h-[calc(100dvh-26rem)] lg:min-h-48" tabIndex={0} role="region" aria-labelledby="ingredients-title">
        <ScaledIngredients slug={r.slug} groups={r.ingredients} />
      </div>
    </section>
  );
}

function Sidebar({ recipe: r }: { recipe: Recipe }) {
  return (
    <aside className="grid grid-cols-[minmax(0,1fr)] content-start gap-5 lg:sticky lg:top-36 lg:self-start">
      <IngredientsCard recipe={r} />
      {(r.tools || r.servedWith) && (
        <div className="card grid gap-4 p-5">
          {r.tools && (
            <div>
              <h3 className="font-extrabold">وسایل</h3>
              <ul className="mt-1 list-disc ps-5 text-[0.95rem]">{r.tools.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          )}
          {r.servedWith && (
            <div>
              <h3 className="font-extrabold">همراه سرو</h3>
              <ul className="mt-1 list-disc ps-5 text-[0.95rem]">{r.servedWith.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          )}
        </div>
      )}
      {r.chooseTip && <TipBox tip={r.chooseTip} />}
    </aside>
  );
}

/* ───────────────────────── Full body ───────────────────────── */

const ANCHORS = [
  { id: "ingredients", label: "مواد" },
  { id: "steps", label: "مراحل" },
  { id: "mistakes", label: "اشتباه‌های رایج" },
  { id: "storage", label: "نگهداری" },
];

export function RecipeSections({ recipe: r }: { recipe: Recipe }) {
  return (
    <ServingsProvider slug={r.slug} base={r.facts.servings} range={servingRange(r)}>
      <nav aria-label="بخش‌های دستور" className="no-print sticky top-16 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <ul className="container-page flex gap-2 overflow-x-auto py-2">
          {ANCHORS.map((a) => (
            <li key={a.id}>
              <a href={`#${a.id}`} className="chip hover:bg-brand-soft">{a.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-8 lg:grid-cols-[23rem_minmax(0,1fr)]">
        <Sidebar recipe={r} />

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6">
          <Suspense fallback={null}>
            <RecipeToolbar slug={r.slug} />
          </Suspense>
          <h2 id="steps" className="section-title">مراحل پخت</h2>
          <StepsNotice />
          {r.stages.map((s, i) => <StageCard key={i} stage={s} index={i} />)}

          {r.extraTable && (
            <section className="card p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-extrabold">{r.extraTable.title}</h2>
              <div className="overflow-x-auto">
                <table className="table-recipe">
                  <thead>
                    <tr>{r.extraTable.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {r.extraTable.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (j === 0 ? <th key={j} scope="row" className="font-extrabold">{cell}</th> : <td key={j}>{cell}</td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {r.extraTable.tip && <TipBox tip={r.extraTable.tip} />}
            </section>
          )}

          <section id="mistakes" className="card p-5 sm:p-6">
            <h2 className="text-xl font-extrabold">اشتباه‌های رایج و راه‌حل</h2>
            <p className="prose-note">اگر نتیجه خوب نشد، اول اینجا را نگاه کن.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="table-recipe">
                <thead>
                  <tr><th scope="col" className="w-2/5">مشکل</th><th scope="col">علت و راه‌حل</th></tr>
                </thead>
                <tbody>
                  {r.mistakes.map((m) => (
                    <tr key={m.problem}>
                      <th scope="row" className="font-bold">{m.problem}</th>
                      <td>{m.fix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="storage" className="card p-5 sm:p-6">
            <h2 className="text-xl font-extrabold">نگهداری و تنوع</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {r.storage.fridgeDays && <span className="chip">یخچال: تا {fa(r.storage.fridgeDays)} روز</span>}
              {r.storage.freezerDays ? (
                <span className="chip"><SnowflakeIcon width={15} height={15} /> فریزر: تا {fa(Math.round(r.storage.freezerDays / 30))} ماه</span>
              ) : r.storage.freezable === false ? (
                <span className="chip">فریز نمی‌شود</span>
              ) : null}
            </div>
            <ul className="mt-3 list-disc space-y-1 ps-5">
              {r.storage.lines.map((l, i) => <li key={i}><RichText text={l} /></li>)}
            </ul>
            {r.storage.variations && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {r.storage.variations.map((v) => (
                  <div key={v.title} className="rounded-xl border p-3" style={{ borderColor: "var(--r-line)", background: "var(--r-soft)" }}>
                    <strong style={{ color: "var(--r-accent)" }}>{v.title}</strong>
                    <p className="text-[0.95rem]">{v.text}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <p className="prose-note border-t border-line pt-4">{r.closing}</p>
        </div>
      </div>
    </ServingsProvider>
  );
}

/* ───────────────────────── Teaser + paywall ───────────────────────── */

/** Server-rendered, indexable preview of a premium recipe: names and titles only. */
export function TeaserSections({ teaser: t }: { teaser: Teaser }) {
  return (
    <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-8 lg:grid-cols-[23rem_minmax(0,1fr)]">
      <section className="card overflow-hidden self-start" aria-labelledby="t-ingredients">
        <h2 id="t-ingredients" className="px-5 py-3 text-lg font-extrabold text-white" style={{ background: "var(--r-solid)" }}>
          مواد لازم
        </h2>
        {t.ingredientGroups.map((g, gi) => (
          <ul key={gi} className="divide-y text-[0.95rem]" style={{ borderColor: "var(--r-line)" }}>
            {g.names.map((n) => (
              <li key={n} className="flex items-center justify-between gap-3 px-5 py-2.5" style={{ borderColor: "var(--r-line)" }}>
                <span>{n}</span>
                <span aria-label="مقدار برای مشترکین" className="text-muted"><LockIcon width={15} height={15} /></span>
              </li>
            ))}
          </ul>
        ))}
        <p className="prose-note border-t px-5 py-3" style={{ borderColor: "var(--r-line)" }}>
          مقدارها فقط برای مشترکین نمایش داده می‌شود.
        </p>
      </section>

      <section className="card p-5 sm:p-6" aria-labelledby="t-steps">
        <h2 id="t-steps" className="text-xl font-extrabold">مراحل این دستور</h2>
        <ol className="mt-3 grid gap-2">
          {t.stageTitles.map((s, i) => (
            <li key={s} className="flex items-center gap-3 rounded-xl border px-3 py-2.5" style={{ borderColor: "var(--r-line)" }}>
              <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full text-sm text-white" style={{ background: "var(--r-solid)" }}>
                {fa(i + 1)}
              </span>
              <span className="font-bold">{s}</span>
              <LockIcon className="ms-auto text-muted" width={16} height={16} />
            </li>
          ))}
        </ol>
        <p className="prose-note mt-3">
          هر مرحله حرارت، زمان و نشانهٔ آماده شدن دارد؛ در انتها جدول {fa(t.mistakesCount)} اشتباه رایج و راه‌حل‌شان هم هست.
        </p>
      </section>
    </div>
  );
}

export function Paywall({ teaser: t }: { teaser: Teaser }) {
  const perks = [
    "مقدار دقیق همهٔ مواد، با پیمانهٔ خانگی",
    `${fa(t.stageTitles.length)} مرحله با حرارت، زمان و نشانهٔ آماده شدن`,
    `جدول ${fa(t.mistakesCount)} اشتباه رایج و راه‌حل‌شان`,
    "نگهداری، فریز و نکته‌های انتخاب مواد",
  ];
  return (
    <section className="container-page pt-8" aria-labelledby="paywall-title">
      <div className="card relative overflow-hidden p-6 sm:p-8" style={{ borderColor: "var(--brand)" }}>
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="badge-premium inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-sm font-bold">
              <LockIcon width={15} height={15} /> ویژهٔ مشترکین
            </p>
            <h2 id="paywall-title" className="mt-3 text-2xl font-extrabold leading-snug sm:text-3xl">
              «{t.title}» را با همهٔ جزئیات بپز
            </h2>
            <ul className="mt-4 grid gap-2">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <CheckIcon className="mt-1.5 shrink-0" style={{ color: "var(--r-accent)" }} width={18} height={18} />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-3 md:min-w-64">
            <Link href="/pricing" className="btn btn-primary">
              مشاهدهٔ اشتراک‌ها <ArrowIcon width={18} height={18} />
            </Link>
            <Link href="/login" className="btn btn-ghost">قبلاً مشترک شده‌ام</Link>
            <p className="text-center text-sm text-muted">بدون تمدید خودکار؛ هر زمان خواستی دوباره تمدید می‌کنی.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BodySkeleton() {
  return (
    <div className="container-page grid gap-4 py-8" aria-busy="true" aria-label="در حال بارگذاری">
      <div className="skeleton h-12" />
      <div className="skeleton h-40" />
      <div className="skeleton h-40" />
    </div>
  );
}
