import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicRecipe, listCards, listSlugs } from "@/lib/recipe/load";
import { getRecipeForViewer } from "@/lib/dal";
import type { Teaser } from "@/lib/recipe/public";
import { breadcrumbJsonLd, recipeJsonLd } from "@/lib/recipe/jsonld";
import { CATEGORY_LABEL } from "@/lib/recipe/labels";
import { JsonLd } from "@/components/json-ld";
import { RecipeCard } from "@/components/recipe-card";
import { FavoriteSlot } from "@/components/recipe/toolbar";
import { BodySkeleton, Paywall, RecipeHero, RecipeSections, TeaserSections } from "@/components/recipe/parts";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await listSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublicRecipe(slug);
  if (!p) return {};
  const m = p.kind === "full" ? p.recipe : p;
  return {
    title: m.altTitle ? `${m.title} (${m.altTitle})` : m.title,
    description: m.summary,
    alternates: { canonical: `/recipes/${slug}` },
    openGraph: { title: m.title, description: m.summary, type: "article", locale: "fa_IR" },
  };
}

export default function RecipePage({ params }: Props) {
  // params is awaited below the boundary so the shell never blocks on URL data.
  return (
    <Suspense fallback={<BodySkeleton />}>
      <RecipeView params={params} />
    </Suspense>
  );
}

async function RecipeView({ params }: Props) {
  const { slug } = await params;
  const pub = await getPublicRecipe(slug);
  if (!pub) notFound();

  const meta = pub.kind === "full" ? pub.recipe : pub;
  return (
    <div className="recipe-scope">
      <JsonLd data={recipeJsonLd(pub)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "دستور پخت‌ها", path: "/recipes" },
          { name: CATEGORY_LABEL[meta.category], path: `/category/${meta.category}` },
          { name: meta.title, path: `/recipes/${slug}` },
        ])}
      />
      <RecipeHero
        recipe={meta}
        actions={
          <Suspense fallback={null}>
            <FavoriteSlot slug={slug} />
          </Suspense>
        }
      />

      {pub.kind === "full" ? (
        // Free recipe: the whole body is part of the static, cached shell.
        <RecipeSections recipe={pub.recipe} />
      ) : (
        // Premium: teaser is the prerendered fallback; the viewer-specific body streams in.
        <Suspense fallback={<TeaserSections teaser={pub} />}>
          <PremiumBody slug={slug} teaser={pub} />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <MoreRecipes currentSlug={slug} />
      </Suspense>
    </div>
  );
}

/** Dynamic island: reads the session via the DAL. Premium text is only loaded when canRead() allows it. */
async function PremiumBody({ slug, teaser }: { slug: string; teaser: Teaser }) {
  const full = await getRecipeForViewer(slug);
  if (full) return <RecipeSections recipe={full} />;
  return (
    <>
      <Paywall teaser={teaser} />
      <TeaserSections teaser={teaser} />
    </>
  );
}

async function MoreRecipes({ currentSlug }: { currentSlug: string }) {
  const cards = (await listCards()).filter((c) => c.slug !== currentSlug);
  if (cards.length === 0) return null;
  return (
    <section className="container-page pb-4 pt-6 no-print" aria-labelledby="more-title">
      <h2 id="more-title" className="section-title mb-4">دستورهای دیگر</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.slice(0, 3).map((c) => <RecipeCard key={c.slug} recipe={c} />)}
      </div>
    </section>
  );
}
