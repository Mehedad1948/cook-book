import type { ReactNode } from "react";

/** Shared layout for the policy pages. These are DRAFTS until a person reviews them (docs/app-guide 6.5). */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <h1 className="section-title mb-4">{title}</h1>
      <p role="note" className="mb-8 rounded-2xl border border-dashed border-brand bg-brand-soft p-3 text-sm">
        <strong>پیش‌نویس:</strong> این متن هنوز توسط فرد مسئول بازبینی نشده و مشاورهٔ حقوقی نیست. پیش از دریافت پول واقعی باید بازبینی شود.
      </p>
      <div className="grid gap-4 leading-9 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-extrabold [&_ul]:list-disc [&_ul]:ps-6">{children}</div>
    </div>
  );
}
