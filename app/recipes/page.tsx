import { Suspense } from "react";
import type { Metadata } from "next";
import { listCards } from "@/lib/recipe/load";
import { Catalog } from "@/components/catalog";

export const metadata: Metadata = {
  title: "همهٔ دستور پخت‌ها",
  description: "جستجو و فیلتر دستور پخت‌های ایرانی بر اساس نام، مواد موجود در یخچال، مناسبت و زمان پخت.",
  alternates: { canonical: "/recipes" },
};

export default async function RecipesPage() {
  const cards = await listCards();
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="section-title">دستور پخت‌ها</h1>
      <p className="mb-6 mt-1 text-muted">با نام غذا یا با مواردی که در یخچال داری جستجو کن.</p>
      <Suspense fallback={<div className="skeleton h-72" />}>
        <Catalog cards={cards} />
      </Suspense>
    </div>
  );
}
