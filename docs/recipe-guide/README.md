# Recipe Writing Guide

What makes our Persian recipes good: exact enough that a first-timer gets it right, short enough that nothing is filler, and enriched with the few tips that actually save the dish.

**Output format:** one TypeScript file per recipe, `content/recipes/<slug>.ts`, exporting `defineRecipe({...})`. The schema is in `lib/recipe/schema.ts` (field list: `docs/app-guide/README.md` section 3.2). Do not write HTML. The website renders the data, so never put markup in text; the only inline markup allowed is `**bold**`.

**Reference:** `content/recipes/beryani-isfahani.ts` (premium) and `content/recipes/khorak-bandari.ts` (free) are the models for tone, detail and structure. The older HTML versions in `examples/` are visual reference only.

**Workflow:** write the file, run `npm run validate:recipes` (it automates the checklist in section 7 and also runs before every build), fix what it reports, then open `/recipes/<slug>` to check it visually.

---

## 1. Principles

1. **Exact, not vague.** Every quantity has a number and a unit, every heat step has a heat level and a time, every "until" has a visible cue.
2. **Useful, not wordy.** A sentence earns its place only if the reader would do something wrong without it.
3. **Correct, not copied.** Check every step against how the dish is really made, then fix or remove what's wrong.
4. **Complete, not overloaded.** Answer the questions a cook will ask *while cooking* (substitutes, equipment, "is it done?", "what went wrong?"). Leave out history, stories and praise.
5. **Scannable.** A cook glances at the page with wet hands: short lines, numbers easy to find, one idea per item.

## 2. Being exact

- **Quantities:** grams plus a household measure for main items: `۲۰۰ گرم (۱ لیوان)`. Meat and seafood: with or without bone/shell, and the other weight too: `۵۰۰ گرم بی‌استخوان (با استخوان حدود ۷۵۰ گرم)`. Optional items say `اختیاری`.
- **Heat and time together:** `۸ تا ۱۰ دقیقه روی حرارت متوسط`. Give a range, not a single number.
- **A visible "done" cue for every step:** `تا طلایی شود`، `تا رنگش صورتی شود`، `تا روغن از کنارش جدا شود`، `تا گوشت راحت از استخوان جدا شود`. Time is a guide; the cue decides.
- **Concrete sizes:** `مکعبی ۱ سانتی‌متر`، `ضخامت ۱ تا ۱½ سانتی‌متر`، `هر پرس ۱۲۰ تا ۱۵۰ گرم`.
- **Different timings, stated separately.** If two ingredients cook in one pot, give each its own time (beryani: lung 1–1½ h, meat 2½–3 h, pressure cooker 45–60 min).
- **Never** `به مقدار لازم` for anything except salt and pepper, and never `به سلیقهٔ خودتان` without a starting amount.

## 3. Enriching without bloating

Add these, and only these:

| Kind | Example |
|------|---------|
| **The "why" that prevents a failure** | Raw potato won't cook in the sauce; it goes mushy and clouds it. Fry it first. |
| **A non-obvious technique** | Lung floats, so weigh it down with a plate so it cooks evenly. Lift shrimp out of the water so the sand stays behind. |
| **Choosing ingredients** | Fat should be 15–20% of the meat weight. Sausage with 70%+ meat holds its shape. Fresh shrimp smells of sea, not ammonia. |
| **Substitutes for an Iranian kitchen** | Rice vinegar → سرکهٔ سیب. Fresh red chili → پول‌بیبر + فلفل دلمهٔ قرمز. |
| **Equipment and stove questions** | Ladle material (copper, cast iron, aluminium) and the heat for each; home gas stove is fine; induction only with cast iron. |
| **Heat level / taste adjustment** | Mild, medium, hot by how many chili seeds you keep. A base ratio to adjust from (sugar 2 : water 2 : vinegar 1). |
| **A common mistake and its fix** | Collected in the mistakes table (section 4). |
| **Safety** | Cooling and reheating limits for rice and seafood, vinegar–chili steam, what not to freeze. |

