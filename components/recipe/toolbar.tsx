import Link from "next/link";
import { getViewer } from "@/lib/dal";
import { isFavorite, listShopping } from "@/lib/db/userdata";
import { FavoriteToggle, ShoppingToggle } from "./actions";
import { HeartIcon, LockIcon, PlayIcon } from "../icons";

/** Heart button for the hero. Streams in behind Suspense: it reads the session. */
export async function FavoriteSlot({ slug }: { slug: string }) {
  const v = await getViewer();
  if (!v.user) {
    return (
      <Link href={`/login?next=/recipes/${slug}`} className="btn !min-h-11 !px-4 bg-surface text-ink">
        <HeartIcon width={20} height={20} />
        <span className="text-sm">ذخیره</span>
      </Link>
    );
  }
  return <FavoriteToggle slug={slug} initial={await isFavorite(v.user.id, slug)} />;
}

/** Cook mode and shopping list entry points. Rendered only where the full recipe is already readable. */
export async function RecipeToolbar({ slug }: { slug: string }) {
  const v = await getViewer();
  const subscriber = v.access === "subscriber" && v.user;
  const inList = subscriber ? ((await listShopping(v.user!.id)).find((s) => s.slug === slug)?.servings ?? null) : null;
  return (
    <div className="no-print flex flex-wrap gap-2">
      <Link href={`/recipes/${slug}/cook`} className="btn btn-primary !min-h-11 !px-5">
        <PlayIcon width={18} height={18} /> شروع آشپزی
      </Link>
      {subscriber ? (
        <ShoppingToggle slug={slug} initialServings={inList} />
      ) : (
        <Link href="/pricing" className="btn btn-ghost !min-h-11 !px-4">
          <LockIcon width={18} height={18} /> <span className="text-sm">لیست خرید (ویژهٔ مشترکین)</span>
        </Link>
      )}
    </div>
  );
}
