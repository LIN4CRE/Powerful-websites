/**
 * Pure verification logic: given a snapshot of what a real browser saw, decide
 * whether the site can be published as "usable without an account".
 *
 * Kept free of Playwright so it can be unit tested deterministically.
 */

export interface PageSnapshot {
  requestedUrl: string;
  finalUrl: string;
  httpStatus: number;
  title: string;
  visibleText: string;
  htmlLength: number;
  passwordFields: number;
  textInputs: number;
  textareas: number;
  canvases: number;
  contentEditables: number;
  fileInputs: number;
  selects: number;
  forms: number;
  iframes: number;
  hasSignInControl: boolean;
  botProtection: boolean;
  loadError?: string;
}

export interface Analysis {
  loginWall: boolean;
  wallSignal: string | null;
  apiKeyRequired: boolean;
  coreUi: 'tool' | 'content' | 'none';
  toolSignals: string[];
  contentChars: number;
  paywall: boolean;
}

const HARD_WALL_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bsign in to (continue|use|access|proceed|view this)\b/i, label: 'sign in to continue' },
  { pattern: /\blog in to (continue|use|access|proceed|view this)\b/i, label: 'log in to continue' },
  { pattern: /\b(create|make) (a free |an? )?account to (continue|use|access|proceed)\b/i, label: 'create an account to continue' },
  { pattern: /\b(sign ?up|register) to (continue|use|access|proceed)\b/i, label: 'sign up to continue' },
  { pattern: /\b(registration|sign[- ]?in|login|log[- ]in) (is )?required\b/i, label: 'registration required' },
  { pattern: /\byou must (be )?(signed in|logged in|sign in|log in|register)\b/i, label: 'must be signed in' },
  { pattern: /\b(verify|confirm) your email to (continue|use|access|proceed)\b/i, label: 'email verification required' },
  { pattern: /\b(start|begin) your (free )?trial to (continue|use|access)\b/i, label: 'trial required' },
  { pattern: /\bsubscri(b|be|ption) (to|is required to) (continue|use|access)\b/i, label: 'subscription required' },
  { pattern: /\bupgrade (your plan|to pro|to premium) to (continue|use|access)\b/i, label: 'paid plan required' },
  { pattern: /\b(enter|add|provide|paste) your api key\b/i, label: 'API key required' },
  { pattern: /\bapi key (is )?required\b/i, label: 'API key required' },
  { pattern: /\bthis (tool|app|feature) requires? (an? )?(account|login|sign[- ]?in)\b/i, label: 'account required' },
  { pattern: /\bonly available (to|for) (registered|signed[- ]in|logged[- ]in) users\b/i, label: 'registered users only' },
];

const PAYWALL_PATTERNS = [
  /\bsubscribe (now )?to (read|view|access|continue)\b/i,
  /\bthis (article|content|story) is for (subscribers|members) only\b/i,
  /\bunlock (this|full) (article|content|story)\b/i,
];

const BOT_PROTECTION_PATTERNS = [
  /checking your browser/i,
  /attention required/i,
  /access denied/i,
  /enable javascript and cookies to continue/i,
  /verify you are (a )?human/i,
  /unusual traffic/i,
  /cf-error-details/i,
  /please complete the security check/i,
];

const HARD_FAIL_STATUSES = new Set([400, 401, 402, 403, 404, 410, 451]);

export function normaliseVisibleText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function detectBotProtection(snapshot: PageSnapshot): boolean {
  const text = normaliseVisibleText(snapshot.visibleText).slice(0, 4000);
  return (
    snapshot.botProtection ||
    BOT_PROTECTION_PATTERNS.some((p) => p.test(text)) ||
    (snapshot.httpStatus === 403 && snapshot.htmlLength < 4000)
  );
}

