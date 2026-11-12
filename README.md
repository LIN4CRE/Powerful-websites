# POWERFUL WEBSITES

**Discover the power of the open web.**

A continuously updated, machine-verified directory of genuinely useful websites —
each one usable **without creating an account, logging in or supplying an API key**.

**Live site:** <https://powerful-websites-app.vercel.app/> — installable as an app on
Android, Windows, macOS, Linux and iPadOS/iPhone (Add to Home Screen).

---

## Current status (12 November 2026)

| Item | State |
| --- | --- |
| Hosting | **Vercel**, production branch `main`, automatic Git deployments + PR previews |
| Installability | Web app manifest, generated service worker, offline shell, install prompt |
| Published listings | **32**, each with a recorded evidence string and timestamp |
| Verification method | `reader` — server-side HTTP + DOM review (no browser available on the free runner) |
| Queued candidates | **163** waiting for the scheduled verifier |
| Scheduled scanning | **Vercel Schedules**, `7,22,37,52 * * * *`, private `api/schedule/scan.ts` |
| Persistent writes | Pending one manual step: add `GITHUB_DATA_TOKEN` (see below) |
| GitHub Actions | Still billing-blocked; workflows are manual-only now, Vercel no longer depends on them |

Nothing on the site is simulated. Until `GITHUB_DATA_TOKEN` is configured the
scheduled tick runs read-only and says so in its log; the UI keeps showing the last
real timestamps instead of inventing new ones.

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

### Installable app (PWA)

- **Manifest:** name, short name, description, `start_url`/`scope` `/`, standalone
  display, theme/background colours and 192/512/maskable icons generated from the
  project's own logo (`npm run icons:generate`).
- **Service worker:** Workbox precaches the shell, JS, CSS, fonts, icons and logo
  assets; `/api/data` is `NetworkFirst` (4 s timeout) so the directory works offline;
  logos are `CacheFirst`.
- **Install prompt:** a dismissible card listens for `beforeinstallprompt`, offers
  *Install app* / *Not now*, never opens the browser dialog by itself, hides when the
  app is already installed and snoozes for 14 days after *Not now*.
- **iOS/iPadOS:** no `beforeinstallprompt` exists there, so the card switches to the
  Share → *Add to Home Screen* instructions.
- **Updates:** nothing reloads silently. A waiting service worker raises a small
  “A new version is available” toast with a Refresh button.
- **Offline:** an explicit offline banner shows when the device is disconnected and
  states that website links need a connection; search and filters keep working.

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

### Verification methods

| `method` | What it proves |
| --- | --- |
| `http+browser` | The automated standard: Chromium in a clean profile reached the tool without an account. |
| `reader` | A server-rendered document review reached the tool interface, with no login wall in the rendered document. Used only while runners are unavailable. |
| `http` | Reachability only. Never published. |
| `editorial` | Human review without a machine check. Never published. |

The UI is explicit about this: browser-verified cards read **Verified**, reader
records read **Checked**, and the status strip explains why. The data validator
refuses a record that claims a browser pass without one, or that claims the
automated method under a weaker mode.

Only `verified` records enter `data/sites.json`. See [documentation/VERIFICATION.md](documentation/VERIFICATION.md)
for the full method and its honest limitations.

## Automation (Vercel Schedules)

The robots run on **Vercel Schedules**, not GitHub Actions.

```json
"schedules": {
  "directory-scan": {
    "schedule": "7,22,37,52 * * * *",
    "function": "api/schedule/scan.ts",
    "timezone": "UTC"
  }
}
```

- **Private function:** `api/schedule/scan.ts` is registered with
  `experimentalTriggers: [{ "type": "schedule/v1beta" }]` and `handleSchedule` from
  `@vercel/schedules`. It has no public URL, so visitors cannot trigger scans.
- **Cadence:** minutes 7/22/37/52 — 96 runs a day, ≈2,880 a month, inside the Hobby
  allowance of 5,000 schedule runs. No paid features are used.
- **Bounded work:** each tick does one discovery source, up to three verifications
  and one curation pass inside a 210 s budget (Hobby functions cap at 300 s).
- **Persistent progress:** results are committed to the `data/live` branch through
  the GitHub Contents API, so a tick resumes where the last one stopped. Because
  `data/live` is not the production branch, directory updates never rebuild the app.
- **Fresh data without rebuilds:** `/api/data` serves the live branch with
  `s-maxage=300`, so the UI picks up new records within five minutes.
- **Failure handling:** a failing source is recorded and the tick continues; the
  last successful timestamps are preserved and the UI shows the warning.

Optional fallback: `.github/workflows/scan.yml` still contains the Playwright
browser verifier for whoever restores Actions billing. It is `workflow_dispatch`
only and is not required by the site.

## Technology

| Layer | Choice |
| --- | --- |
| UI | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| Icons & type | Lucide, bundled Inter Variable and JetBrains Mono Variable |
| Data | JSON files validated with Zod |
| Verification | Playwright (Chromium, optional) + serverless HTTP/DOM review |
| Scraping helpers | Cheerio, fast-xml-parser, Sharp (logo normalisation) |
| Automation | Vercel Schedules + `@vercel/schedules`, GitHub Contents API |
| Hosting | Vercel (framework preset Vite, SPA) |
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

## Deployment (Vercel)

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Root directory | repository root |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Production branch | `main` |

`vercel.json` carries the Vite preset, SPA rewrite, security headers, cache rules,
function durations and the schedule definition. `base` is `/` for Vercel; only the
optional Pages build overrides it.

### Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (see
`.env.example`). Nothing is required to serve the site.

| Name | Required | Purpose |
| --- | --- | --- |
| `GITHUB_DATA_TOKEN` | for automation | Fine-grained token, **Contents: read and write** on this repository only. Lets the scheduled tick commit to `data/live`. |
| `DATA_BRANCH` | no | Commit target, default `data/live`. |
| `VERCEL_PROJECT_DASHBOARD_URL` | no | Public dashboard link used by the “Schedule history” button. |

The token is read only inside serverless functions, never bundled into the client
and never returned by an API response.

### Fallback hosting

GitHub Pages remains possible without complicating the Vercel path:
`npm run build:pages` writes a `VITE_BASE=/Powerful-websites/` build to `docs/`,
which can be served from the branch (Settings → Pages → Deploy from a branch → `/docs`).
It is documented in [documentation/OPERATIONS.md](documentation/OPERATIONS.md).

## Quality

CI (`.github/workflows/ci.yml`) runs on every push and pull request:

- ESLint and strict TypeScript
- 88 unit, component and data-integrity tests
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
bot-protected sites stay `pending` rather than being guessed at.

Two honest caveats for the current deployment:

1. Scheduled verification is a **server-side HTTP + DOM review**, not a browser
   test. Records say `method: "reader"` and the UI labels them “Checked”. Browser
   verification still requires the Playwright workflow on a machine that can run it.
2. Until `GITHUB_DATA_TOKEN` is added, scheduled ticks cannot persist results, so
   the catalogue stays at the 32 manually reviewed entries.

Full detail lives in [documentation/VERIFICATION.md](documentation/VERIFICATION.md).

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
