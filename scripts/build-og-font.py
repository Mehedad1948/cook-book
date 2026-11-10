"""
Builds app/fonts/Bahar-Bold-og.ttf for the OG image renderer (lib/og.tsx).

satori cannot apply OpenType init/medi/fina substitutions, and it measures Arabic text unshaped, so
Persian lines come out with wrong widths. lib/og-shape.ts therefore shapes text itself into Arabic
Presentation Forms; this script gives Bahar a cmap entry for each of those forms by following the
font's own GSUB init/medi/fina substitutions. Needs: pip install fonttools brotli

  python scripts/build-og-font.py
"""
import json
import unicodedata
from fontTools.ttLib import TTFont

SRC = "app/fonts/Bahar-Bold.woff2"
OUT = "app/fonts/Bahar-Bold-og.ttf"
TABLE = "lib/og-forms.json"

font = TTFont(SRC)
font.flavor = None
cmap = font.getBestCmap()

# base letter -> {iso, fin, ini, med} presentation-form code points, from Unicode compat decompositions
forms = {}
for cp in list(range(0xFB50, 0xFDFF)) + list(range(0xFE70, 0xFEFD)):
    dec = unicodedata.decomposition(chr(cp)).split()
    if len(dec) != 2 or dec[0] not in ("<isolated>", "<final>", "<initial>", "<medial>"):
        continue
    base = int(dec[1], 16)
    forms.setdefault(base, {})[dec[0][1:4]] = cp
# lam-alef ligatures decompose to lam + alef; keyed by the alef
lig = {}
for cp in range(0xFEF5, 0xFEFD):
    dec = unicodedata.decomposition(chr(cp)).split()
    lig.setdefault(int(dec[2], 16), {})["fin" if dec[0] == "<final>" else "iso"] = cp

# GSUB single substitutions per feature
gsub = font["GSUB"].table
def feature_map(tag):
    m = {}
    for fr in gsub.FeatureList.FeatureRecord:
        if fr.FeatureTag != tag:
            continue
        for li in fr.Feature.LookupListIndex:
            for st in gsub.LookupList.Lookup[li].SubTable:
                st = getattr(st, "ExtSubTable", st)
                m.update(getattr(st, "mapping", {}))
    return m
subst = {"ini": feature_map("init"), "med": feature_map("medi"), "fin": feature_map("fina")}

added = 0
for base, fs in forms.items():
    g = cmap.get(base)
    if not g:
        continue
    for kind, cp in fs.items():
        glyph = g if kind == "iso" else subst[kind].get(g)
        if glyph and cp not in cmap:
            for t in font["cmap"].tables:
                if t.isUnicode():
                    t.cmap[cp] = glyph
            added += 1

font.save(OUT)
json.dump({"forms": {str(k): v for k, v in forms.items()}, "lig": {str(k): v for k, v in lig.items()}},
          open(TABLE, "w"), separators=(",", ":"))
print("added", added, "cmap entries ->", OUT)
