# CoreHUB — Project Guide for AI Agents

> **Read this first.** This document is the single source of truth for what CoreHUB
> is, what it deliberately is _not_, and how it works. It exists so that any AI agent
> (or developer) arriving later can understand the project precisely and continue it
> without re-discovering decisions.

---

## 1. Purpose

CoreHUB is a **fully automated, self-updating news aggregation website**. It pulls news
from trusted RSS sources, rewrites/summarizes each item with an LLM into a **neutral,
unbiased** Turkish summary, attaches a royalty-free image, and publishes it — with **no
human in the loop**. A scheduled job keeps the site fresh on its own.

Content categories (defined in `lib/types.ts`): **Gündem, Dünya, Ekonomi & Finans,
Teknoloji, Yapay Zeka, Spor, Bilim, Sağlık, Otomobil**. The category of each article is
chosen by the **LLM based on the article's content**, NOT by which feed it came from
(a finance item appearing in a tech feed is classified as `ekonomi`). The feed's own
category is passed only as a hint/fallback.

## 2. Goals

- 100% automated pipeline: fetch → write → image → publish, triggered by cron.
- **Original AI authorship (since 2026-06-30):** the LLM uses the source item as a
  _starting point_ and writes an original, detailed Turkish article/guide, elaborating
  the topic with its own knowledge (relevant brands, pros/cons, what to watch for,
  practical advice). Tone must stay **objective and balanced** (no brand favoritism, no
  hype). **Anti-hallucination guardrail:** the model must NOT invent specific numbers,
  prices, dates, statistics, or quotes it is unsure of — it stays general when unsure.
  _(This replaced the earlier "summarize source facts only" rule — see Changelog.)_
- Always link back to the original source on every article (source = inspiration, not
  content we copy).
- Run at near-zero cost initially (free LLM tier, free hosting, free image API).
- Be model-agnostic: swapping the LLM provider must be a one-line change.

## 3. Non-Goals (deliberately NOT doing this)

- **No magazine/gossip content.** Only the four categories above.
- **No human editing.** The system must work unattended.
- **No republishing of full copyrighted text.** We summarize and link; we never copy
  the original article body verbatim.
- **No copyrighted images.** We never scrape/hotlink images from source sites or Google
  Images. Images come only from royalty-free sources (Unsplash). See §8.
- Not tied to one political/editorial stance — neutrality is the core product.

## 4. Architecture & Data Flow

```
[RSS sources + Google Trends]  →  scripts/ingest.ts (cron-triggered)
                     │
                     ├─ collect candidates from ALL feeds (dedupe by URL hash)
                     ├─ CLUSTER same-event items across sources (lib/sources/cluster.ts)
                     ├─ per cluster: LLM synthesize → compares sources, writes one
                     │     balanced article + category + divergenceNote (if they conflict)
                     ├─ fetch image    → Unsplash (royalty-free)
                     └─ write to data/articles.json (cap: MAX_ARTICLES_PER_RUN)
                     ↓
[Next.js App Router] reads data/articles.json and renders pages (ISR, revalidate=300)
```

The website is **read-only** at request time; all generation happens in the ingest
script. Pages use ISR (`revalidate = 300`) so they refresh periodically.

## 5. Directory & File Map

