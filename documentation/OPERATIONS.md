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
