import type React from "react";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { BRAND, BRAND_LATIN } from "@/lib/site";
import { LOGO_ACCENT_PATHS, LOGO_ASPECT, LOGO_OUTLINE_PATH, LOGO_VIEWBOX } from "@/lib/logo";
import { shapeArabic } from "@/lib/og-shape";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const fonts = Promise.all([
  readFile(join(process.cwd(), "app/fonts/Bahar-Bold-og.ttf")),
  readFile(join(process.cwd(), "app/fonts/Vazirmatn-Medium.ttf")),
  readFile(join(process.cwd(), "app/fonts/Vazirmatn-Bold.ttf")),
]);

type OgProps = {
  title: string;
  /** Small line above the title (category, tagline). */
  eyebrow?: string;
  /** Latin or alternate name shown under the title. */
  subtitle?: string;
  /** Short pills along the bottom (time, servings, ...). */
  chips?: string[];
  accent?: string;
  soft?: string;
  /** Top-right logo + brand name row; the home page drops it because the brand is the title. */
  showBrand?: boolean;
  titleSize?: number;
};

const RTL_CHARS = /[؀-ۿ]/;

/**
 * satori lays words out left-to-right even inside direction: rtl, so Persian lines come out
 * reversed. Each word is therefore its own box in a row-reverse flex container (words wrap right
 * to left), and the word's letters are pre-shaped into presentation forms (see og-shape.ts).
 */
function Text({ children, style }: { children: string; style: React.CSSProperties }) {
  if (!RTL_CHARS.test(children)) return <div style={{ display: "flex", ...style }}>{children}</div>;
  const gap = Math.round(Number(style.fontSize ?? 32) * 0.28);
  return (
    <div style={{ display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", columnGap: gap, ...style }}>
      {children.split(/\s+/).filter(Boolean).map((w, i) => (
        <div key={i} style={{ display: "flex" }}>{shapeArabic(w)}</div>
      ))}
    </div>
  );
}

function Logo({ height, color, ink }: { height: number; color: string; ink: string }) {
  return (
    <svg width={Math.round(height * LOGO_ASPECT)} height={height} viewBox={LOGO_VIEWBOX}>
      {LOGO_ACCENT_PATHS.map((d, i) => (
        <path key={i} d={d} fill={color} />
      ))}
      <path d={LOGO_OUTLINE_PATH} fill={ink} />
    </svg>
  );
}

/** One layout for the home page and every recipe: warm paper, accent glow, Bahar title. */
export async function renderOg({
  title,
  eyebrow,
  subtitle,
  chips = [],
  accent = "#7a58e8",
  soft = "#d3c9fb",
  showBrand = true,
  titleSize: titleSizeOverride,
}: OgProps) {
  const [bahar, vazirMedium, vazirBold] = await fonts;
  const titleSize = titleSizeOverride ?? (title.length > 28 ? 76 : title.length > 14 ? 92 : 128);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
          background: "#fffdf9",
          fontFamily: "Vazirmatn",
          color: "#1b1530",
          position: "relative",
        }}
      >
        {/* decorative glow + rings, anchored to the left (the "end" side in RTL) */}
        <div style={{ position: "absolute", left: -180, top: -200, width: 640, height: 640, borderRadius: 999, background: soft, opacity: 0.85, display: "flex" }} />
        <div style={{ position: "absolute", left: -60, top: -80, width: 400, height: 400, borderRadius: 999, background: accent, opacity: 0.18, display: "flex" }} />
        <div style={{ position: "absolute", left: 40, bottom: -260, width: 520, height: 520, borderRadius: 999, border: `2px solid ${accent}`, opacity: 0.25, display: "flex" }} />
        <div style={{ position: "absolute", left: 110, bottom: -190, width: 380, height: 380, borderRadius: 999, border: `2px solid ${accent}`, opacity: 0.2, display: "flex" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 14, background: accent, display: "flex" }} />

        {/* brand row */}
        {showBrand ? (
          <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 18 }}>
            <Logo height={64} color={accent} ink="#1b1530" />
            <Text style={{ fontFamily: "Bahar", fontSize: 46, color: "#1b1530" }}>{BRAND}</Text>
          </div>
        ) : (
          <div style={{ display: "flex" }} />
        )}

        {/* title block */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, gap: 16, width: 1040 }}>
          {eyebrow ? (
            <div style={{ display: "flex", alignSelf: "flex-end", padding: "6px 24px", borderRadius: 999, background: soft }}>
              <Text style={{ fontSize: 28, fontWeight: 700, color: "#1b1530" }}>{eyebrow}</Text>
            </div>
          ) : null}
          <Text style={{ fontFamily: "Bahar", fontSize: titleSize, lineHeight: 1.3, color: "#1b1530" }}>{title}</Text>
          {subtitle ? <Text style={{ fontSize: 34, fontWeight: 500, color: "#6a6385" }}>{subtitle}</Text> : null}
        </div>

        {/* footer row */}
        <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "row-reverse", gap: 14 }}>
            {chips.map((c) => (
              <div
                key={c}
                style={{ display: "flex", padding: "8px 26px", borderRadius: 999, border: "2px solid #ddd5f8", background: "#ffffff" }}
              >
                <Text style={{ fontSize: 28, fontWeight: 500, color: "#1b1530" }}>{c}</Text>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#6a6385" }}>{BRAND_LATIN.toUpperCase()}</div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        // Vazirmatn must come first: with Bahar first, satori's glyph fallback crashes on Persian text.
        { name: "Vazirmatn", data: vazirMedium, style: "normal", weight: 500 },
        { name: "Vazirmatn", data: vazirBold, style: "normal", weight: 700 },
        { name: "Bahar", data: bahar, style: "normal", weight: 700 },
      ],
    },
  );
}
