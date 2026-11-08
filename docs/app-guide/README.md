# App Implementation Guide

A Persian recipe website: some recipes are free and indexable (acquisition), the rest sit behind a subscription (revenue). This guide is the plan a Claude agent (or a developer) works from. Recipe *content* rules live in `docs/recipe-guide/README.md`; this document covers the product, the data model, the architecture and the build order.

**Scope guard:** this guide builds the *infrastructure* for presenting recipes. It does not generate recipes. Content grows later by adding one file per recipe (section 3.4).

**Stack (already in the repo):** Next.js 16.4 App Router, React 19, Tailwind 4, `cacheComponents: true`, `partialPrefetching`. This Next.js version differs from older ones, so before writing code for a feature read the matching page in `node_modules/next/dist/docs/01-app/` (see the reading list in section 12).

**Decisions marked `VERIFY`** depend on facts about Iran (payment gateways, SMS providers, hosting) that were *not* researched here. Section 6 records what the owner decided and what the plan assumes; each integration sits behind an adapter so the answer can change without a rewrite.

---

## 1. Product in one page

| | |
|---|---|
| **Promise** | Recipes that work the first time: exact amounts, heat and time, a visible "done" cue, and the mistakes table. This is what separates us from blogs. |
| **Audience** | Persian-speaking home cooks, mostly on phones, often cooking with wet hands. |
| **Model** | Freemium. Free recipes bring search traffic and prove quality. Premium recipes and cooking tools are the subscription. |
| **Differentiator to protect** | The recipe-guide's rigor. The UI must make that rigor *visible* (cue chips, mistakes table, exact quantities), not hide it in paragraphs. |

**Brand: راز سرآشپز ("Chef's Secret").** Chosen by the owner and kept: it matches the promise that each recipe includes the small details that decide the result (the "why", the cue, the common mistake). Use it as the site name in the header, `<title>` template (`%s | راز سرآشپز`), Open Graph `siteName`, JSON-LD `publisher`, the PWA manifest, and the footer. Tone: confident but friendly, never boastful. A recurring UI motif can be the "راز" (secret) label on the highlighted tips. `VERIFY` before launch: the domain name (a Latin transliteration such as `raze-sarashpaz` is an option; check which `.ir`/`.com` names are free), the Instagram/Telegram handles, and that the name isn't already a registered trademark or a well-known competitor.

**Success metrics (instrument from phase 1):** free recipe organic visits, visitor → signup rate, signup → paid rate, monthly churn, recipes cooked per subscriber (cook-mode starts).

---

## 1a. Primary audience: home cooks, mostly women

The owner expects most users to be women and homemakers who cook daily for a family. These are **hypotheses to validate** (5–10 short interviews or a poll in the first Telegram/Instagram channel before phase 4), but they already shape the plan. Design for *this person's day*, not for a stereotype: no pink-and-flowers styling, no patronizing copy.

| What we assume | What it changes |
|---|---|
| **Cooks daily for others** (family, guests); the question is often "what do I make tonight?" | Search by **ingredients on hand** and by meal ("شام امشب"، "غذای مهمانی"، "سریع زیر ۳۰ دقیقه") moves into the MVP catalog. Add `occasion` (daily, guests, Nowruz, Yalda, Ramadan/نذری) and `kidFriendly` fields to the schema. |
| **Hosts guests and cooks for crowds** | The servings scaler supports large counts (۱۰، ۲۰، ۵۰ for نذری). Add a **prep-ahead / make-ahead** note and freezer guidance per recipe (already in `storage`). |
| **Phone in a busy kitchen, hands wet or floury** | Mobile-first is not enough: cook mode is the flagship feature, so **raise it to the first item of phase 4**, keep its tap targets ≥ 48px, make it work with one hand, keep the screen awake, and let it survive a page reload and a phone call (resume where you left). |
| **Low-end Android, mobile data cost** | Content pages ship almost no JS; images are lazy, modern formats, compressed; recipe pages work after one visit offline. Budget: recipe page < 200 KB of JS. |
| **Lives on Instagram, Telegram, Aparat and local messengers** (Eitaa, Bale, Rubika are options; `VERIFY` which the audience uses) | Every recipe has a **shareable recipe card** (OG image + a one-tap share to Telegram/WhatsApp), a short vertical video later, and a shareable shopping list. Social channels are the acquisition engine next to search. |
| **Buys what the household shares; price-sensitive** | Cheap entry point: a free tier that is genuinely good, a low-priced first plan, an easy **gift subscription** and a **family plan** (moved up in priority, phase 6), plus a seasonal pass (Ramadan, Nowruz, Yalda). Don't assume she holds the card: payment must work with any bank card through the gateway, and the receipt should be easy to forward. Test a single-collection purchase as an alternative to a plan. |
| **Trusts people, not brands; fears wasting ingredients and money** | A mistake is costly, so the recipe guide's exactness is the selling point: show the **"why it works"**, the cue, and the mistakes table prominently; add a "tested by" line and real photos of the finished dish. Money-back wording on the pricing page. |
| **Cooks from tradition, adapts** | Regional variants and family-style notes are valued; ratings and "I cooked it" photos (moderated) come back as a community feature after launch, with the rule that nothing is public by default. |
| **Privacy and safety matter, especially online** | Phone-number login is the only identifier. No public profiles or real names, no showing or sharing phone numbers, no marketing SMS without an explicit opt-in and an easy opt-out, data deletion on request. Make this visible on the signup screen in one line. |

