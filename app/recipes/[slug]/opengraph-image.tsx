import { notFound } from "next/navigation";
import { getPublicRecipe } from "@/lib/recipe/load";
import { formatTotalTime } from "@/lib/format";
import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "دستور پخت";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublicRecipe(slug);
  if (!p) notFound();
  const m = p.kind === "full" ? p.recipe : p;
  return renderOg({
    title: m.title,
    subtitle: m.altTitle,
    chips: [formatTotalTime(m.facts.totalMinutes, m.facts.approxTime)],
    accent: m.accent.accent,
    soft: m.accent.soft,
  });
}
