import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/dal";
import { listCards } from "@/lib/recipe/load";
import { listFavoriteSlugs, recentlyCooked } from "@/lib/db/userdata";
import { RecipeCard } from "@/components/recipe-card";

export const metadata: Metadata = { title: "علاقه‌مندی‌ها", robots: { index: false } };

export default function FavoritesPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="section-title mb-6">علاقه‌مندی‌ها</h1>
      <Suspense fallback={<div className="skeleton h-64" />}>
        <Body />
      </Suspense>
    </div>
  );
}

async function Body() {
  const v = await getViewer();
  if (!v.user) redirect("/login?next=/favorites");
  const [slugs, cooked, cards] = await Promise.all([listFavoriteSlugs(v.user.id), recentlyCooked(v.user.id), listCards()]);
  const pick = (list: string[]) => list.map((s) => cards.find((c) => c.slug === s)).filter((c) => c !== undefined);
  const favs = pick(slugs);
  const done = pick(cooked);

  return (
    <div className="grid gap-10">
      {favs.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{favs.map((c) => <RecipeCard key={c.slug} recipe={c} />)}</div>
      ) : (
        <div className="card grid place-items-center gap-3 p-10 text-center">
          <p className="text-lg font-bold">هنوز دستوری ذخیره نکرده‌ای</p>
          <p className="text-muted">روی دکمهٔ «ذخیره» در صفحهٔ هر دستور بزن.</p>
          <Link href="/recipes" className="btn btn-primary">دیدن دستورها</Link>
        </div>
      )}
      {done.length > 0 && (
        <section>
          <h2 className="section-title mb-4">اخیراً پخته‌ای</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{done.map((c) => <RecipeCard key={c.slug} recipe={c} />)}</div>
        </section>
      )}
    </div>
  );
}
