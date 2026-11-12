# POWERFUL WEBSITES

**Discover the power of the open web.**

A continuously updated, machine-verified directory of genuinely useful websites —
each one usable **without creating an account, logging in or supplying an API key**.

**Live site:** <https://lin4cre.github.io/Powerful-websites/>

---

## What this is

Most "best websites" lists rot. Links die, tools add paywalls and directories quietly
fill with sites that demand a sign-up before they do anything.

Powerful Websites is built the other way round:

- **Only verified entries are published.** A headless browser opens every candidate
  in a clean profile and checks for login walls, email-verification gates, paywalls
  and mandatory API keys.
- **The collection maintains itself.** Three scheduled robots discover, verify and
  curate the directory every ~15 minutes with GitHub Actions.
- **Every number is real.** Statistics, timestamps and robot statuses are read from
  the data the last workflow run actually produced. If a scan fails, the site says so.
- **No accounts, no trackers, no cookies.** Preferences live in `localStorage`; fonts
  and logos are served from the same origin.

## Features

### Discovery experience

- Instant client-side search across names, descriptions, categories, tags and features
- 20 categories plus an **All websites** view, with live counts
- Sorting by curated order, newest, A–Z and most recently verified
- Open-source-only and saved-sites filters
- `Ctrl/⌘ + K` command palette, `/` to focus search, full keyboard navigation
- Paginated grid (36 at a time) so thousands of entries stay fast
- Empty, loading-free and honest first-run states

### Trust signals

- **NO LOGIN REQUIRED** badge only after browser verification
- **FREE** and **OPEN SOURCE** badges — open source only with a confirmed licence
- Last verification date on every card
- Real automation panel for SCOUT, VERIFIER and CURATOR, including failed sources
- Live local clock, real last-successful-scan time and a visible staleness warning

### Design

Dark-first, premium interface with deep navy surfaces, cyan and blue accents,
bundled variable fonts, subtle gradients, controlled glow, reduced-motion support,
a light theme and responsive layouts from 320 px phones to wide desktops.

Screenshots are produced by the Playwright suite on every CI run and uploaded as
build artifacts. The live site is the reference.

## The robots

| Robot | Job | Where |
| --- | --- | --- |
| **SCOUT** | Discovers candidate websites from public sources | `scripts/scout.ts` |
| **VERIFIER** | Opens every candidate in a fresh headless browser and decides whether it is usable without an account | `scripts/verify.ts` |
| **CURATOR** | De-duplicates, normalises categories/tags/descriptions, flags stale listings, enforces publish rules | `scripts/curate.ts` |

They run in sequence:

```bash
npm run scan      # scout → verify → curate → logo cache → scan-metadata.json
```

### Verification in detail

For each site the verifier:

1. performs an HTTP preflight and records the final URL after redirects;
2. launches Chromium with **no cookies, no storage and no credentials**;
3. inspects visible password fields, forms, inputs, canvases and page text;
4. rejects hard barriers (sign in to continue, create an account, email verification,
   subscription walls, API-key gates);
5. accepts optional login links — a login button is not a login wall;
6. retries transient errors, and leaves unverifiable sites `pending` instead of
   pretending they passed;
7. stores evidence (status, final URL, detected elements, duration, timestamp).

Only `verified` records enter `data/sites.json`. See [documentation/VERIFICATION.md](documentation/VERIFICATION.md)
for the full method and its honest limitations.

## Automation schedule

- **Cron:** `7,22,37,52 * * * *` — approximately every 15 minutes, staggered on purpose.
- **Manual:** Actions → **Scan & Verify** → *Run workflow* (optionally on a branch).
- **Best effort:** GitHub Actions scheduling can be delayed; the site shows the
  actual completion time, never the expected one.
- **Resilience:** each source is isolated. One failing source never blocks the others.
- **No secrets required:** only the automatic `GITHUB_TOKEN`, with `contents: write`
  for the scan job and `pages: write`/`id-token: write` for deployment.

A run is capped by `VERIFY_MAX` and `RECHECK_MAX` so the cadence stays healthy;
set them higher for a one-off catch-up via the workflow inputs. Older listings are
re-checked on a rolling basis, so the whole directory is re-verified continuously.

## Technology

