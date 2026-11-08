import Link from "next/link";
import type { RecipeMeta } from "@/lib/recipe/public";
import { CATEGORY_LABEL, DIFFICULTY_LABEL } from "@/lib/recipe/labels";
import { formatTotalTime } from "@/lib/format";
import { ClockIcon, LockIcon } from "./icons";

export const tileOf = (slug: string) => [...slug].reduce((a, c) => a + c.charCodeAt(0), 0) % 4;

/** Pure presentational card: usable from server and client components. Takes teaser-safe data only. */
export function RecipeCard({ recipe: r, priority = false }: { recipe: RecipeMeta; priority?: boolean }) {
  const premium = r.access === "premium";
  return (
    <Link
      href={`/recipes/${r.slug}`}
      prefetch={priority}
      className="card group flex flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-1"
    >
      <div className={`tile-${tileOf(r.slug)} relative flex h-36 items-end justify-between overflow-hidden p-4 text-ink`}>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-8 -end-3 select-none text-[10rem] font-extrabold leading-none text-ink/10"
        >
          {r.title.charAt(0)}
        </span>
        <span className="relative rounded-full bg-surface/80 px-3 py-0.5 text-xs font-medium backdrop-blur">
          {CATEGORY_LABEL[r.category]}
        </span>
        <span
          className={`relative flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold ${
            premium ? "badge-premium" : "badge-free"
          }`}
        >
          {premium && <LockIcon width={14} height={14} />}
          {premium ? "ویژهٔ مشترکین" : "رایگان"}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-extrabold leading-snug group-hover:text-brand-ink">{r.title}</h3>
        {r.altTitle && <p className="-mt-1 text-sm text-muted">{r.altTitle}</p>}
        <p className="line-clamp-2 text-sm text-muted">{r.summary}</p>
        <div className="mt-auto flex items-center gap-3 pt-2 text-sm text-muted">
          <span className="flex items-center gap-1">
            <ClockIcon width={16} height={16} />
            {formatTotalTime(r.facts.totalMinutes, r.facts.approxTime)}
          </span>
          <span className="flex items-center gap-1.5" title={DIFFICULTY_LABEL[r.facts.difficulty]}>
            <span aria-hidden="true" className="flex gap-0.5">
              {[1, 2, 3].map((d) => (
                <i
                  key={d}
                  className="size-2 rounded-full"
                  style={{ background: d <= r.facts.difficulty ? "var(--brand)" : "var(--line)" }}
                />
              ))}
            </span>
            {DIFFICULTY_LABEL[r.facts.difficulty]}
          </span>
        </div>
      </div>
    </Link>
  );
}
