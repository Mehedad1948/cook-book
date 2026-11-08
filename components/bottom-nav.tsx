"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookIcon, HomeIcon, TagIcon, UserIcon } from "./icons";

const ITEMS = [
  { href: "/", label: "خانه", Icon: HomeIcon },
  { href: "/recipes", label: "دستور پخت‌ها", Icon: BookIcon },
  { href: "/pricing", label: "اشتراک", Icon: TagIcon },
  { href: "/login", label: "حساب", Icon: UserIcon },
] as const;

/** Thumb-reach navigation for phones; hidden from md up (the header nav takes over). */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="منوی پایین"
      className="no-print pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-4 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="pointer-events-auto flex items-center gap-1 rounded-full bg-ink/90 p-2 backdrop-blur">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={`flex h-12 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors ${
                  active ? "bg-paper text-ink" : "text-paper/80"
                }`}
              >
                <Icon width={22} height={22} />
                {active && <span>{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
