import table from "./og-forms.json";

/**
 * Minimal Arabic-script shaper for the OG image renderer. satori can neither apply OpenType
 * init/medi/fina nor measure shaped text, so we pick the Arabic Presentation Form of every letter
 * ourselves. Fonts must carry those code points (see scripts/build-og-font.py for Bahar).
 */

type Forms = { iso?: number; fin?: number; ini?: number; med?: number };
const FORMS = table.forms as unknown as Record<string, Forms>;
const LIG = table.lig as unknown as Record<string, { iso: number; fin: number }>;
const LAM = 0x0644;

const forms = (c: number): Forms | undefined => FORMS[c];
const joinsToNext = (c: number) => forms(c)?.ini != null;
const joinsToPrev = (c: number) => forms(c)?.fin != null;

const LTR_RUN = /([A-Za-z0-9۰-۹٫٬]+)/;

/**
 * Presentation forms are drawn in the order given (satori does not run bidi on them), so the
 * result is visual order: runs and letters reversed, digit/Latin runs kept readable.
 */
export function shapeArabic(input: string): string {
  return shapeLogical(input)
    .split(LTR_RUN)
    .map((run, i) => (i % 2 ? run : Array.from(run).reverse().join("")))
    .reverse()
    .join("");
}

function shapeLogical(input: string): string {
  const cps = Array.from(input.replace(/هٔ/g, "ۀ").replace(/[ً-ْٰٔ]/g, ""), (ch) => ch.codePointAt(0)!);
  let out = "";
  for (let i = 0; i < cps.length; i++) {
    const c = cps[i];
    const f = forms(c);
    if (!f) {
      if (c !== 0x200c) out += String.fromCodePoint(c); // ZWNJ only breaks joining
      continue;
    }
    const prevJoins = i > 0 && joinsToNext(cps[i - 1]) && joinsToPrev(c);
    const lig = c === LAM ? LIG[cps[i + 1]] : undefined;
    if (lig) {
      out += String.fromCodePoint(prevJoins ? lig.fin : lig.iso);
      i++;
      continue;
    }
    const nextJoins = i + 1 < cps.length && joinsToNext(c) && joinsToPrev(cps[i + 1]);
    const pick = prevJoins ? (nextJoins ? f.med : f.fin) : nextJoins ? f.ini : f.iso;
    out += String.fromCodePoint(pick ?? c);
  }
  return out;
}