**Copy and tone.** Persian verbs are gender-neutral, and the recipe-guide's informal imperative already works. Keep UI text neutral too: avoid addressing the user as "خانم" or assuming a gender in labels, onboarding questions and ads. The brand voice is a friendly, experienced kitchen helper (راز سرآشپز), not a lecture.

**Content direction the infrastructure should be ready for** (no recipes written here): everyday family dishes, guest and party menus, budget-aware choices, freezer-friendly and make-ahead dishes, children's food, light/diet versions, seasonal and religious occasions. These become `category`, `occasion`, `tags` and collection pages.

**Usage pattern to design for:** peak late afternoon (planning dinner) and weekend/holiday planning. Show "tonight's idea" on the home page, and send the weekly menu message (if opted in) at planning time rather than at night.

---

## 2. Information architecture

| Route | Purpose | Access |
|---|---|---|
| `/` | Hero, featured free recipes, categories, pricing teaser, capture form | public |
| `/recipes` | Catalog with search + filters (category, time, region, free/premium) | public |
| `/recipes/[slug]` | Recipe page | free: full; premium: teaser + gated body |
| `/category/[slug]` | Category landing (SEO) | public |
| `/pricing` | Plans, FAQ, guarantee text | public |
| `/login`, `/verify` | Phone number → OTP | public |
| `/account` | Subscription status (Jalali dates), renew/cancel, devices | auth |
| `/favorites`, `/shopping-list` | Saved recipes, aggregated ingredients | auth (shopping list: premium) |
| `/recipes/[slug]/cook` | Cook mode (section 8.2) | per 9.3 (decided in phase 4) |
| `/payment/callback` | Gateway return URL (server verifies, never trusts the redirect) | public endpoint |
| `/about`, `/terms`, `/privacy`, `/contact` | Required for trust and for gateway approval | public |
| `/admin` (later) | Content validation preview, subscribers | admin |

---

## 3. Content model (typed data, not HTML)

The two HTML files in `docs/recipe-guide/examples/` were written to be read. The website needs *data*, so it can scale servings, build shopping lists, run timers and gate sections. **One recipe = one validated file.**

### 3.1 Where content lives

```
content/
  recipes/
    beryani-isfahani.ts      # export default defineRecipe({...})
    khorak-bandari.ts
lib/
  recipe/
    schema.ts                # Zod schema + inferred types
    load.ts                  # server-only loader, builds index
```

Use `.ts` files (typed, comments allowed, no extra parser) validated by a **Zod** schema at build time. Content stays in git: free versioning, reviewable diffs, and the generator agent only needs to write one file. The database holds *users and money only* (section 5), never recipes. Revisit only if a non-technical editor must publish without a deploy.

### 3.2 Schema (mirrors recipe-guide section 4, field for field)

```ts
type Recipe = {
  slug: string;                    // ascii, kebab-case: "beryani-isfahani"
  access: "free" | "premium";
  status: "draft" | "review" | "published";   // default published; only published recipes are loaded
  title: string;                   // "بریونی اصفهانی"
  altTitle?: string;               // common alternative name
  category: "main" | "stew" | "rice" | "soup" | "sauce" | "appetizer" | "dessert" | "street-food";
  region?: string;                 // "اصفهان"
  tags: string[];
  occasion?: ("daily" | "guests" | "nowruz" | "yalda" | "ramadan" | "nazri")[];
  kidFriendly?: boolean;
  makeAhead?: string;              // what can be prepared a day ahead
  summary: string;                 // 1–2 sentences, plain text. Used for cards, meta description, teaser
  accent: { accent: string; soft: string; line: string };   // per-recipe colors (from the PDF era)
  image?: { src: string; alt: string };

  facts: {                         // §4.1 Title and quick facts
    servings: number;              // default 4; the scaler multiplies from this
    servingsNote?: string;         // "۴ ساندویچ"
    totalMinutes: number | [number, number];   // a range is allowed (beryani: 3–3.5 h)
    approxTime?: boolean;          // renders "حدود ۴۰ دقیقه"
    activeMinutes?: number;
    extraTime?: { label: string; minutes: number }[];      // "با زودپز", "خیساندن"
    portion?: string;              // "هر پرس ۱۲۰ تا ۱۵۰ گرم"
    shelfLife?: string;
    difficulty: 1 | 2 | 3;
  };

  ingredients: {                   // §4.2, optionally grouped ("برای سس")
    group?: string;
    items: Ingredient[];
  }[];

  tools?: string[];                // §4.3 only non-obvious ones
  servedWith?: string[];
  chooseTip?: Tip;                 // the single "choosing ingredients" tip (title: "نسبت چربی" / "انتخاب سوسیس")

  stages: Stage[];                 // §4.4
  extraTable?: { title: string; columns: string[]; rows: string[][]; tip?: Tip };       // §4.5, 2+ columns; the beryani ladle table has a box under it
  mistakes: { problem: string; fix: string }[];             // §4.6, 4–6 rows
  storage: {                       // §4.7
    fridgeDays?: number;
    freezerDays?: number;
    freezable?: boolean;           // metadata for badges and filters; the visible explanation is written in `lines`
    lines: string[];
    variations?: { title: string; text: string }[];   // "مرغ بندری: ..."
  };
  closing: string;                 // §4.8
};

type Ingredient = {
  name: string;                    // "گوشت گردن یا سردست گوسفند"
  amount?: number | [number, number];   // 500, or a range [200, 250]
  approx?: boolean;               // renders "حدود ۶ قاشق غذاخوری"
  toTaste?: boolean;              // no amount; renders "به مقدار لازم". Validator: only salt and pepper
  unit?: "g" | "ml" | "tsp" | "tbsp" | "cup" | "piece" | "clove" | "bunch" | "pinch";
  household?: string;             // "۱ لیوان" - the household measure the guide requires next to grams
  note?: string;                  // "بی‌استخوان (با استخوان حدود ۷۵۰ گرم)"، "سرپر"، "متوسط"، "برای رو"
  optional?: boolean;             // renders "اختیاری"
  scalable?: boolean;             // default true; false for salt-to-taste, oil for frying
};

type Stage = {                    // one section per stage: prep, cook, assemble...
  title: string;                  // "آماده کردن جگر سفید"
  actions: Action[];              // 2–6 items
  tip?: Tip;                      // at most one per stage
  note?: string;                  // optional one-liner
};

type Action = {
  text: string;                   // inline emphasis via **bold** (parsed, never raw HTML)
  heat?: "low" | "medium-low" | "medium" | "high";
  minutes?: number | [number, number];   // drives timers; stays in text too
  cue?: string;                   // "تا طلایی شود" - rendered as a cue chip
  sub?: { label?: string; text: string; minutes?: [number, number] }[];  // e.g. liver / meat / pressure cooker timings
};

type Tip = {
  kind: "نکته" | "مهم" | "یادت باشد" | "احتیاط";   // closed set; the validator counts and checks this
  title?: string;                  // optional topic heading shown instead of the kind: "جلوگیری از چسبیدن"، "نسبت چربی"
  text: string;
};
```