export function detectLoginWall(snapshot: PageSnapshot): { wall: boolean; signal: string | null } {
  const text = normaliseVisibleText(snapshot.visibleText);
  const toolSignals = countToolSignals(snapshot);

  // A short page whose only meaningful content is an auth form is a wall.
  const looksLikeAuthPage =
    snapshot.passwordFields > 0 &&
    text.length < 1200 &&
    /\b(sign in|log in|login|create (an|your) account|register|forgot (your )?password)\b/i.test(text);

  if (looksLikeAuthPage) {
    return { wall: true, signal: 'redirected to an authentication form' };
  }

  for (const { pattern, label } of HARD_WALL_PATTERNS) {
    if (pattern.test(text)) {
      // A short, app-like page that says this is a hard gate. On long marketing
      // pages the same phrase can be a pricing footnote, so require either a
      // short page or no interactive tool surface at all.
      if (text.length < 4000 || toolSignals === 0) {
        return { wall: true, signal: label };
      }
    }
  }

  return { wall: false, signal: null };
}

export function countToolSignals(snapshot: PageSnapshot): number {
  let signals = 0;
  if (snapshot.canvases > 0) signals += 2;
  if (snapshot.contentEditables > 0) signals += 2;
  if (snapshot.fileInputs > 0) signals += 2;
  if (snapshot.textareas > 0) signals += 2;
  if (snapshot.selects > 0) signals += 1;
  if (snapshot.textInputs >= 2) signals += 1;
  if (snapshot.iframes > 0) signals += 1;
  return signals;
}

export function analyseSnapshot(snapshot: PageSnapshot): Analysis {
  const text = normaliseVisibleText(snapshot.visibleText);
  const toolSignals: string[] = [];
  if (snapshot.canvases > 0) toolSignals.push(`canvas×${snapshot.canvases}`);
  if (snapshot.contentEditables > 0) toolSignals.push(`editable×${snapshot.contentEditables}`);
  if (snapshot.fileInputs > 0) toolSignals.push(`file-input×${snapshot.fileInputs}`);
  if (snapshot.textareas > 0) toolSignals.push(`textarea×${snapshot.textareas}`);
  if (snapshot.textInputs > 0) toolSignals.push(`input×${snapshot.textInputs}`);
  if (snapshot.selects > 0) toolSignals.push(`select×${snapshot.selects}`);
  if (snapshot.iframes > 0) toolSignals.push(`iframe×${snapshot.iframes}`);

  const signals = countToolSignals(snapshot);
  const contentChars = text.length;

  let coreUi: Analysis['coreUi'] = 'none';
  if (signals >= 1 || (snapshot.forms > 0 && snapshot.textInputs > 0)) coreUi = 'tool';
  else if (contentChars >= 700) coreUi = 'content';

  const { wall, signal } = detectLoginWall(snapshot);
  const paywall = PAYWALL_PATTERNS.some((p) => p.test(text));
  const apiKeyRequired = /(enter|add|provide|paste) your api key|api key (is )?required/i.test(text);

  return {
    loginWall: wall || paywall,
    wallSignal: signal ?? (paywall ? 'paywalled content' : null),
    apiKeyRequired,
    coreUi,
    toolSignals,
    contentChars,
    paywall,
  };
}

export type VerificationOutcome = 'verified' | 'pending' | 'rejected';

export interface Verdict {
  status: VerificationOutcome;
  reason: string;
  checks: {
    http: boolean;
    browser: boolean;
    noLoginWall: boolean;
    noApiKey: boolean;
    coreUiReachable: boolean;
  };
}

