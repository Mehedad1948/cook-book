"use client";

const KEY = "theme";

function toggle() {
  const root = document.documentElement;
  const dark =
    root.dataset.theme === "dark" ||
    (!root.dataset.theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const next = dark ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {}
}

/** Both icons render; CSS (.theme-sun / .theme-moon) shows the right one, so there is no hydration mismatch. */
export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="تغییر پوسته (روشن/تاریک)"
      title="تغییر پوسته"
      className="btn btn-ghost !min-h-10 !w-10 !p-0"
    >
      <svg className="theme-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg className="theme-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
