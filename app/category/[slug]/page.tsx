import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listCards } from "@/lib/recipe/load";
import { CATEGORIES, type Category } from "@/lib/recipe/schema";
import { CATEGORY_BLURB, CATEGORY_LABEL } from "@/lib/recipe/labels";
import { RecipeCard } from "@/components/recipe-card";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CATEGORIES.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!(CATEGORIES as readonly string[]).includes(slug)) return {};
  return {
    title: CATEGORY_LABEL[slug as Category],
    description: CATEGORY_BLURB[slug as Category],
    alternates: { canonical: `/category/${slug}` },
  };
}

export default function CategoryPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="container-page py-12"><div className="skeleton h-64" /></div>}>
      <CategoryView params={params} />
    </Suspense>
  );
}

async function CategoryView({ params }: Props) {
  const { slug } = await params;
  if (!(CATEGORIES as readonly string[]).includes(slug)) notFound();
  const category = slug as Category;
  const cards = (await listCards()).filter((c) => c.category === category);

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="section-title">{CATEGORY_LABEL[category]}</h1>
      <p className="mb-6 mt-1 max-w-2xl text-muted">{CATEGORY_BLURB[category]}</p>
      {cards.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => <RecipeCard key={c.slug} recipe={c} />)}
        </div>
      ) : (
        <div className="card grid place-items-center gap-3 p-10 text-center">
          <p className="text-lg font-bold">هنوز دستوری در این دسته نیست</p>
          <p className="text-muted">به‌زودی اضافه می‌شود.</p>
          <Link href="/recipes" className="btn btn-ghost">دیدن همهٔ دستورها</Link>
        </div>
      )}
    </div>
  );
}
