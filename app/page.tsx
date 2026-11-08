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
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="container-page py-12 sm:py-20">
          <p className="chip mb-4 border-transparent !bg-lime font-bold text-[#1f4a0c]">{BRAND}</p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.5] sm:text-6xl sm:leading-[1.45]">
            دستورهایی که <span className="text-brand">بار اول</span> درست درمی‌آیند
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-9 text-muted sm:text-xl">
            مقدار دقیق، حرارت و زمان، نشانهٔ آماده شدن هر مرحله، و راز کوچک‌هایی که تفاوت می‌سازند؛ برای آشپزی که نمی‌خواهد مواد و وقتش هدر برود.
          </p>

          <form action="/recipes" role="search" className="mt-8 flex max-w-2xl gap-2">
            <label className="relative flex-1">
              <span className="sr-only">جستجوی دستور پخت</span>
              <SearchIcon className="pointer-events-none absolute inset-y-0 start-4 my-auto text-muted" />
              <input
                name="q"
                type="search"
                placeholder="امشب چی بپزم؟ مثلاً: سوسیس، بریونی"
                className="h-14 w-full rounded-full border border-line bg-surface ps-12 pe-4 text-base placeholder:text-muted/70"
              />
            </label>
            <button className="btn btn-primary h-14 shrink-0 px-6" type="submit">بگرد</button>
          </form>

          <ul className="mt-5 flex flex-wrap gap-2" aria-label="میان‌بُرها">
            {QUICK.map((q) => (
              <li key={q.href}>
                <Link href={q.href} className="chip min-h-10 bg-surface hover:bg-brand-soft">{q.label}</Link>
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
