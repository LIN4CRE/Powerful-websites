# Verification: what it does and does not prove

The central promise is that **a published website can be used without creating an
account**. This document explains exactly how that is checked, and where the
limits are.

## What the verifier does

1. **HTTP preflight** — follows redirects, records the final URL and status code.
2. **Browser render** — headless Chromium, fresh context, no cookies, no stored
   credentials, no extensions, standard desktop viewport and user agent.
3. **Barrier detection** — scans the visible text and form controls for:
   - sign-in or log-in required to continue;
   - create-account or registration gates;
   - email-verification gates;
   - subscription, trial or paid-plan walls;
   - mandatory API keys.
4. **Interface evidence** — counts interactive surfaces (canvas, textareas, file
   inputs, selects, inputs, iframes) or, for reference/content sites, substantial
   readable content. A page that is only a marketing shell is rejected.
5. **Decision** — `verified` only when every check passes; `pending` for transient
   network errors and bot challenges; `rejected` for hard barriers or dead pages.
6. **Evidence** — the reason, HTTP status, final URL, detected elements, duration
   and timestamp are stored on the record and shown in the JSON data.

## Deliberate design decisions

- **A login link is not a wall.** Many excellent tools have an optional account
  in the header. The verifier looks for a barrier that blocks the advertised
  function, not for the existence of a login button.
- **Temporary failures are not rejections.** Timeouts, 429s and 5xx responses are
  retried, then left `pending`. A published site is only removed after repeated
  failures or a confirmed barrier.
- **No marketing shells.** If there is no reachable tool interface and no
  substantial content, the site cannot be verified.
- **Free and open source are separate.** Open-source status is only set when the
  project's own licence is confirmed; it is never inferred from "free".

## Known limitations

- The verifier cannot exercise every feature. It proves that the page provides an
  accessible interface without an account, not that every individual action is
  free of limits (for example, a free daily conversion quota).
- Some sites actively block headless browsers. Those remain `pending` and are
  never published on the basis of a homepage fetch alone.
- Client-side login modals that only appear after a specific interaction may not
  be detected. Regression reports are the safety net; the scheduled recheck
  re-tests the whole directory over time.
- Website content changes constantly. The `lastVerifiedAt` timestamp is the only
  honest claim: "this passed an automated browser check at that moment".

## Reproducing a check

```bash
VERIFY_MAX=1 RECHECK_MAX=0 npx tsx scripts/verify.ts
```

The verifier writes the same evidence to `data/` that the scheduled workflow
uses. Add `DEBUG_VERIFY=1` to log page titles while investigating a candidate.