export function decideOutcome(
  snapshot: PageSnapshot,
  analysis: Analysis,
  opts: { browserLoaded: boolean; attempts: number; maxAttempts?: number },
): Verdict {
  const maxAttempts = opts.maxAttempts ?? 2;
  const networkFailure =
    snapshot.httpStatus === 0 ||
    snapshot.loadError !== undefined ||
    snapshot.httpStatus >= 500 ||
    snapshot.httpStatus === 429;

  const checks = {
    http: snapshot.httpStatus > 0 && snapshot.httpStatus < 400,
    browser: opts.browserLoaded,
    noLoginWall: !analysis.loginWall,
    noApiKey: !analysis.apiKeyRequired,
    coreUiReachable: analysis.coreUi !== 'none',
  };

  if (detectBotProtection(snapshot)) {
    return {
      status: 'pending',
      reason:
        opts.attempts >= maxAttempts
          ? 'Protected by a bot challenge; automated verification cannot see the real interface yet.'
          : 'Temporary bot challenge; scheduled for another attempt.',
      checks: { ...checks, browser: false },
    };
  }

  if (networkFailure) {
    return {
      status: 'pending',
      reason:
        opts.attempts >= maxAttempts
          ? 'The site could not be reached reliably; it will be retried on a later scan.'
          : 'Temporary network failure; queued for retry.',
      checks: { ...checks, http: false, browser: false },
    };
  }

  if (HARD_FAIL_STATUSES.has(snapshot.httpStatus)) {
    return {
      status: 'rejected',
      reason: `The site returned HTTP ${snapshot.httpStatus}, so its advertised tool is not available.`,
      checks,
    };
  }

  if (analysis.loginWall) {
    return {
      status: 'rejected',
      reason: `A mandatory access barrier was detected (${analysis.wallSignal ?? 'login wall'}).`,
      checks,
    };
  }

  if (analysis.apiKeyRequired) {
    return {
      status: 'rejected',
      reason: 'The core interface asks for an API key before it can be used.',
      checks,
    };
  }

  if (analysis.coreUi === 'none') {
    return {
      status: 'rejected',
      reason:
        'No usable interface or substantial content was reachable without an account; the page looks like a marketing shell.',
      checks,
    };
  }

  if (!checks.http && snapshot.httpStatus !== 0) {
    return {
      status: 'pending',
      reason: `Unexpected HTTP status ${snapshot.httpStatus}; queued for recheck.`,
      checks,
    };
  }

  const ui =
    analysis.coreUi === 'tool'
      ? `interactive interface detected (${analysis.toolSignals.slice(0, 3).join(', ')})`
      : `${analysis.contentChars.toLocaleString()} characters of readable content`;
  return {
    status: 'verified',
    reason: `Loaded over HTTP ${snapshot.httpStatus} with a clean browser profile; no login wall or API-key gate; ${ui}.`,
    checks,
  };
}

const PARKING_HOSTS = [
  'sedoparking.com',
  'parkingcrew.net',
  'bodis.com',
  'hugedomains.com',
  'afternic.com',
  'dan.com',
  'domainmarket.com',
  'buydomains.com',
  'parklogic.com',
  'above.com',
  'undeveloped.com',
  'sav.com',
];

const MULTI_LEVEL_SUFFIXES = new Set([
  'co.uk',
  'org.uk',
  'ac.uk',
  'gov.uk',
  'com.au',
  'net.au',
  'org.au',
  'co.jp',
  'co.nz',
  'co.za',
  'com.br',
  'com.mx',
  'com.tr',
  'co.in',
  'com.cn',
  'github.io',
  'pages.dev',
  'netlify.app',
  'vercel.app',
  'web.app',
]);

/** Approximate registrable domain: enough to catch redirects to another site. */
export function registrableDomain(hostname: string): string {
  const host = hostname.replace(/^www\./, '').toLowerCase();
  const parts = host.split('.');
  if (parts.length <= 2) return host;
  const lastTwo = parts.slice(-2).join('.');
  if (MULTI_LEVEL_SUFFIXES.has(lastTwo)) return parts.slice(-3).join('.');
  return lastTwo;
}

/**
 * Detects redirects that leave the advertised site entirely (domain sales pages,
 * parking hosts or a different product). Such a candidate must not be published
 * as if the original website had passed verification.
 */
export function detectSuspiciousRedirect(domain: string, finalUrl: string): string | null {
  let host: string;
  try {
    host = new URL(finalUrl).hostname.toLowerCase();
  } catch {
    return 'the final URL could not be parsed';
  }
  const cleanHost = host.replace(/^www\./, '');
  if (PARKING_HOSTS.some((parking) => cleanHost === parking || cleanHost.endsWith(`.${parking}`))) {
    return `redirected to a domain parking service (${cleanHost})`;
  }
  const expected = registrableDomain(domain);
  const actual = registrableDomain(cleanHost);
  if (expected && actual && expected !== actual) {
    return `redirected to a different domain (${cleanHost})`;
  }
  return null;
}