| Layer | Choice |
| --- | --- |
| UI | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| Icons & type | Lucide, bundled Inter Variable and JetBrains Mono Variable |
| Data | JSON files validated with Zod |
| Verification | Playwright (Chromium) + `fetch` |
| Scraping helpers | Cheerio, fast-xml-parser, Sharp (logo normalisation) |
| Automation | GitHub Actions (cron + manual), GitHub Pages |
| Tests | Vitest + Testing Library, Playwright, axe-core |

No database, backend, paid API, external AI service or hosted queue is involved.

## Local development

Requirements: Node.js 20+ (22 recommended).

```bash
npm ci
npm run dev          # http://localhost:5173
```

Build and preview exactly as GitHub Pages will serve it:

```bash
VITE_BASE=/Powerful-websites/ npm run build
npm run preview
```

### Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and production build |
| `npm test` | Unit, component and data-validation tests |
| `npm run test:e2e` | Playwright tests (desktop + mobile); builds and previews automatically |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run validate:data` | Zod + cross-reference validation of every JSON file |
| `npm run scout` | Discover candidates only |
| `npm run verify` | Verify candidates and re-check oldest listings |
| `npm run curate` | Clean and normalise the directory |
| `npm run scan` | Full pipeline (what CI runs) |
| `npm run icons` | Download missing site logos |
| `npm run check:links` | HTTP audit of every published listing |

Running the verifier locally needs a Chromium build:

```bash
npx playwright install --with-deps chromium
VERIFY_MAX=5 RECHECK_MAX=2 npm run verify
```

## Data model

```text
data/
├── sites.json          # published, verified listings
├── candidates.json     # pending and rejected discoveries
├── sources.json        # declarative discovery sources
├── categories.json     # taxonomy (20 starting categories, extensible)
└── scan-metadata.json  # timestamps, counts, source health, robot status
```

A published site carries its official URL and domain, description, category, tags,
free/account/API-key flags, confirmed open-source metadata, discovery source,
discovery and verification timestamps, verification evidence and availability.

**Add a source without touching code** — append to `data/sources.json`:

```json
{
  "id": "my-source",
  "name": "My Source",
  "type": "rss",
  "url": "https://example.com/feed.xml",
  "enabled": true,
  "category": "developer",
  "maxItems": 6
}
```

Types: `github-awesome`, `github-search`, `no-signup-list`, `rss`, `atom`,
`html-links`. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Deployment

`deploy.yml` builds with `VITE_BASE=/Powerful-websites/` and publishes to GitHub Pages.
It runs on:

- pushes to `main`;
- completion of a **Scan & Verify** run (so even a no-change scan ships fresh metadata);
- manual dispatch.

One-time setup: **Settings → Pages → Source: GitHub Actions**. Full runbook:
[documentation/OPERATIONS.md](documentation/OPERATIONS.md).

## Quality

CI (`.github/workflows/ci.yml`) runs on every push and pull request:

- ESLint and strict TypeScript
- 80+ unit, component and data-integrity tests
- Schema and cross-reference validation of the JSON
- Production build and build-output checks
- Playwright suites on desktop and mobile viewports, including axe accessibility
  scans, keyboard navigation, search, filters, external-link attributes, responsive
  grid behaviour and no-cookie checks
- Screenshots uploaded as build artifacts for visual review

A weekly audit (`quality.yml`) re-checks every published link and flags stale
automation. The verifier itself is the authority on additions and removals.

### Known limitations

Verification proves an interface is reachable without an account at a specific
moment; it cannot exercise every feature or predict future quotas. Heavily
bot-protected sites stay `pending` rather than being guessed at. Details and the
full list of limitations live in [documentation/VERIFICATION.md](documentation/VERIFICATION.md).

## Privacy

No accounts, no cookies, no analytics, no advertising, no third-party scripts and
no personal data collection. Saved sites and theme preference are stored only in
your browser and can be cleared from browser settings. Logos are mirrored locally
so opening the directory never pings the listed sites. See [SECURITY.md](SECURITY.md).

## Licence

Original project code: **MIT** (see [LICENSE](LICENSE)).

Website names, logos and trademarks belong to their owners and are used only to
identify the linked service. Descriptions are original editorial copy; metadata is
factual observation from the verification run.