Rule of thumb: **at most one highlighted tip per step**, and one tip about choosing ingredients for the whole recipe. If you have more, the less important ones become a short side note or get cut.

**Correct the source.** When starting from a chat answer or a blog, verify the method. The beryani source said to brown both sides in the ladle; the real method is a short reheat and inverting the ladle onto bread. Remove what isn't traditional (saffron in beryani) or mark it optional. Strip junk like citation markers and "+1".

## 4. Structure

Same order for every recipe, so readers always know where to look:

1. **Title and quick facts:** dish name (plus a common alternative name), servings (default 4), total time (and soaking or pressure-cooker time), portion size or shelf life.
2. **Ingredients:** a table of ingredient and quantity.
3. **Tools** (only the non-obvious ones), **served with**, and **one choosing tip**.
4. **Steps:** one section per stage (prep, cook, assemble, final heat, serve), each with 2–6 numbered actions, plus an optional highlighted tip and an optional one-line note.
5. **Extra table:** only when it answers a real question (beryani: ladle material).
6. **Common mistakes:** a table of problem (as the cook would say it) and cause plus fix, 4–6 rows, each a real failure of *this* dish.
7. **Storage** (and **variations**): fridge and freezer days, how to reheat or thaw, what not to freeze, 1–3 variations if useful.
8. **Closing line:** regional differences, and that the amounts are a starting point.

## 5. Readability (Persian)

- **Voice:** informal second person, imperative (`بریز`، `تفت بده`، `کنار بگذار`), the same throughout.
- **Short:** one action per sentence, at most two sentences per numbered item.
- **Emphasis:** bold only the key number or cue in a line (`<b>۲ دقیقه</b>`، `<b>کاملاً خشک</b>`), one or two per step. If everything is bold, nothing is.
- **Tables for lookups, lists for actions:** ingredients, mistakes and equipment comparisons go in tables; things you do in order go in numbered lists.
- **Persian digits** (`۱۲۳`), `½` for halves, `٪` for percent.
- **نیم‌فاصله (ZWNJ)** used correctly: `می‌شود`، `سیب‌زمینی`، `چای‌خوری`؛ ezafe after silent h as `ـهٔ`: `مایهٔ`، `قابلمهٔ`.
- **Don't start a numbered step with a digit.** The step number and the text's number run together in RTL (`۳. ۱۰ دقیقه` reads like `۱۰.۳`). Reorder: `روی حرارت متوسط ۲ تا ۳ دقیقه…` instead of `۲ تا ۳ دقیقه روی حرارت…`.
- **Labels for tips:** `نکته:` (useful), `مهم:` (skipping it ruins the dish), `یادت باشد:` (a reminder of why), `احتیاط:` (safety).

## 6. Balance check

A finished recipe usually lands around:

| Part | Typical size |
|------|--------------|
| Ingredients | 8–15 rows |
| Steps | 4–8 stages, 2–6 actions each |
| Highlighted tips | 3–6 in the whole recipe |
| Mistakes table | 4–6 rows |
| Storage and variations | 2–5 lines |

Much shorter usually means missing cues or tips; much longer usually means filler or tips that belong in the mistakes table.

## 7. Checklist

- [ ] Every ingredient has a quantity; meat and seafood say with or without bone or shell.
- [ ] Every cooking action has heat, a time range and a visible "done" cue.
- [ ] Every highlighted tip prevents a real mistake; no sentence is filler.
- [ ] Follow-up questions (substitutes, equipment, stove, heat level) are answered.
- [ ] The method has been checked against the real dish, not copied.
- [ ] Mistakes table has 4–6 real failures of this dish.
- [ ] Storage has days and a reheating or thawing method; safety limits where relevant.
- [ ] Persian digits, correct نیم‌فاصله, no numbered step starting with a digit.
- [ ] `npm run validate:recipes` passes with no errors.
- [ ] Spices and salt that rarely scale linearly have `adjustToTaste: true`, and the recipe sets `scaling: { min, max }` if it was not tested for 2–8 servings.
- [ ] New recipes start from `npm run new-recipe <slug>` (a draft); change `status` to `"published"` only when validation has no errors.
