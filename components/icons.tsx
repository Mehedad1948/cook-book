import type { SVGProps } from "react";

/** Small inline icon set. Directional icons carry `rtl-flip` where they point along the reading direction. */
type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const ClockIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const FlameIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 2 1.5 2C11 8 11 5 12 3Z" /></svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const LockIcon = (p: P) => (
  <svg {...base(p)}><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
export const UsersIcon = (p: P) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 5a3 3 0 0 1 0 6M18 14c1.8.7 3 2.4 3 4.5" /></svg>
);
export const SearchIcon = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
);
export const HomeIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 11 12 4l8 7" /><path d="M6 10v10h12V10" /></svg>
);
export const BookIcon = (p: P) => (
  <svg {...base(p)}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" /><path d="M5 17a3 3 0 0 1 3-3h11" /></svg>
);
export const UserIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></svg>
);
export const TagIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 12V4h8l9 9-8 8-9-9Z" /><circle cx="7.5" cy="8.5" r="1.2" /></svg>
);
export const ArrowIcon = (p: P) => (
  /* points toward the reading direction's end: left in RTL */
  <svg {...base({ ...p, className: `rtl-flip ${p.className ?? ""}` })} style={{ transform: "scaleX(-1)" }}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const ShieldIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /><path d="m9 12 2.2 2.2L15 10.5" /></svg>
);
export const SnowflakeIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9" /></svg>
);
export const WarnIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 4 3 20h18L12 4Z" /><path d="M12 10v4M12 17.2v.1" /></svg>
);
export const SparkIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /></svg>
);

export const HeartIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 20s-7-4.4-9-9.2C1.8 7.4 4 4.5 7 4.5c1.9 0 3.4 1 5 3 1.6-2 3.1-3 5-3 3 0 5.2 2.9 4 6.3-2 4.800-9 9.200-9 9.200Z" /></svg>
);
export const ListIcon = (p: P) => (
  <svg {...base(p)}><path d="M9 6h11M9 12h11M9 18h11" /><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2" /></svg>
);
export const PlayIcon = (p: P) => (
  <svg {...base(p)}><path d="M7 4.5v15l12-7.500L7 4.500Z" /></svg>
);

/** Brand mark: a chef's hat with a small keyhole ("secret"). */
export function LogoMark(p: P) {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" aria-hidden="true" {...p}>
      <path d="M9 12.5a4.5 4.5 0 0 1 2-8.6 5.5 5.5 0 0 1 10 0 4.5 4.5 0 0 1 2 8.6V22H9v-9.5Z" fill="currentColor" />
      <rect x="9" y="23.5" width="14" height="4" rx="1.5" fill="currentColor" opacity=".55" />
      <circle cx="16" cy="14.5" r="2" fill="var(--paper)" />
      <path d="M15.2 16h1.6l.5 4h-2.6l.5-4Z" fill="var(--paper)" />
    </svg>
  );
}