**Why these fields exist:**

- `amount` + `unit` + `household` + `note` instead of free text. Free text like `۵۰۰ گرم بی‌استخوان` cannot be scaled, summed in a shopping list or converted. The *display* string is built from the parts, so the Persian output still matches the guide (`۲۰۰ گرم (۱ لیوان)`).
- `minutes` + `cue` per action. The guide demands both ("time is a guide; the cue decides"). The UI shows the cue prominently and offers the timer.
- `tip` capped at one per stage, and `kind` as a closed set, enforce recipe-guide section 3 in code. `title` exists because the real recipes label boxes by topic (`نسبت چربی:`، `انتخاب سوسیس:`) rather than by the four standard words; the validator checks `kind`, never the visible title.
- `toTaste`, `approx`, `servingsNote`, `freezable` and titled variations were added after dry-running both seed recipes against the schema. Re-run that dry-run whenever the schema changes.

### 3.3 Validation = the recipe-guide checklist, automated

`npm run validate:recipes` (and the build) must fail on:

- a missing field, an unknown tip `kind`, a `slug` that doesn't match the filename;
- `ingredients` empty; an ingredient with neither `amount` nor `toTaste`; `toTaste` on anything but salt/pepper; a meat/seafood item with no `note` containing `استخوان` or `پوست`/`صدف` (the guide's with/without-bone rule): warn, not fail;
- a stage with fewer than 2 or more than 6 actions; more than one tip per stage;
- `mistakes.length` outside 4–6; total highlighted tips outside 3–6 (warn);
- a **numbered action whose text starts with a digit** (Persian or Latin): the RTL bug from recipe-guide section 5. Fail.
- Latin digits anywhere in Persian text; ZWNJ misuse is hard to detect, so only flag the common patterns (`می شود`, `سیب زمینی`).
- the phrases `به مقدار لازم` (except salt/pepper) and `به سلیقه` without a number: fail.

These checks let a generator agent self-correct before a human sees the file.

### 3.4 Authoring workflow ("add a recipe = add one file")

1. The generator agent follows `docs/recipe-guide/README.md` and writes `content/recipes/<slug>.ts`.
2. `npm run validate:recipes` passes.
3. `npm run dev`, open `/recipes/<slug>`, check it visually (and cook-mode on a phone-width window).
4. Commit. The deploy rebuilds the catalog, sitemap and search index.

### 3.5 Tasks that come with this model

- **T-C1.** Convert `examples/beryani-isfahani.html` and `examples/khorak-bandari.html` into `content/recipes/*.ts` as seed data. Set `beryani-isfahani` to `premium` and `khorak-bandari` to `free` as a starting point (section 9.3). Check the rendered text against the HTML sources.
- **T-C2 (done).** **Amend `docs/recipe-guide/README.md`** so the generator outputs this format instead of HTML: replace the "Reference: ...html" paragraph with a pointer to the schema and a seed file, add the schema's field list to section 4, and add "run `validate:recipes`" to the checklist. The principles (sections 1–3, 5) stay unchanged. Keep the HTML examples only as visual reference until the seed files exist, then delete them.
- **T-C3.** Move the Vazirmatn fonts from `docs/recipe-guide/template/fonts/` into `app/fonts/` (section 7). Print styling from `recipe.css` is reused in section 8.8.

---

## 4. Rendering and paywall architecture

This is the part that must be correct. The project uses Cache Components, where **a page is a static shell plus streamed dynamic parts**, and anything that reads cookies must sit inside `<Suspense>` (otherwise the build errors). Reference: `01-app/02-guides/authentication-with-cache-components.md`.

### 4.1 The rule

> **Premium text never reaches a non-subscriber.** Not in the HTML, not in the RSC payload, not in JSON-LD, not in a client component's props. No CSS blur over real text: "inspect element" defeats it.

### 4.2 Page anatomy for `/recipes/[slug]`

```
┌────────────────────────────────────────────────────┐
│ STATIC SHELL (cached, public, indexable)           │
│  title, summary, quick facts, image, breadcrumbs   │
│  ingredient NAMES (no amounts) for premium recipes │  <- teaser
│  stage TITLES only (no actions) for premium        │  <- teaser
│  Recipe JSON-LD (teaser-safe subset)               │
├────────────────────────────────────────────────────┤
│ <Suspense fallback={<BodySkeleton/>}>              │
│   <RecipeBody slug />   <- reads session           │
│     free recipe        -> full body                │
│     premium + subscriber -> full body              │
│     premium + other    -> <Paywall/> (CTA only)    │
│ </Suspense>                                        │
└────────────────────────────────────────────────────┘
```

- The shell uses `'use cache'` with `cacheTag('recipe:'+slug)`. It is generated from the *public projection* of the recipe, a function `toPublic(recipe)` that physically deletes premium fields. Tests assert that `JSON.stringify(toPublic(premiumRecipe))` contains none of the action texts.
- `RecipeBody` is a server component that calls `getAccess()` (below), then either loads the full recipe or returns `<Paywall>`. Because it reads cookies it must live inside `<Suspense>`.
- Free recipes can render the **full body in the static shell** (no session read needed). Only premium recipes pay the dynamic cost. This keeps the SEO pages as fast as static HTML.
- Mark the route's body component, not the page, as the dynamic island, so the shell still prerenders and prefetches (`partialPrefetching`).

### 4.3 Session and subscription check

A Data Access Layer (`lib/dal.ts`, `import 'server-only'`) is the *only* place that decides access:

```ts
export async function getAccess(): Promise<"anonymous" | "free" | "subscriber">;
export async function canRead(recipe: { access: "free" | "premium" }): Promise<boolean>;
```

- Read the cookie, validate the session, look up the user and **active subscription** (`status = active AND currentPeriodEnd > now()`). `use cache: private` may wrap the session read (per the Next.js guide). Never cache an access *decision* in a shared (`'use cache'`) function, since one user's result would be served to others. Extract the `userId` and pass it as an argument if you cache derived data.
- Authorization happens in the DAL, called from `RecipeBody` and from every server action and route handler. `proxy.ts` is **not** authorization.
- `proxy.ts` (Next 16's replacement for middleware) is used only for an *optimistic* redirect, e.g. send an unauthenticated visitor from `/account` to `/login` by checking cookie presence. It must not do DB calls or decide premium access (the Next.js docs say so explicitly).
- Cook mode and the shopping list receive premium data only after `canRead()` on the server; client components get only what the user is entitled to.

### 4.4 SEO for premium pages

Premium pages must stay indexable (they are the second acquisition channel), but we do not ship the body to crawlers either. Plan:

- Teaser content (title, summary, facts, ingredient names, stage titles, the mistakes *count*) is real, server-rendered HTML.
- Recipe JSON-LD on premium pages includes `name`, `description`, `image`, times, `recipeYield`, `recipeIngredient` **names only**, `recipeCategory`, `keywords`, and **omits `recipeInstructions`**.
- Add Google's paywalled-content structured data (`isAccessibleForFree: false` with `hasPart` + `cssSelector`). `VERIFY` current guidelines: Google's paywalled-content docs are written around "flexible sampling" where the crawler sees the content. Because our rule is to never serve the body, check whether the teaser-only approach is acceptable and whether the markup should be applied or left off. Do not serve the body to crawlers by user-agent; that is cloaking-adjacent and breaks the rule in 4.1.
- Free recipes carry complete Recipe JSON-LD, including `recipeInstructions` as `HowToStep`. Use the JSON-LD pattern in `01-app/02-guides/json-ld.md`, including the `<` → `<` escaping.

---

## 5. Data (users and money only)

`VERIFY` database host. The Neon MCP server is configured in this workspace (needs authorization), and Postgres fits. Use Drizzle or Prisma; pick one and stay with it.

```
users            id, phone (unique, E.164), name?, createdAt, role (user|admin)
otp_requests     id, phone, codeHash, expiresAt, attempts, ip, createdAt     -- hashed, 2-minute TTL, attempt cap
sessions         id, userId, tokenHash, expiresAt, userAgent, createdAt     -- or stateless iron-session cookie
plans            id, key (monthly|quarterly|yearly), priceIRR, durationDays, active
subscriptions    id, userId, planId, status, currentPeriodStart, currentPeriodEnd, source
payments         id, userId, planId, provider, amountIRR, status, authority, refId, createdAt, verifiedAt
favorites        userId, recipeSlug, createdAt   (PK userId+recipeSlug)
cooked_log       userId, recipeSlug, at          -- also powers "recently cooked" and metrics
leads            id, contact, source, createdAt  -- newsletter / Telegram capture
```

Rules:

- **Store money in Rial integers** (`priceIRR`). Display toman where users expect it, in one formatting helper. Decide and document which unit the UI shows (`VERIFY` gateway unit: some APIs take Rial, some Toman).
- A subscription is **prepaid time**, not auto-renew, in v1: simpler, avoids recurring-payment gateway problems, and matches how most Iranian users pay. Renewal = buy again; the new period starts at `max(now, currentPeriodEnd)`.
- A payment becomes a subscription only after **server-side verification** with the gateway, idempotent on `authority`. Never grant access from the browser redirect alone.
- Dates are stored in UTC and shown in Jalali (section 7).

---

## 6. Iran-specific integrations (adapters) and owner decisions

Build the interfaces below; providers plug in behind them. Provider-specific facts (endpoints, fees, templates) are **not** in this guide. The agent reads the chosen provider's current docs at integration time.

```ts
interface PaymentProvider {
  startPayment(input: { amountIRR: number; orderId: string; callbackUrl: string; mobile?: string }):
    Promise<{ redirectUrl: string; authority: string }>;
  verifyPayment(input: { authority: string; amountIRR: number }):
    Promise<{ ok: boolean; refId?: string; raw: unknown }>;
}
interface SmsProvider {
  // Returns the code only for the dev "inline" provider; real providers return void.
  sendOtp(phone: string, code: string): Promise<{ devCode?: string } | void>;
}
```

Implementations live in `lib/payments/<name>.ts` and `lib/sms/<name>.ts`; the active one is chosen by env vars (`PAYMENT_PROVIDER`, `SMS_PROVIDER`).

### 6.1 Decisions made

| Topic | Decision |
|---|---|
| **Payment gateway** | One easy-to-integrate Iranian gateway with a low commission. The choice is made at the start of phase 3 using the checklist in 6.2. Until then the `fake` payment provider is used. |
| **e-Namad (اینماد)** | **Out of scope for now.** Deferred to a pre-public-launch checklist (6.4). Do not build around it, but keep the pages it will need (About, Contact, Terms, Privacy, Refund) since they are needed anyway. |
| **SMS / OTP** | The adapter exists from phase 2. Until a real provider is integrated, the **dev "inline" provider returns the OTP in the endpoint response** and the UI shows it (see 6.3 for the safety rules). |

### 6.2 Gateway choice checklist (phase 3, pick the first that passes)

Candidates to evaluate: Zarinpal, IDPay, NextPay, Pay.ir (names only, not endorsements). Choose by: (1) can we onboard without paperwork we lack today, (2) commission and settlement time, (3) a plain REST API with a *verify* step, (4) a sandbox for testing, (5) clear Rial/Toman unit, (6) callback works from our host. Whichever is chosen, only `lib/payments/<name>.ts` changes.

### 6.3 Inline OTP for testing: rules (it is an account-takeover hole if misused)

Returning the OTP to the browser means anyone can log in as any phone number. That is acceptable only while there are no real users, money or private data. Therefore:

- Active only when `SMS_PROVIDER=inline`. The response includes `devCode` and the UI shows it in a clearly labelled dev banner ("حالت آزمایشی: کد ورود: ۱۲۳۴۵۶").
- The server **refuses to start (or to take payments) in production** if `SMS_PROVIDER=inline` and `PAYMENT_PROVIDER` is not `fake`. A test asserts this guard.
- The code is still generated, hashed, expired (2 minutes) and attempt-limited exactly as for real SMS, so swapping in a real provider changes one file and no flow.
- Real provider required before: any real payment, any public launch, or any account holding data worth protecting.

### 6.4 Pre-public-launch checklist (not now)

Real SMS provider (template approval, sender line); e-Namad if the gateway or audience trust requires it; hosting decision (below); legal pages reviewed; domain and handles secured (section 1).

### 6.5 Decisions made by the plan (owner may override)

| # | Topic | Decision | Reason |
|---|---|---|---|
| 4 | **Hosting** | Develop on anything. Before phase 3, decide between an **Iranian VPS/cloud running `next start` in Docker** and Vercel. Default recommendation: Iranian host, because gateway callbacks and user latency are the risks. Keep the app host-agnostic (no Vercel-only APIs, env-driven config). `VERIFY` once with a test callback from the gateway sandbox. | Gateway callbacks must reach the server; latency affects the mobile audience. |
| 5 | **Analytics** | No third-party scripts. Phase 1: a small first-party `events` table (page view, paywall hit, signup, payment start/success, cook-mode start) written server-side, plus a tiny admin summary in phase 5. Optional later: self-hosted Umami. Self-host fonts. | Avoids blocked/slow scripts, keeps user data in-house, and the funnel numbers in section 1 need no extra tool. |
| 6 | **Legal pages** | The agent drafts plain-Persian **Terms, Privacy, Refund** pages from a template in phase 3, covering: what is sold (prepaid access, no auto-renewal), what data is stored (phone, favorites, payments), refund window, contact. They are drafts: not legal advice, review by a person before real money flows. Keep the refund policy simple and generous (it also lifts conversion). | Needed for trust and for gateway/e-Namad later. |
| 7 | **Audience channel** | **Telegram channel (retention) + Instagram (discovery)**, with a mirror on Eitaa/Bale later if the audience uses them. The capture form on the site asks for the **phone number with an explicit opt-in** or links to the Telegram channel, rather than email: this audience rarely uses email, and we already have phone login. Validate with a 1-question poll in the first channel. | Matches section 1a. Cheap to start; the poll corrects the guess. |

### 6.6 Security baseline (always)

OTP codes hashed and rate-limited per phone and per IP; session cookies `httpOnly`, `secure`, `sameSite=lax`; secrets only in env vars; payment verification idempotent and server-side.

---

## 7. Persian / RTL UI foundations

- **Root layout:** `<html lang="fa" dir="rtl">`. Replace Geist in `app/layout.tsx`; update metadata (`title`, `description`, `openGraph.locale: "fa_IR"`).
- **Fonts:** Vazirmatn through `next/font/local` (`01-app/03-api-reference/02-components/font.md`), from files moved into `app/fonts/` (T-C3). Declare weights 400/500/700/800; the existing TTFs are static. Converting them to WOFF2 (or using the variable font) will cut size a lot; do it in phase 1. Set a Tahoma fallback.
- **Digits:** content is authored with Persian digits already, but computed values (scaled amounts, timers, prices, counts) go through one helper `fa(n)` (`Intl.NumberFormat("fa-IR")`). Never print a raw number in JSX. Fractions use `½ ¼ ¾` (`formatAmount(1.5) → "۱½"`, matching the guide).
- **Dates:** subscription dates in Jalali via `Intl.DateTimeFormat("fa-IR-u-ca-persian")`, wrapped in `formatJalali(date)`. No date library is needed for display.
- **Lists:** `list-style-type: persian` for numbered actions (as in `recipe.css`). Keep the guide's rule: an action never *begins* with a digit; the validator enforces this at authoring time, and the renderer must not add a visual number that collides with the text (use the circled badge from the PDF era for stage numbers).
- **Logical CSS only:** `margin-inline-start`, `padding-inline-end`, `text-align: start`, Tailwind's `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`. Never `ml-`, `mr-`, `left-`, `right-`. Flip directional icons (chevrons, arrows) explicitly.
- **Typography:** line-height 1.85 for body (as in `recipe.css`), body size ≥ 16px on mobile, bold sparingly (the guide's rule: one or two per step).
- **Inputs:** phone fields use `inputMode="numeric"`, `dir="ltr"`, and accept Persian/Arabic digits (normalize to Latin on submit). Strip ZWNJ when matching search queries; normalize `ي/ك` to `ی/ک` in search indexing.
- **Theming:** per-recipe `accent/soft/line` are applied as CSS variables on the recipe container only; the site chrome has its own palette. Provide light and dark; verify contrast of every recipe accent (≥ 4.5:1 for text) in the validator.

**Design direction:** warm, calm, kitchen-paper feel; large photography when available; cards with the title, time, difficulty dots and a lock icon for premium. Read the project's design skills/tools before building the UI; ask the owner for a Figma file if one exists.

---

## 8. Features (phased; what justifies paying)

### 8.1 Core (MVP, free for everyone)

Catalog, recipe page, search + filters, print view for free recipes, SEO pages.

### 8.2 Cook mode (premium hook, phase 4)

One stage at a time, large type, big "next/back" targets, ingredients for the current stage only, screen stays on via the **Screen Wake Lock API** (feature-detect, re-acquire on `visibilitychange`), swipe/keyboard navigation (RTL: next is a swipe *left*; test it), step timers from `minutes`, a cue chip ("تا طلایی شود") displayed larger than the time. Works offline once loaded (section 8.7).

### 8.3 Servings scaler (phase 4)

Controls: ۲ / ۴ / ۶ / ۸ / custom. Multiplies `amount` where `scalable !== false`; ranges scale both ends. Rounds sensibly (grams to 5, spoons to ¼, pieces to ½), recomputes the household measure only when present as a number-able string, otherwise hides it with a "approximate" flag. Cooking *time* does not scale linearly: show a small warning on doubling and above ("زمان پخت با دو برابر کردن مواد دو برابر نمی‌شود، با نشانه‌ها جلو برو").

### 8.4 Ingredient checklist and shopping list

Checkable ingredients on the recipe page (local state, per recipe). The shopping list (premium) merges ingredients across saved recipes by normalized `name` and compatible `unit`, groups by aisle (`گوشت`، `سبزی`، `لبنیات`، ...), and is shareable as text (Telegram/WhatsApp). Needs an `aisle` field on `Ingredient`; add it in phase 4.

### 8.5 Favorites and history

Heart button (auth required; private by default), `/favorites`, "recently cooked" from `cooked_log`.

### 8.6 Search and filters

Build a static search index at build time (title, altTitle, tags, ingredient names, normalized Persian). **Search by ingredients on hand** ("چی تو یخچال دارم؟": pick 2–5 ingredients, rank recipes by overlap) is a core feature for this audience, so it ships with the catalog in phase 1, not later. Client-side search (Fuse.js or MiniSearch) is enough for hundreds of recipes. Filters: category, occasion, total time buckets, region, difficulty, kid-friendly, free/premium. The index must contain **only teaser-safe fields**.

### 8.7 PWA / offline

Web manifest, icons, and a service worker caching visited recipes the user is entitled to. Add after cook mode is stable. Most home cooks use phones, so "installable" is a real retention feature.

### 8.8 Print view

The brand started as PDFs: keep a `print` stylesheet derived from `recipe.css` (A4, Vazirmatn). Free recipes: print for everyone. Premium: print for subscribers only, and rendered from the same gated server component, never a separate public URL.

### 8.9 Later ideas (not committed)

Ratings and "I cooked it" photos, meal planner, weekly menu email, ingredient substitution lookup, video snippets, gift subscriptions, family plan.

---

## 9. Monetization and growth

### 9.1 Funnel

```
Search / social  ->  free recipe (full value, Recipe JSON-LD)
   ->  "more like this" cards (premium ones show a lock + teaser)
   ->  premium teaser page (ingredient names, stage titles, what's inside)
   ->  signup (OTP)  ->  pricing  ->  gateway  ->  subscriber
```

Every free recipe ends with a soft block: "next recipes" (one free, two premium) and the capture form (Telegram or email) for visitors not ready to sign up.

### 9.2 Plans (starting hypothesis, tune with data)

| Plan | Duration | Note |
|---|---|---|
| Monthly | 30 days | Low barrier, highest per-month price |
| Quarterly | 90 days | Middle option, shown as "most popular" |
| Yearly | 365 days | Best value; show the per-month equivalent |

Do not invent prices here. Set `priceIRR` in the DB after the owner checks the local market (cookbook PDFs, other recipe sites). Consider: a first-week discount code, a clear refund policy, and a visible "cancel anytime" statement (prepaid, nothing renews automatically).

### 9.3 What is free vs premium

- **Free (≈30–40%):** simple, popular, search-friendly dishes with high demand. They prove the quality and rank in search. Example: `khorak-bandari`.
- **Premium:** signature and harder dishes where the guide's extras (equipment tables, mistakes table, variations) have the most value. Example: `beryani-isfahani`.
- **Tools:** cook mode, scaler and shopping list are premium or "free on free recipes, premium on premium recipes" (decide in phase 4 by testing conversion).
- Keep at least one **free, complete, flawless showcase recipe** on the home page. Hiding quality kills trust.

### 9.4 SEO checklist

- Server-rendered titles and meta descriptions in Persian, canonical URLs, `sitemap.xml` and `robots.txt` generated from the recipe index (premium included).
- Recipe JSON-LD (section 4.4), breadcrumb JSON-LD, Open Graph images generated per recipe (`01-app/01-getting-started/14-metadata-and-og-images.md`).
- Clean slugs: ASCII, short, stable. Never change a published slug without a redirect.
- Category and region landing pages with unique intro text.
- Core Web Vitals on mid-range Android phones: images via `next/image`, a small font payload, little client JS on content pages.

### 9.5 Trust

Contact details, an About page explaining who tests the recipes and why they are exact, the trust seal (once obtained), a visible refund policy, and no dark patterns.

---

## 10. Phased roadmap with acceptance criteria

Each phase ships on its own and ends with `npm run lint` and `npm run build` passing.

### Phase 0: Foundation (½–1 day)

- Persian root layout, fonts, tokens, base components (button, card, tip box, table), `fa()` / `formatAmount()` / `formatJalali()` helpers, folder structure.
- **Done when:** `/` renders RTL Persian with Vazirmatn, helpers have unit tests, Geist and "Create Next App" metadata are gone.

### Phase 1: Catalog and recipe page (the core)

- Schema, validator, seed recipes (T-C1), `toPublic()`, `/recipes`, `/recipes/[slug]`, category pages, free/premium flag with a **temporary hard-coded "anonymous" access** (premium always shows the paywall).
- Recipe page renders every schema section: facts, ingredients table, stages with cue chips and tips, extra table, mistakes table, storage, closing.
- SEO: metadata, JSON-LD, sitemap, robots, OG images.
- **Done when:**
  - `validate:recipes` passes for both seeds and **fails** for a deliberately broken fixture (each rule in 3.3 has a test).
  - Free recipe page shows the full body. Premium page shows the teaser; `curl` of the HTML and the RSC payload contains **no** premium action text (automated test).
  - The page looks right at 360px and desktop; Lighthouse mobile performance ≥ 90 and accessibility ≥ 95 on a free recipe.
  - T-C2 is done (recipe-guide now generates the data format).

### Phase 2: Authentication

- Phone → OTP flow behind `SmsProvider` (with the `inline` dev provider from 6.3 until a real SMS provider is integrated), sessions, DAL (`getAccess`, `canRead`), `/login`, `/verify`, `/account` skeleton, `proxy.ts` for the optimistic redirect only.
- **Done when:** a user can sign up and log out; OTP is hashed, expires in 2 minutes, is attempt-limited and rate-limited; `/account` redirects when logged out; a logged-in non-subscriber still sees the paywall. With `SMS_PROVIDER=inline` the code appears in a dev banner, and the production guard from 6.3 is tested.

### Phase 3: Payments and subscriptions

- DB tables for plans/payments/subscriptions, `/pricing`, `PaymentProvider` (`fake` first, then the chosen gateway), callback verification, idempotency, `/account` with Jalali start/end dates, expiry handling, receipt/refund notes.
- Prerequisite: gateway picked using 6.2, and the hosting decision in 6.5 made (callbacks must reach the server). e-Namad is not required for this phase.
- **Done when:** with the fake provider, paying creates an active subscription and unlocks premium; a replayed callback doesn't extend twice; an expired subscription re-locks; with the real gateway, one real small payment succeeds end to end in production.

### Phase 4: Features that justify the subscription

Order by expected value for a busy home cook: **cook mode (with resume) → servings scaler (including large-crowd counts) → checkable ingredients → favorites → shopping list (shareable) → print view → PWA/offline.** (Ingredient and occasion search already shipped in phase 1.)

- **Done when**, per feature: it works at 360px with touch; RTL gestures are correct; gated by `canRead()` on the server; usage is tracked; no premium data in client bundles for non-subscribers.

### Phase 5: Content workflow and admin

- `npm run new-recipe <slug>` scaffolds a valid skeleton; CI runs `validate:recipes`, lint and build on every PR; a preview URL per PR; a content-status field (`draft | review | published`) so drafts aren't published or indexed; a small admin page for subscribers and revenue, and recipe analytics (views, cook starts, paywall hits, conversions).
- **Done when:** adding a recipe is one file plus a passing validation, with no code change; an unpublished draft is absent from the catalog, sitemap and search index.

### Phase 6: Growth

Capture form + Telegram/email automation, **gift subscriptions and family plan** (consider earlier if interviews show household buying), referral codes, shareable recipe cards and video snippets, seasonal collections (Ramadan, Nowruz, Yalda), A/B tests on paywall copy and pricing.

---

## 11. Testing and quality

- **Unit:** schema/validator rules, `formatAmount`, scaler rounding, Jalali formatting, `toPublic()`.
- **Security regression (must stay green forever):** a test that requests every premium page as anonymous and as non-subscriber and asserts that no string from the premium projection appears in the HTML or RSC response. Run it in CI.
- **E2E (Playwright):** anonymous → teaser; login → still teaser; fake payment → full body; expiry → teaser again; cook mode flow on a mobile viewport.
- **Accessibility:** keyboard navigation, focus states, contrast, `aria-label` in Persian, `prefers-reduced-motion` respected.
- **Manual:** open every seed recipe next to its source and compare quantities.

---

## 12. Working rules for the agent

1. Before using a Next.js API, read its page in `node_modules/next/dist/docs/01-app/`. Most relevant here: `01-getting-started/08-caching.md`, `02-guides/authentication.md`, `02-guides/authentication-with-cache-components.md`, `02-guides/data-security.md`, `01-getting-started/16-proxy.md`, `03-api-reference/02-components/font.md`, `02-guides/json-ld.md`, `01-getting-started/14-metadata-and-og-images.md`, `03-api-reference/01-directives/use-cache-private.md`.
2. Premium data flows only through the DAL. If code outside `lib/dal.ts` and `RecipeBody` imports the full recipe type for rendering, it's a bug.
3. Never add a provider-specific detail (gateway endpoints, SMS templates) from memory; ask the owner or read the provider's current docs.
4. Do not generate or edit recipe content unless asked; that is a separate workflow under `docs/recipe-guide/`.
5. Persian text, digits and ZWNJ follow the recipe-guide's section 5 everywhere in the UI, not only in recipes.
6. Keep phases small; each ends with lint + build green and a short note of what was verified.
7. When something here is marked `VERIFY`, list it for the owner at the end of the phase instead of guessing.

---

## 13. Implementation status (kept current)

**Done: phases 0–1 except T-C2 (recipe-guide still emits HTML) and a production Lighthouse performance run (dev-mode accessibility 100, SEO 100 measured on a free recipe); plus the auth seam:** Persian RTL layout with Vazirmatn (`app/fonts/`), design tokens (light/dark), home, `/recipes` (client search incl. ingredient-on-hand, filters), `/category/[slug]`, `/recipes/[slug]`, `/pricing` and `/login` placeholders, sitemap, robots, JSON-LD, print styles. Content: Zod schema, rules validator (`npm run validate:recipes`, also run by `prebuild`), generated index (`npm run recipes:index`), both seeds converted (T-C1, T-C3). Paywall: `toPublic()` projections, `lib/dal.ts` reading cookies inside a Suspense island; free recipes are fully static, premium recipes are partial-prerender (teaser shell, viewer-specific body). Tests: `npm test` (format, rules, projections) and `npm run check:leaks` (scans client chunks and prerendered output, and live responses when `BASE_URL` is set).

**Database:** local PostgreSQL configured through `.env` (`DATABASE_*`; never committed). Plain SQL migrations in `db/migrations`, applied with `npm run db:migrate`. Repositories are per use case in `lib/db/*` so the host can change without touching callers.

**Auth (phase 2, done):** phone + OTP via the `SmsProvider` adapter; only the dev `inline` provider exists (shows the code in a labelled banner). Codes are HMAC-hashed, expire in 2 minutes, are single use, attempt-limited (5) and rate-limited per phone and per IP. Sessions are random tokens stored as SHA-256 hashes in an `httpOnly` cookie. `lib/dal.ts` resolves cookie -> user -> active subscription per request (React `cache`, never a shared cache) and fails closed. `proxy.ts` only redirects when the cookie is absent. `instrumentation.ts` refuses to start in production with unsafe settings (`lib/guard.ts`, unit-tested); set `ALLOW_INSECURE_LOCAL=1` to run `next start` locally.

**Billing (phase 3, done with the fake gateway):** plans in `lib/billing/plans.ts` (TEST prices, owner must set real ones), prepaid time that queues renewals back to back, `PaymentProvider` adapter with only the `fake` provider (no real gateway will be connected in this project; a real one is one new file). Checkout and callback are idempotent on the payment `authority` (row lock + unique `payment_id`); failed payments are terminal; expiry is enforced by the query. In production `PAYMENT_PROVIDER=fake` additionally needs `ALLOW_FAKE_PAYMENTS=1`.

**Features (phase 4, done):** servings scaler (pure rules in `lib/recipe/scale.ts`; steps keep authored amounts and show the multiplier; no invented taste curves, only a "taste and adjust" hint), checkable ingredients (per device), favorites and "recently cooked", cook mode (`/recipes/[slug]/cook`: one stage at a time, wake lock, RTL swipe/keys, timers, resume), subscriber-only shopping list (merged by name+unit, shareable text), web manifest and icon. Not done: service worker/offline caching, ingredient `aisle` grouping, print polish for the scaler.

**Pages and policy:** About, Terms, Privacy and Refund exist as clearly labelled DRAFTS (no contact details were invented; the owner must add them and have a person review before real money flows). No Contact page yet for the same reason.

**Owner VERIFY list:** real prices (current ones are test values), refund window (7 days is a proposal), contact details, domain and handles, hosting, Google paywalled-content markup, per-recipe `adjustToTaste` and `scaling` ranges, who reviews the legal drafts. A real SMS provider and payment gateway are intentionally NOT part of this project; both sit behind adapters (`lib/sms`, `lib/payments`).

**Not built:** admin summary page, per-recipe share images, A/B tests, referral and gift plans (phase 5-6 items).
