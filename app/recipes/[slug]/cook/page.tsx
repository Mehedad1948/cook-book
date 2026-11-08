import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeForViewer } from "@/lib/dal";
import { getPublicRecipe, listSlugs } from "@/lib/recipe/load";
import { CookMode } from "@/components/cook-mode";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await listSlugs()).map((slug) => ({ slug }));
}

export const metadata: Metadata = { title: "حالت آشپزی", robots: { index: false } };

export default function CookPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="container-page py-10"><div className="skeleton h-[70vh]" /></div>}>
      <CookView params={params} />
    </Suspense>
  );
}

/** Same gate as the recipe body: the full recipe reaches the client only if canRead() allows it. */
async function CookView({ params }: Props) {
  const { slug } = await params;
  const recipe = await getRecipeForViewer(slug);
  if (!recipe) {
    const pub = await getPublicRecipe(slug);
    if (!pub) notFound();
    return (
      <div className="container-page grid min-h-[60vh] place-items-center py-12">
        <div className="card max-w-md p-8 text-center">
          <h1 className="text-xl font-extrabold">حالت آشپزی ویژهٔ مشترکین است</h1>
          <p className="mt-2 text-muted">برای این دستور اشتراک لازم است.</p>
          <div className="mt-5 grid gap-3">
            <Link href="/pricing" className="btn btn-primary">مشاهدهٔ اشتراک‌ها</Link>
            <Link href={`/recipes/${slug}`} className="btn btn-ghost">بازگشت به دستور</Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <CookMode
      slug={recipe.slug}
      title={recipe.title}
      stages={recipe.stages}
      ingredients={recipe.ingredients}
      servings={recipe.facts.servings}
    />
  );
}
