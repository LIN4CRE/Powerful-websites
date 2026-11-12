# Security and privacy

Powerful Websites is a static site with no backend, no accounts and no database.

## What the project deliberately does not do

- No user accounts, login forms, passwords or email collection.
- No cookies. Preferences (theme, saved sites) use `localStorage` only and never leave the browser.
- No analytics, advertising pixels or third-party scripts. Fonts are bundled and served from the same origin.
- No secrets in the repository. The scan workflow uses the automatically supplied `GITHUB_TOKEN`.
- No API keys or paid services are required to run the site or the automation.

## Reporting a problem

If you find a security issue — for example a malicious site in the directory, or a
workflow permission problem — please open a private security advisory on the
repository (Security → Advisories) rather than a public issue. We aim to respond
within a few days.

## External links

Every listing links straight to the official website and opens in a new tab with
`rel="noopener noreferrer"`. Sites are operated by third parties; their content,
privacy practices and availability are outside this project's control.

## Vercel-specific controls

- **Private scheduled function.** `api/schedule/scan.ts` uses
  `experimentalTriggers: [{ "type": "schedule/v1beta" }]`, which removes its public
  URL. There is no unauthenticated trigger endpoint for scanning.
- **SSRF protection.** `scripts/lib/safety.ts` blocks non-HTTP schemes, embedded
  credentials, non-standard ports, loopback/private/link-local/multicast addresses,
  cloud metadata hostnames and DNS answers pointing into private ranges. Every
  redirect hop is re-validated in `api/_lib/http.ts`.
- **Bounded fetches.** 12 s timeout, five redirects, 2.5 MB ceiling, explicit
  User-Agent and robots.txt checks before directory sources are fetched.
- **Least-privilege token.** `GITHUB_DATA_TOKEN` is a fine-grained token limited to
  this repository with `contents: write`; it is read only in server code.
- **No credentials in responses.** `/api/data` and `/api/health` expose directory
  counts and timestamps only.
- **Headers.** `vercel.json` sets CSP, `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options: DENY` and a restrictive `Permissions-Policy`.
- **No visitor tracking.** No analytics, no cookies, no third-party requests; the
  service worker caches only same-origin assets and `/api/data`.
