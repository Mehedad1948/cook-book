import Link from "next/link";
import { listCards } from "@/lib/recipe/load";
import { CATEGORIES } from "@/lib/recipe/schema";
import { CATEGORY_LABEL } from "@/lib/recipe/labels";
import { BRAND } from "@/lib/site";
import { RecipeCard } from "@/components/recipe-card";
import { ArrowIcon, CheckIcon, ClockIcon, SearchIcon, WarnIcon } from "@/components/icons";

const QUICK = [
  { href: "/recipes?occasion=daily", label: "شام امشب" },
  { href: "/recipes?occasion=guests", label: "غذای مهمانی" },
  { href: "/recipes?time=30", label: "زیر ۳۰ دقیقه" },
  { href: "/recipes?mode=pantry", label: "چی تو یخچال دارم؟" },
];

const PILLARS = [
  {
    Icon: ClockIcon,
    title: "حرارت و زمان، کنار هم",
    text: "هر مرحله می‌گوید روی چه حرارتی و چند دقیقه؛ بدون «تا جا بیفتد» و «به اندازه».",
  },
  {
    Icon: CheckIcon,
    title: "نشانهٔ آماده شدن",
    text: "زمان فقط راهنماست؛ نشانه تصمیم می‌گیرد: «تا طلایی شود»، «تا روغنش جدا شود».",
  },
  {
    Icon: WarnIcon,
    title: "جدول اشتباه‌های رایج",
    text: "اگر سیب‌زمینی له شد یا غذا شور شد، علت و راه‌حلش همان‌جا نوشته شده است.",
  },
];

export default async function Home() {
  const cards = await listCards();
  const free = cards.filter((c) => c.access === "free");
  const featured = free[0] ?? cards[0];
  const rest = cards.filter((c) => c.slug !== featured?.slug);

  return (
    <>
      {/* Hero: the brand, large and centred */}
      <section className="hero relative isolate overflow-hidden">
        <span className="hero-blob hero-blob-a" aria-hidden />
        <span className="hero-blob hero-blob-b" aria-hidden />
        <span className="hero-blob hero-blob-c" aria-hidden />

        <div className="container-page relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center py-16 text-center">
          <div className="hero-title">
            <div className="hero-flame" aria-hidden>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => <i key={i} style={{ "--i": i, "--d": Math.abs(i - 3) } as React.CSSProperties} />)}
            </div>
            <h1 className="hero-brand" aria-label={BRAND}>
              <span className="text-brand">راز</span>
              <span>سرآشپز</span>
            </h1>
          </div>
          <p className="hero-lede">دستور پخت‌های دقیق، دیگر <span className="font-brand text-brand text-[1.3em]">رازی</span> در میان نیست</p>

          <form action="/recipes" role="search" className="hero-search mt-10">
            <label className="relative flex-1">
              <span className="sr-only">جستجوی دستور پخت</span>
              <SearchIcon className="pointer-events-none absolute inset-y-0 start-5 my-auto text-muted" />
              <input
                name="q"
                type="search"
                placeholder="امشب چی بپزم؟"
                className="h-14 w-full rounded-full bg-transparent ps-14 pe-4 text-base placeholder:text-muted/70 focus:outline-none"
              />
            </label>
            <button className="btn btn-primary h-12 shrink-0 px-7" type="submit">بگرد</button>
          </form>

          <ul className="mt-6 flex max-w-xl flex-wrap justify-center gap-2" aria-label="میان‌بُرها">
            {QUICK.map((q) => (
              <li key={q.href}>
                <Link href={q.href} className="chip min-h-10 bg-surface/70 backdrop-blur hover:bg-brand-soft">{q.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Featured free showcase */}
      {featured && (
        <section className="container-page py-12" aria-labelledby="featured-title">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 id="featured-title" className="section-title">امتحانش کن؛ رایگان</h2>
              <p className="text-muted">یک دستور کامل، دقیقاً با همان جزئیاتی که مشترک‌ها می‌بینند.</p>
            </div>
            <Link href="/recipes" className="hidden items-center gap-1 font-bold text-brand-ink sm:flex">
              همهٔ دستورها <ArrowIcon width={18} height={18} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <RecipeCard recipe={featured} priority />
            {rest.map((c) => <RecipeCard key={c.slug} recipe={c} />)}
          </div>
        </section>
      )}

      {/* Why us */}
      <section className="border-y border-line bg-sunken py-12" aria-labelledby="why-title">
        <div className="container-page">
          <h2 id="why-title" className="section-title mb-6">چرا «راز سرآشپز»؟</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {PILLARS.map(({ Icon, title, text }) => (
              <div key={title} className="card p-5">
                <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
                  <Icon width={24} height={24} />
                </span>
                <h3 className="mt-3 text-lg font-extrabold">{title}</h3>
                <p className="mt-1 text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-12" aria-labelledby="cats-title">
        <h2 id="cats-title" className="section-title mb-5">دسته‌ها</h2>
        <ul className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <li key={c}>
              <Link href={`/category/${c}`} className="chip min-h-11 bg-surface px-5 text-base hover:bg-brand-soft">
                {CATEGORY_LABEL[c]}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Subscription teaser */}
      <section className="container-page pb-12" aria-labelledby="sub-title">
        <div
          className="card overflow-hidden p-6 sm:p-10"
          style={{ background: "var(--brand-soft)" }}
        >
          <h2 id="sub-title" className="section-title">دستورهای ویژهٔ مشترکین</h2>
          <p className="mt-2 max-w-2xl text-muted">
            دستورهای سخت‌تر و خاص با جدول‌های کمکی، نکته‌های انتخاب مواد و نگهداری. اشتراک پیش‌پرداخت است و تمدید خودکار ندارد.
          </p>
          <Link href="/pricing" className="btn btn-primary mt-5">
            مشاهدهٔ اشتراک‌ها <ArrowIcon width={18} height={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
