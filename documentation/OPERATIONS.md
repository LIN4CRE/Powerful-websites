# Operations guide

## Daily operation

Nothing needs doing. The `Scan & Verify` workflow runs at **07, 22, 37 and 52
minutes past every hour** and commits data only when something changed.

Check status here:
`https://github.com/LIN4CRE/Powerful-websites/actions/workflows/scan.yml`

The site's header, live strip and robot cards read `data/scan-metadata.json`.
If a scan fails, the last successful time remains visible and the site is marked
degraded — it never pretends a run succeeded.

## Enabling GitHub Pages (one-time, manual)

1. Repository → **Settings → Pages**.
2. **Build and deployment → Source: GitHub Actions**.
3. Run **Actions → Deploy to GitHub Pages → Run workflow**.

The deploy workflow uses the `github-pages` environment and the base path
`/Powerful-websites/`, matching `https://lin4cre.github.io/Powerful-websites/`.

## Changing the schedule

Edit the cron line in `.github/workflows/scan.yml`. Keep the stagger: GitHub's
scheduler is best-effort, and exact-quarter-hour starts are the most congested.

## Tuning throughput

Set via the manual workflow inputs (or repository variables):

| Variable | Default | Meaning |
| --- | --- | --- |
| `SCOUT_MAX_NEW` | 24 | Maximum new candidates per run |
| `VERIFY_MAX` | 26 | Candidates verified per run |
| `RECHECK_MAX` | 10 | Existing sites re-checked per run |
| `VERIFY_CONCURRENCY` | 4 | Parallel browser contexts |
| `ICON_MAX` | 20 | Logos downloaded per run |
| `STALE_DAYS` | 45 | Age at which the curator flags a listing |

Increase verifications for a one-off catch-up run; keep the scheduled run under
~10 minutes so the 15-minute cadence stays healthy.

## Reviewing a candidate batch

```bash
npm run scout                 # discover
npx tsx scripts/verify.ts     # test
npm run curate                # tidy
npm run validate:data
```

`data/candidates.json` contains the rejection reason and evidence for every site
that failed, so you can spot false negatives (usually bot protection) quickly.

## Removing a site

Set its verification outcome honestly by letting the verifier re-test it — open a
bug report and wait for the next scan, or run the verifier locally. Removing a
record by hand from `data/sites.json` is allowed in an emergency, but the site
will be re-discovered and re-verified.

## Logo cache

`public/logos/<id>.png` files are downloaded by `scripts/fetch-icons.ts` from the
site's own icon files, normalised to 96×96 PNG. If no icon exists, the UI renders
a deterministic monogram. Logos are committed so visitors make no third-party
requests. Delete a file to force a refresh on the next scan.

## Adding a category

Prefer letting the curator add it automatically. Manual additions belong in
`data/categories.json` with a unique lowercase `id`, a display `name`, a Lucide
`icon` name and a short description. Existing sites reference the category id.

## Serving the site without Actions

The production build is committed to `docs/` so GitHub Pages can serve it from a
branch while Actions runners are unavailable.

```bash
npm run build:pages   # tsc -b && BUILD_OUT_DIR=docs vite build
git add docs && git commit -m "chore: refresh committed Pages build"
```

Pages setup: **Settings → Pages → Deploy from a branch → branch `main` (or the
working branch) → `/docs`**.

Checklist when shipping a change that is served from `docs/`:

1. `npm run test`, `npm run lint`, `npm run typecheck`
2. `npm run validate:data`
3. `npm run build:pages`
4. commit `docs/` together with the source change

Both the committed build and `deploy.yml` publish the same `VITE_BASE`
(`/Powerful-websites/`), so switching between the two paths does not change URLs.

## Known blocker: Actions billing lock

Observed on 12 November 2026: every workflow job fails in about two seconds with
zero executed steps and the annotation *"The job was not started because your
account is locked due to a billing issue."* Only `ci.yml` was registered; the
newer workflow files were not yet listed by the API at the time of the attempt.

This is an account-level condition, not a workflow defect. Verify with:

```bash
gh run list --limit 5
gh run view <run-id> --log-failed
gh api repos/LIN4CRE/Powerful-websites/actions/runs/<run-id>/jobs
```

Do not "fix" the YAML in response. Once billing is resolved, dispatch the scan
manually (`gh workflow run scan.yml`) to populate `data/sites.json` with browser
evidence and to let `deploy.yml` publish.

## Vercel is the primary platform

Production runs on Vercel with the native GitHub integration:

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Root directory | repository root |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Production branch | `main` |
| Preview deployments | every other branch and pull request |

`vercel.json` adds the SPA rewrite, security headers, immutable asset caching,
function durations and the `directory-scan` schedule. The Vite `base` is `/`; the
Pages build is the only place that overrides it.

### Scheduled scanning

```json
"schedules": {
  "directory-scan": {
    "schedule": "7,22,37,52 * * * *",
    "function": "api/schedule/scan.ts",
    "timezone": "UTC"
  }
}
```

`api/schedule/scan.ts` sets `experimentalTriggers: [{ "type": "schedule/v1beta" }]`,
which removes its public URL — only Vercel's scheduler can invoke it. The handler
wraps `runTick()` in `handleSchedule` from `@vercel/schedules`.

Each invocation is bounded: one source, up to three verifications, a 210-second
budget. Results are committed to `DATA_BRANCH` (`data/live` by default) so
production builds never restart because of a data update.

**Check the schedule is live:** Vercel dashboard → Project → *Schedules* (or
*Cron Jobs* on older dashboards). Confirm `directory-scan` shows the four-minute
stagger and a recent execution. Function logs contain one JSON line per tick:
`{"event":"scan-tick","mode":"persisted"|"read-only",...}`.

**Hobby allowance:** 5,000 schedule runs/month; a 15-minute cadence uses ≈2,880.

### Enabling persistent writes

1. GitHub → Settings → Developer settings → Fine-grained tokens → *Generate new token*.
2. Repository access: only `LIN4CRE/Powerful-websites`.
3. Permissions: **Contents → Read and write**. Nothing else.
4. Vercel → Project → Settings → Environment Variables → add `GITHUB_DATA_TOKEN`
   for Production (and Preview if desired), type **Sensitive**.
5. Redeploy (or wait for the next deployment). `/api/health` will report
   `"persistedWrites": true`.

The token is used only by `api/_lib/repo.ts`; it is never sent to the browser and
never appears in API responses.

### Refreshing the optional Pages build

```bash
npm run build:pages   # VITE_BASE=/Powerful-websites/ -> docs/
```

## Node 26 runtime gotchas (learned in production)

- **JSON imports need `createRequire`.** Vercel transpiles each function file and
  runs it on Node 26, where `import data from './x.json'` without an import attribute
  throws `ERR_IMPORT_ATTRIBUTE_MISSING`. `api/_lib/dataset.ts` therefore loads
  `data/*.json` through `createRequire(import.meta.url)`, which also keeps the literal
  paths that nft uses to trace the JSON into the function bundle.
- **Relative imports need extensions.** The package is `"type": "module"` and files
  are compiled individually, so every relative import in `api/` and `scripts/` carries
  an explicit `.js` extension.
- **`cheerio` is a runtime dependency**, not a dev dependency, because the scheduled
  verifier imports it.
- **Diagnose from outside.** `/api/health` returns `503 {"ok":false,"error":"<code>"}`
  when the data layer throws; the code alone identifies a broken deployment without
  exposing paths or stack traces.
