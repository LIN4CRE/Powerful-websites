# Architecture

```
┌────────────────────────── GitHub Actions (every 15 min) ──────────────────────────┐
│                                                                                   │
│   data/sources.json                                                               │
│          │                                                                        │
│          ▼                                                                        │
│   ┌──────────┐   candidates    ┌───────────┐   verified    ┌───────────┐          │
│   │  SCOUT   │ ──────────────▶ │ VERIFIER  │ ────────────▶ │  CURATOR  │          │
│   └──────────┘                 └───────────┘               └───────────┘          │
│        │                             │                          │                │
│        ▼                             ▼                          ▼                │
│  data/candidates.json          data/sites.json            data/scan-metadata.json │
│                                public/logos/*.png          data/categories.json  │
│                                      │                                            │
│                                      ▼                                            │
│                          commit only real changes → push                          │
└───────────────────────────────────────┬───────────────────────────────────────────┘
                                        │ workflow_run
                                        ▼
                            Deploy to GitHub Pages (Vite build)
```

## Data files

| File | Purpose | Written by |
| --- | --- | --- |
| `data/sites.json` | Published, verified listings. Only records with a complete verification can live here. | Verifier · Curator |
| `data/candidates.json` | Discovered or suggested sites awaiting verification (`pending`) or that failed (`rejected`). Never rendered as confirmed. | Scout · Verifier · Curator · Seed |
| `data/sources.json` | Declarative discovery sources. Add rows to add sources. | Humans |
| `data/categories.json` | Taxonomy. The curator can append categories. | Curator |
| `data/scan-metadata.json` | Timestamps, counts, per-source health and robot status. Every number on the site comes from here or `sites.json`. | Scan orchestrator |

All files are validated with Zod (`src/lib/schema.ts`) and cross-referenced by
`scripts/validate-data.ts`. CI refuses to deploy invalid data.

## Robots

### SCOUT — `scripts/scout.ts`

- Reads only enabled sources from `data/sources.json`.
- Supports GitHub awesome-lists (README via the API), GitHub repository search,
  RSS/Atom feeds and HTML link extraction.
- Deduplicates by registrable domain against both published sites and candidates.
- Caps output per source and per run. No source failure aborts the run.
- Honours `robots.txt` for HTML scraping, caches responses for six hours, uses
  conditional requests (`ETag`, `If-Modified-Since`) and backs off on 429/5xx.
- Never bypasses authentication, CAPTCHAs or paywalls.

### VERIFIER — `scripts/verify.ts` + `scripts/lib/verify-*.ts`

- HTTP preflight captures status codes and the final URL after redirects.
- Launches headless Chromium with a **fresh context per site**: no cookies, no
  storage, a normal user agent, 1440×960 viewport.
- Measures visible password fields, text inputs, textareas, canvases, file
  inputs, selects, forms and iframes; reads the visible text.
- Rejects hard barriers: sign-in-to-continue, create-account-to-continue,
  registration required, email verification required, subscription/trial walls,
  mandatory API keys.
- A header "Sign in" link is *not* a barrier (checked explicitly by the tests).
- Retries transient failures once; unverifiable sites stay `pending` rather than
  being falsely rejected.
- Publishes only when HTTP, browser render, no wall, no key and a usable
  interface/content are all evidenced.

### CURATOR — `scripts/curate.ts`

- Removes duplicate domains across both files.
- Normalises tags, descriptions and categories; creates categories when needed.
- Enforces publish invariants (verified, free, no account, no API key, valid URL).
- Flags stale records (>45 days) so the verifier prioritises them.
- Keeps `scan-metadata.json` counts honest.

## Front end

- React 19 + TypeScript + Vite + Tailwind CSS v4, Lucide icons, bundled Inter and
  JetBrains Mono fonts.
- Search index is built once (`buildIndex`) and filtered in memory with AND-token
  matching, so thousands of entries remain instant. The grid is paginated at 36.
- State: React only. Preferences and saved sites use `localStorage`.
- No router: one page, anchored sections, so GitHub Pages needs no SPA rewrite.

## Deployment

`scan.yml` commits data with the workflow token and pushes. Pushes made with
`GITHUB_TOKEN` do not trigger other workflows, so `deploy.yml` listens to
`workflow_run` as well as `push` — that guarantees the build always receives the
latest metadata even when no site was added. The build validates data, runs
`vite build` with the repository base path, and publishes with `actions/deploy-pages`.
