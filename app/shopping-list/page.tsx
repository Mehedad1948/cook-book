import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer, getRecipeForViewer } from "@/lib/dal";
import { listShopping } from "@/lib/db/userdata";
import { buildShoppingList, shoppingText } from "@/lib/recipe/shopping";
import type { Recipe } from "@/lib/recipe/schema";
import { fa } from "@/lib/format";
import { ShoppingView } from "@/components/shopping-view";

export const metadata: Metadata = { title: "لیست خرید", robots: { index: false } };

export default function ShoppingPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="section-title mb-6">لیست خرید</h1>
      <Suspense fallback={<div className="skeleton h-64" />}>
        <Body />
      </Suspense>
    </div>
  );
}

async function Body() {
  const v = await getViewer();
  if (!v.user) redirect("/login?next=/shopping-list");
  if (v.access !== "subscriber") {
    return (
      <div className="card grid max-w-md place-items-center gap-3 p-8 text-center">
        <p className="text-lg font-bold">لیست خرید ویژهٔ مشترکین است</p>
        <p className="text-muted">مواد چند دستور را یک‌جا جمع می‌کند و برای خرید می‌توانی آن را در تلگرام یا واتس‌اپ بفرستی.</p>
        <Link href="/pricing" className="btn btn-primary">مشاهدهٔ اشتراک‌ها</Link>
      </div>
    );
  }

  const items = await listShopping(v.user.id);
  const loaded = await Promise.all(items.map(async (i) => ({ recipe: await getRecipeForViewer(i.slug), servings: i.servings })));
  const entries = loaded.filter((e): e is { recipe: Recipe; servings: number } => e.recipe !== null);
  const lines = buildShoppingList(entries);

  if (!entries.length) {
    return (
      <div className="card grid max-w-md place-items-center gap-3 p-8 text-center">
        <p className="text-lg font-bold">لیست خالی است</p>
        <p className="text-muted">در صفحهٔ هر دستور «افزودن به لیست خرید» را بزن.</p>
        <Link href="/recipes" className="btn btn-primary">دیدن دستورها</Link>
      </div>
    );
  }

  return (
    <div className="grid max-w-2xl gap-4">
      <ul className="flex flex-wrap gap-2" aria-label="دستورهای لیست">
        {entries.map((e) => (
          <li key={e.recipe.slug}>
            <Link href={`/recipes/${e.recipe.slug}`} className="chip">{e.recipe.title} · {fa(e.servings)} نفر</Link>
          </li>
        ))}
      </ul>
      <ShoppingView lines={lines} text={shoppingText(lines)} />
    </div>
  );
}