| Path | Responsibility |
|------|----------------|
| `lib/types.ts` | Core types: `Article`, `Category` (derived from `CATEGORIES`), `CATEGORIES` list, `isCategory()` guard. **Add categories here.** |
| `lib/sources/feeds.ts` | RSS `FEEDS` list (reliable Turkish sources: NTV, AA, Google News, tech sites) + `googleNewsSearchFeed(query)` helper. **Add sources here.** `category` is now only a hint/fallback. |
| `lib/sources/trends.ts` | `fetchTrendingTopics()` — Google Trends TR RSS → trending topic titles. Used to build dynamic "Gündem" Google News feeds in ingest. |
| `lib/ai/types.ts` | `AIProvider` contract (`synthesize`) + `SynthesizeInput{items[]}`/`SynthesizeOutput` (incl. `divergenceNote`). |
| `lib/sources/cluster.ts` | `clusterItems()` — groups same-event articles by title-token similarity (Jaccard). Free heuristic. |
| `lib/ai/index.ts` | `getAIProvider()` — selects provider via `AI_PROVIDER` env. **Add new providers here.** |
| `lib/ai/groq.ts` | Groq provider (currently active). OpenAI-compatible, free tier. |
| `lib/ai/gemini.ts` | Gemini provider (kept for fallback; free tier is 0 in Turkey). |
| `lib/images/unsplash.ts` | `fetchImage(query)` — royalty-free image + attribution. Returns null if no key. |
| `lib/store.ts` | JSON persistence: `loadArticles`, `saveArticles`, `getByCategory`, `getById`. |
| `scripts/ingest.ts` | The automation entry point. Run via `npm run ingest`. Cron calls this. |
| `data/articles.json` | The content store (generated; gitignored unless committed for deploy). |
| `app/layout.tsx` | Global shell: gradient background, decorative blurs, delegates header to `SiteHeader`. |
| `components/SiteHeader.tsx` | Sticky glass header (`GlassCard` + `GlassButton` nav) with logo, date, theme toggle. |
| `components/ThemeToggle.tsx` | `GlassSwitch`-based light/dark toggle; persists in `localStorage`. |
| `components/ui/glass-*.tsx` | [Ein UI](https://ui.eindev.ir/) liquid-glass components (installed via Shadcn CLI `@einui/*` registry). |
| `components.json` | Shadcn/Ein UI config; `@einui` registry points to `https://ui.eindev.ir/r/{name}.json`. |
| `lib/utils.ts` | Shadcn `cn()` helper (clsx + tailwind-merge). |
| `app/page.tsx` | Home page — latest articles grid + category links. |
| `app/[category]/page.tsx` | Category listing page. |
| `app/haber/[id]/page.tsx` | Article detail page: image + long body + source link. |
| `lib/ranking/popular.ts` | `getPopularArticles()` — scores articles for homepage hero (Google Trends match, category, multi-source, recency). |
| `components/PopularHero.tsx` | Client carousel: top 10 popular articles ("Gündemi Meşgul Eden"), autoplay + thumbnail strip. |

### Where components are used
- `PopularHero` → rendered by `app/page.tsx` (top 10 scored articles).
- `ArticleCard` → uses `GlassCard` + `GlassBadge`; rendered by home & category pages.
- `ThemeToggle` → rendered by `components/SiteHeader.tsx`.
- `SiteHeader` → rendered by `app/layout.tsx`.
- Ein UI glass components → used across header, cards, article detail, empty states.
- `CATEGORIES` (from `lib/types.ts`) → used by `components/SiteHeader.tsx` (nav), `app/page.tsx`,
  `app/[category]/page.tsx`, `components/ArticleCard.tsx`, `app/haber/[id]/page.tsx`.

## 6. AI Provider Abstraction

The rest of the system never knows which model is used. To **switch** providers, set
`AI_PROVIDER` in `.env.local` (`groq` | `gemini` | `claude`*). To **add** a provider:

1. Create `lib/ai/<name>.ts` exporting `create<Name>Provider(): AIProvider`.
2. Implement `synthesize(input)` returning `{ title, category, summary, body, imageQuery, divergenceNote? }`.
3. Register it in the `switch` in `lib/ai/index.ts`.

\* `claude` is planned for when the site earns revenue (best Turkish quality). Stub is
commented in `lib/ai/index.ts`.

## 7. Adding News Sources

Add one line to the `FEEDS` array in `lib/sources/feeds.ts`:
```ts
{ name: "SourceName", url: "https://.../feed", category: "teknoloji" }
```
Categories: `teknoloji | yapay-zeka | turkiye | spor`. The ingest script picks it up
automatically on the next run. `MAX_PER_FEED` in `ingest.ts` caps items per feed.

## 8. Image Handling

**Primary:** source images from RSS (`enclosure`, `media:*`, inline `<img>`) or the
article page (`og:image` / `twitter:image`). Credit = source name; link = original
article URL. Implemented in `lib/images/source.ts`; ingest tries source first.

**Fallback:** Unsplash when no source image is found (`lib/images/unsplash.ts`).
LLM `imageQuery` is only used for this fallback. Unsplash credit shown as
`… / Unsplash` on the detail page.

UI uses `components/ArticleImage.tsx` (`<img>`) so arbitrary news CDN hostnames
work without expanding `next.config` `remotePatterns`.

**Note:** hotlinking source images carries copyright/hotlink-break risk — accepted
for now; revisit if needed.

## 9. Environment Variables (`.env.local`, gitignored)

| Var | Purpose |
|-----|---------|
| `AI_PROVIDER` | Active provider: `groq` (default) / `gemini` / `claude`. |
| `GROQ_API_KEY`, `GROQ_MODEL` | Groq credentials (free). |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Gemini credentials (free tier 0 in TR — needs billing). |
| `UNSPLASH_ACCESS_KEY` | Unsplash image API (free). |

## 10. Running Locally

```bash
npm install
npm run ingest   # fetch + summarize + image → data/articles.json
npm run dev      # start the site at http://localhost:3000
```

## 11. Known Limitations / TODO

- **Storage:** `data/articles.json` works locally but Vercel serverless cannot write
  files at runtime. Before production, migrate `lib/store.ts` to a DB (Turso / Vercel
  Postgres / Supabase). Keep the same function signatures.
- **Cron:** not wired yet. Plan: Vercel Cron or GitHub Actions calling the ingest logic
  on a schedule (e.g. every 30–60 min).
- **Categories:** only `teknoloji` currently has live feeds; add feeds for `yapay-zeka`,
  `turkiye`, `spor` in `lib/sources/feeds.ts`.
- **Old records:** changing `Article` shape requires re-ingesting (delete
  `data/articles.json` and re-run) since dedupe skips already-seen URLs.

---

## 12. MAINTENANCE RULE — keep this file alive

**Any time you add a feature or make a change that affects how the system works, you
MUST update this document in the same change.** This includes: new providers, new
sources, schema/type changes, new pages or components, storage/cron changes, or any new
dependency. Add an entry to the Changelog below and update the relevant section above.
The goal: a future agent should never have to reverse-engineer the project — this file
should always describe the _current_ reality.

## 13. Changelog

- **2026-06-30** — **3-day backfill on bootstrap.** When store has fewer than
  `INGEST_BOOTSTRAP_UNTIL` (50) articles, ingest scans up to 30 items/feed within
  `INGEST_MAX_AGE_DAYS` (3) by RSS `publishedAt`, clusters sorted newest-first.
  Normal mode stays 6 items/feed, 6/run.
- **2026-06-30** — **Ingest cadence: 10 min / 6 articles.** `vercel.json` cron
  `*/10 * * * *`; default `INGEST_MAX_PER_RUN=6`. Hobby plan still needs external
  cron (cron-job.org) for 10-minute intervals.
- **2026-06-30** — **8b JSON reliability fixes.** Real-run revealed many `json_validate_failed`
  errors on `llama-3.1-8b-instant` (the active fallback while 70b's daily quota is spent):
  (a) the model put unescaped double-quotes inside JSON string values, and (b) long body +
  perspectives overran `max_tokens` ("max completion tokens reached"). Fixes in `groq.ts`:
  prompt rule "never use double-quotes inside text values, use single quotes"; body target
  6-10 → **5-8 paragraphs**; `max_tokens` 2400 → **3200**; **retry the same model on a 400
  json error** (8b is stochastic — usually valid on a later attempt) within a 5-attempt loop.
  Positive signals from the run: chain fallback works, deeper feeds yield ~33 multi-source
  clusters (great for the mirror), articles accumulate (36→48). NOTE: 70b (better at JSON +
  instructions) returns on daily reset; Claude later removes this fragility entirely.
- **2026-06-30** — **Global English sources added.** Added NYT (World), BBC News (World EN),
  The Guardian (World), Al Jazeera to `dunya`. These are English; the synthesize prompt
  already writes Turkish, so the LLM reads EN and outputs TR (translation+synthesis is
  free, in-pipeline). Captures world news that indirectly concerns Turkey. Reuters/AP have
  no public RSS and their Google-News site-search returned 0 — skipped. ~37 feeds total.
- **2026-06-30** — **Deeper source list (33 feeds).** Added Halk TV, BirGün (via GNews
  site-search; direct 404), Gazete Duvar, Yeni Şafak, Star, Milliyet, CNN Türk to gündem;
  BBC Türkçe, DW Türkçe, Euronews TR to dünya (fills the thin world/international slot).
  Diken (403) skipped. Spectrum now: opposition/independent (Cumhuriyet, Sözcü, T24, Halk
  TV, BirGün, Gazete Duvar) · pro-gov (Sabah, A Haber, TRT, Yeni Şafak, Star) · mainstream
  (NTV, Hürriyet, Habertürk, Milliyet, CNN Türk) · international (BBC/DW/Euronews). Still
  no political labels in code (neutrality). More gündem feeds → more cross-source clusters
  for the mirror, but slower ingest (more feeds to fetch).
- **2026-06-30** — **Sözcü + T24 added.** Sözcü works via `rss/gundem.xml` (its `/feed/` is
  broken XML). T24's own RSS is broken XML, so it's pulled via a Google News site-search
  feed (`site:t24.com.tr`) — valid RSS, links back to T24. Now both opposition-leaning
  (Cumhuriyet, Sözcü, T24) and pro-gov (Sabah, A Haber, TRT) lines are represented for the
  mirror. (Supersedes the earlier "not added" note below.)
- **2026-06-30** — **Spectrum-spanning sources added.** Added Cumhuriyet, Sabah, A Haber,
  Hürriyet, Habertürk, TRT Haber to `FEEDS` (different editorial lines) so the mirror has
  opposing framings of the same event to surface. No political labels stored in code
  (neutrality + legal safety). Sözcü and T24 RSS feeds are non-standard XML (rss-parser
  fails) — not added; revisit with a tolerant parser later.
- **2026-06-30** — **"Mirror" multi-source perspectives (not a judge).** When sources frame
  the SAME event differently, the LLM now extracts the agreed FACTS into the body and lists
  each source's framing neutrally in a new `perspectives: {source, framing}[]` field
  (`SynthesizeOutput` + `Article`), rendered by `components/SourcePerspectives.tsx`
  ("Kaynaklar ne dedi?") under the article body. **Editorial stance (user-chosen "mirror"):**
  the AI must NOT decide who is politically right on value judgments (good/bad) — that would
  make us a partisan outlet + legal risk in TR. It only attributes who-said-what. Factual
  contradictions (numbers/dates) may still be flagged in `divergenceNote` with which claim
  is better corroborated; opinion differences are presented side-by-side, reader decides.
  Prompts (groq+gemini) updated with the AYNA İLKESİ; `sanitizePerspectives()` hardens
  parsing. NOTE: needs spectrum-spanning sources (e.g. add Sözcü + a pro-gov outlet) to
  actually surface opposing framings — currently feed set is mostly centrist agencies.
- **2026-06-30** — **Stronger clustering (the core engine).** Rewrote `lib/sources/cluster.ts`
  tokenizer: Turkish char folding (ç/ğ/ı/ö/ş/ü → ascii), crude stemming (words >4 chars
  truncated to first 4 → faiz/faizi→faiz, banka/bankası→bank), bigger stopword list, and
  comparison against the cluster's first-item ("representative") tokens to prevent drift.
  Tuned `threshold` 0.3→0.2, `minShared`=2. `MAX_PER_FEED` 4→6 for more overlap candidates.
  Verified on samples: same-event articles from different outlets cluster, unrelated stay
  separate. NEXT: per-source reputation (corroboration rate) on top — must NOT unfairly
  punish specialized/exclusive sources that look "solo" only because no overlapping feed
  covers their beat.
- **2026-06-30** — **Vercel deploy + cron ingest.** `lib/ingest/run.ts` shared by
  `scripts/ingest.ts` and `GET /api/cron/ingest` (Bearer `CRON_SECRET`). Production
  articles persist in **Vercel Blob** (`BLOB_READ_WRITE_TOKEN`); local dev uses
  `data/articles.json`. `vercel.json` cron every 6h; `INGEST_MAX_PER_RUN` caps serverless
  duration. See root `README.md`.
- **2026-06-30** — **Source images (RSS + og:image).** Ingest prefers images from
  feed enclosures / page meta (`lib/images/source.ts`); Unsplash remains fallback.
  `ArticleImage` uses native `<img>` for any CDN hostname. Detail page credits
  source name + link, or Unsplash when fallback was used.
- **2026-06-30** — **Article page source sidebar.** `app/haber/[id]/page.tsx` uses a
  two-column layout on `lg+`: main article left, sticky right sidebar (`280px`) with
  `CredibilityMeter`, AI disclaimer, and `ArticleSources` (single link or multi-source
  dropdown). Mobile stacks sidebar below the article.
- **2026-06-30** — **Credibility / corroboration meter.** Added `lib/ranking/credibility.ts`
  `getCredibility(article)` and `components/CredibilityMeter.tsx`, shown on the article
  detail page. The score (0–100) is **derived** from `sources.length` + `divergenceNote`
  (no ingest change, no token cost): 1 src=50, 2=76, 3=88, 4+=95, minus 22 if sources
  diverge. **Framing decision:** this measures *corroboration* (how many independent
  sources confirm), NOT absolute truth — labeled "Kaynak Doğrulama" with an explicit
  "%N · N bağımsız kaynak doğruladı / tek kaynak — doğrulama yok" caption, to avoid
  implying a repeated falsehood is "true". Most articles are currently single-source
  (clustering rarely matches across feeds), so they show low/🔴 until corroborated.
- **2026-06-30** — **Provider fallback chain + recency filter + balanced coverage.**
  (1) **AI chain:** `lib/ai/index.ts` now builds an ordered `FallbackProvider` from
  `AI_CHAIN` (e.g. `groq:llama-3.3-70b-versatile,groq:llama-3.1-8b-instant`). It uses the
  first provider; on a **daily** quota error it throws `QuotaExhaustedError` (groq detects
  `tokens/requests per day` in the 429 body), the chain marks that provider exhausted for
  the run and moves to the next. Per-minute 429s still retry+backoff. Provider factories
  (`createGroqProvider`/`createGeminiProvider`) take an optional model arg. Verified live:
  70b daily quota was exhausted → chain auto-fell-back to 8b. Resets daily; add Claude to
  the front of the chain later. (2) **Recency:** `MAX_AGE_DAYS = 3` in `ingest.ts` skips
  items older than 3 days (no historical backfill). (3) **Balanced coverage:** clusters are
  reordered — multi-source first, then the rest **shuffled** — so the `MAX_ARTICLES_PER_RUN`
  cap no longer always front-loads gündem/dünya; tech sources (Webtekno etc.) get a turn.
  NB: ingest no longer deletes `data/articles.json`; runs **accumulate** (dedup by id).
- **2026-06-30** — **Full-text sourcing + video embed + longer articles.** (1)
  `lib/sources/fulltext.ts` `fetchArticlePage(url)` fetches the source page and extracts
  the main body text (dependency-free `<p>` extraction, 8s timeout) so the LLM works from
  real material instead of the thin RSS snippet; ingest falls back to the snippet when
  extraction fails (e.g. Google News redirect links). (2) It also extracts a YouTube video
  id (iframe/youtu.be/watch) → stored as `Article.youtubeId`, embedded via the official
  `youtube-nocookie` iframe on the detail page. **Decision:** only YouTube _embeds_ — we
  do NOT copy/hotlink publishers' own video files (copyright/ad-network/hosting risk that
  would kill the monetization goal). NOTE: Turkish news sites mostly use their own players,
  so YouTube embeds are sparse; a YouTube Data API search per topic is the way to add
  videos reliably (deferred — needs API enablement). (3) Body lengthened to 6–10 paragraphs
  (`max_tokens` 2400) with an anti-filler/no-advice-closer prompt rule. Since the free
  `llama-3.1-8b-instant` ignores the negative instruction, `cleanBody()` in `ingest.ts`
  deterministically strips trailing filler/advice paragraphs (`FILLER_RE`). This is a
  stopgap for 8b; real quality needs 70b (daily quota) or Claude.
- **2026-06-30** — **Popular hero carousel.** Homepage manşet no longer shows the single
  newest article. `lib/ranking/popular.ts` scores articles (Google Trends TR match,
  `gundem`/multi-source boost, recency window) and `components/PopularHero.tsx` displays
  the top 10 in a carousel with thumbnail navigation. Those IDs are excluded from "Son Haberler".
- **2026-06-30** — **Ein UI liquid-glass frontend.** Integrated [Ein UI](https://ui.eindev.ir/)
  via Shadcn CLI (`components.json` `@einui` registry). Installed `glass-card`, `glass-button`,
  `glass-badge`, `glass-tabs`, `glass-separator`, `glass-switch`. Redesigned all pages with
  glass cards, gradient app shell, ambient blur orbs, and dual light/dark glass styling.
  Header uses `GlassCard` + `GlassButton` nav; `ThemeToggle` now uses `GlassSwitch`.
- **2026-06-30** — **Ingest reliability + free-tier limit handling.** (1) **Incremental
  save:** `scripts/ingest.ts` now calls `saveArticles` after EACH article (not once at the
  end), so the site fills live and progress survives interruption. (2) **Fetch timeouts:**
  added `AbortSignal.timeout` to the Groq (45s) and Unsplash (15s) `fetch` calls so a stuck
  request can't hang the whole run; the Groq 429 backoff is capped at 20s. (3) **Daily-quota
  diagnosis:** Groq free tier enforces a per-model **TPD (tokens-per-day)** limit —
  `llama-3.3-70b-versatile` is 100k/day and we exhausted it during a day of testing, which
  surfaced as every request returning 429 (`tokens per day` in the error body). **Workaround:
  switched `GROQ_MODEL` to `llama-3.1-8b-instant`** (separate, larger ~500k/day quota;
  faster, slightly lower quality). The 70b quota resets daily; long-term fix is Claude (paid)
  or Groq Dev tier when monetizing. Verified live: multi-source synthesis + `divergenceNote`
  working (e.g. a 2-source "UEFA → Fenerbahçe" item flagged as diverging).
- **2026-06-30** — **Unified header bar.** Merged logo row and category nav into a single
  sticky block in `components/SiteHeader.tsx` — logo, scrollable categories, and controls
  share one bar on desktop; on mobile categories wrap below logo without a separate divider.
  Active nav uses subtle pill highlight instead of underline.
- **2026-06-30** — **News-style header redesign.** Extracted header into
  `components/SiteHeader.tsx`: two-tier layout (logo + date + theme toggle / neutral
  category nav). Nav links no longer use per-category colors — active page gets an
  underline via `usePathname()`. Added "Ana Sayfa" link. Category colors remain on
  article cards and section headers only.
- **2026-06-30** — **Dark/light theme.** Added manual theme toggle (`components/ThemeToggle.tsx`)
  in the header. Uses Tailwind v4 class-based dark mode (`@custom-variant dark` in
  `app/globals.css`); preference stored in `localStorage`, with system `prefers-color-scheme`
  as default. Inline script in `app/layout.tsx` prevents flash of wrong theme on load.
  All pages and `ArticleCard` updated with `dark:` variants; category text colors in
  `lib/ui/categoryStyle.ts` include dark-mode counterparts.
- **2026-06-30** — **Homepage redesign (vivid & colorful theme).** Added
  `lib/ui/categoryStyle.ts` — a per-category color identity (full static Tailwind class
  strings for badge/solid/bar/gradient/text). Redesigned `app/page.tsx` with a full-width
  hero (manşet), a "Son Haberler" grid, and per-category sections with colored headers.
  `ArticleCard` now has image-on-top, colored category badge, gradient fallback when no
  image, and source-count/divergence chips. Header (`app/layout.tsx`) is sticky with a
  gradient logo and per-category colored nav links. Category page got a colored header;
  detail-page badges use the category color. Tuned ingest for Groq's per-minute token
  limit: `MAX_ARTICLES_PER_RUN` 12, Groq `max_tokens` 1600.
- **2026-06-30** — **Layout cleanup.** Removed the global footer (AI compilation disclaimer)
  and the header tagline (`otomatik · tarafsız`) from `app/layout.tsx`. The article detail
  page (`app/haber/[id]/page.tsx`) still carries its own on-page disclaimer where needed.
- **2026-06-30** — **Multi-source synthesis (cross-referencing).** Major pipeline change:
  ingest now (1) collects candidates from ALL feeds, (2) clusters items describing the
  same event via title similarity (`lib/sources/cluster.ts`, free heuristic — no
  embeddings), (3) sends each cluster to the LLM which **compares the sources and writes
  one balanced article**, attributing contested claims and emitting a `divergenceNote`
  when sources conflict. The `AIProvider` contract changed from `summarize` to
  `synthesize(SynthesizeInput{items[]})`. `Article` now has `sources: ArticleSource[]`
  (was single `sourceName`/`sourceUrl`) and an optional `divergenceNote`. Detail page
  shows all source links + an amber "kaynaklar ayrışıyor" box; cards show source count.
  **Deliberate choice:** we do NOT hardcode political-bias labels for outlets (defamation
  risk) — neutrality comes from comparing sources and surfacing divergence. This is also
  the engine an X source would feed into if added later (paid).
- **2026-06-30** — **Source expansion + Google Trends + moderation + X decision.**
  Replaced the tech-only feed list with reliable Turkish sources covering all categories
  (NTV per-category, Anadolu Ajansı, Google News TR + topic/search feeds, plus the
  original tech sites). Added `lib/sources/trends.ts`: Google Trends TR gives trending
  topics, which `scripts/ingest.ts` turns into dynamic Google News "Gündem" search feeds
  via `googleNewsSearchFeed()` — this captures "what's trending in Turkey" without X.
  **X (Twitter) was deliberately rejected** as a source: no free read API (~$200/mo),
  scraping violates ToS, and its user-generated content conflicts with the reliability/
  no-profanity/legal goals. Added a **content-moderation rule** to both LLM prompts (no
  profanity/hate/defamation, Turkish-law-compliant, cautious phrasing of claims) and a
  rule against foreign-script characters. Added ingest safeguards: `MAX_ARTICLES_PER_RUN`
  cap (20) to stay under Groq's free daily token limit (dedup spreads ingestion across
  cron runs), `MAX_PER_FEED` lowered to 4, and a `User-Agent` header on the RSS parser.
  Fixed the categorization bug where the feed category hint biased every article to one
  category — the hint is no longer sent to the model (kept only as ingest-side fallback).
- **2026-06-30** — **Per-content categorization + category expansion.** Categories
  expanded to 9 (Gündem, Dünya, Ekonomi & Finans, Teknoloji, Yapay Zeka, Spor, Bilim,
  Sağlık, Otomobil) in `lib/types.ts` (`Category` now derived from `CATEGORIES`; added
  `isCategory()`). The LLM now returns a `category` it picks from this list based on the
  article's content; `scripts/ingest.ts` uses it (falling back to the feed's category if
  invalid). Added a `categoryHint` to `SummarizeInput`. Added **429 retry/backoff** to
  the Groq provider so rate-limited items aren't lost, plus a prompt rule forbidding
  foreign-script characters. NOTE: feeds for most new categories still need to be added
  in `lib/sources/feeds.ts` (currently only tech feeds exist).

- **2026-06-30** — Initial build. Next.js (App Router, Tailwind) scaffold. AI provider
  abstraction with Groq (active) + Gemini (fallback). RSS ingest pipeline with dedupe
  and neutral-summary prompt. JSON store. Home, category, and article detail pages.
  Added long `body` + Unsplash royalty-free images + `/haber/[id]` detail page. Created
  this `agents/PROJECT.md` guide.
- **2026-06-30** — **Editorial pivot.** Changed the LLM prompt from "summarize source
  facts only" to "original AI authorship": the model now elaborates each topic into a
  detailed, original article/guide (brands, pros/cons, advice) with an objective tone
  and an anti-hallucination guardrail. Updated `lib/ai/groq.ts` + `lib/ai/gemini.ts`
  prompts, raised Groq `max_tokens` to 2000, and updated the detail-page disclaimer in
  `app/haber/[id]/page.tsx`. Rationale: richer content + better SEO + safer on
  copyright (original text), at the cost of higher factual-accuracy risk (mitigated by
  the guardrail + on-page disclaimer).
