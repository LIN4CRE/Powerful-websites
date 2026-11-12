import { chromium, type Browser } from 'playwright';
import type { VerificationRecord } from '../../src/lib/types';
import { fetchWithTimeout } from './http';
import { analyseSnapshot, decideOutcome, type PageSnapshot } from './verify-core';
import { sleep } from './util';

let sharedBrowser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!sharedBrowser || !sharedBrowser.isConnected()) {
    sharedBrowser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
  }
  return sharedBrowser;
}

export async function closeBrowser(): Promise<void> {
  if (sharedBrowser) {
    await sharedBrowser.close().catch(() => undefined);
    sharedBrowser = null;
  }
}

const REALISTIC_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

interface BrowserProbe {
  snapshot: PageSnapshot | null;
  loaded: boolean;
  error?: string;
}

/**
 * Opens the target in a brand-new, cookie-less browser context and measures the
 * real page. No stored cookies, no auth headers, no API credentials.
 */
async function probeInBrowser(url: string, timeoutMs = 35_000): Promise<BrowserProbe> {
  let browser: Browser;
  try {
    browser = await getBrowser();
  } catch (error) {
    return {
      snapshot: null,
      loaded: false,
      error: `browser unavailable: ${error instanceof Error ? error.message : 'unknown'}`,
    };
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    userAgent: REALISTIC_UA,
    locale: 'en-GB',
    timezoneId: 'UTC',
    ignoreHTTPSErrors: true,
    javaScriptEnabled: true,
    serviceWorkers: 'allow',
  });

  const page = await context.newPage();
  page.on('dialog', (dialog) => dialog.dismiss().catch(() => undefined));

  let response;
  let loadError: string | undefined;
  try {
    response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => undefined);
    await sleep(1200);
  } catch (error) {
    loadError = error instanceof Error ? error.message.split('\n')[0] : 'navigation failed';
  }

  try {
    const data = await page.evaluate(() => {
      const isVisible = (el: Element): boolean => {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
          return false;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 1 && rect.height > 1;
      };

      const visible = (selector: string): Element[] =>
        Array.from(document.querySelectorAll(selector)).filter(isVisible);

      const bodyText = (document.body?.innerText ?? '').slice(0, 20_000);
      const interactiveText = Array.from(
        document.querySelectorAll('a, button, [role="button"]'),
      )
        .slice(0, 250)
        .map((el) => (el.textContent ?? '').trim().toLowerCase())
        .join(' ');

      return {
        title: document.title ?? '',
        finalUrl: location.href,
        visibleText: bodyText,
        htmlLength: document.documentElement?.outerHTML?.length ?? 0,
        passwordFields: visible('input[type="password"]').length,
        textInputs: visible('input:not([type]), input[type="text"], input[type="search"], input[type="email"], input[type="url"], input[type="number"]').length,
        textareas: visible('textarea').length,
        canvases: visible('canvas').length,
        contentEditables: visible('[contenteditable="true"], [contenteditable=""]').length,
        fileInputs: document.querySelectorAll('input[type="file"]').length,
        selects: visible('select').length,
        forms: document.querySelectorAll('form').length,
        iframes: visible('iframe').length,
        hasSignInControl: /(sign in|log in|login|sign up|create account|register)/.test(
          interactiveText,
        ),
        botProtection:
          /just a moment|attention required|checking your browser|access denied|verify you are human/i.test(
            `${document.title} ${bodyText.slice(0, 1500)}`,
          ),
      };
    });

    const snapshot: PageSnapshot = {
      requestedUrl: url,
      finalUrl: data.finalUrl,
      httpStatus: response?.status() ?? 0,
      title: data.title,
      visibleText: data.visibleText,
      htmlLength: data.htmlLength,
      passwordFields: data.passwordFields,
      textInputs: data.textInputs,
      textareas: data.textareas,
      canvases: data.canvases,
      contentEditables: data.contentEditables,
      fileInputs: data.fileInputs,
      selects: data.selects,
      forms: data.forms,
      iframes: data.iframes,
      hasSignInControl: data.hasSignInControl,
      botProtection: data.botProtection,
      ...(loadError ? { loadError } : {}),
    };

    return { snapshot, loaded: Boolean(response) && !loadError };
  } catch (error) {
    return {
      snapshot: null,
      loaded: false,
      error: error instanceof Error ? error.message.split('\n')[0] : 'snapshot failed',
    };
  } finally {
    await context.close().catch(() => undefined);
  }
}

export interface VerificationResult {
  record: VerificationRecord;
  title: string;
}

/**
 * Verifies one URL using an HTTP preflight plus a real headless browser.
 * Transient failures are retried once before a final verdict is recorded.
 */
export async function verifyUrl(
  url: string,
  opts: { attemptsSoFar?: number; maxAttempts?: number; retryDelayMs?: number } = {},
): Promise<VerificationResult> {
  const started = Date.now();
  const maxAttempts = opts.maxAttempts ?? 2;
  let attempts = opts.attemptsSoFar ?? 0;
  let lastProbe: BrowserProbe | null = null;
  let http = await fetchWithTimeout(url, {
    timeoutMs: 20_000,
    retries: 0,
    cache: false,
    headers: { 'cache-control': 'no-cache' },
  });

  let probe = await probeInBrowser(url);
  lastProbe = probe;

  const snapshotFromProbe = probe.snapshot;
  const provisionalStatus =
    snapshotFromProbe?.httpStatus ?? (http.ok ? http.status : http.status);

  const isTransient =
    !probe.loaded ||
    provisionalStatus === 0 ||
    provisionalStatus === 429 ||
    provisionalStatus >= 500 ||
    !snapshotFromProbe;

  if (isTransient) {
    attempts += 1;
    await sleep(opts.retryDelayMs ?? 2500);
    http = await fetchWithTimeout(url, {
      timeoutMs: 20_000,
      retries: 1,
      cache: false,
      headers: { 'cache-control': 'no-cache' },
    });
    probe = await probeInBrowser(url);
    lastProbe = probe;
  }

  const finalSnapshot = lastProbe?.snapshot;
  const finalStatus = finalSnapshot?.httpStatus ?? (http.status || 0);
  const finalUrl = finalSnapshot?.finalUrl ?? http.finalUrl ?? url;

  const snapshot: PageSnapshot = finalSnapshot ?? {
    requestedUrl: url,
    finalUrl: http.finalUrl || url,
    httpStatus: http.status,
    title: '',
    visibleText: '',
    htmlLength: http.body.length,
    passwordFields: 0,
    textInputs: 0,
    textareas: 0,
    canvases: 0,
    contentEditables: 0,
    fileInputs: 0,
    selects: 0,
    forms: 0,
    iframes: 0,
    hasSignInControl: false,
    botProtection: false,
    loadError: lastProbe?.error ?? http.error ?? 'browser could not render the page',
  };

  const analysis = analyseSnapshot(snapshot);
  const verdict = decideOutcome(snapshot, analysis, {
    browserLoaded: Boolean(finalSnapshot) && !snapshot.loadError,
    attempts,
    maxAttempts,
  });

  const evidenceParts = [
    `HTTP ${finalStatus || 'no response'}`,
    `final URL ${finalUrl}`,
    verdict.checks.browser ? 'rendered in a fresh headless Chromium profile' : 'browser render failed',
    verdict.checks.noLoginWall ? 'no login wall detected' : `barrier: ${analysis.wallSignal ?? 'unknown'}`,
    analysis.toolSignals.length > 0
      ? `interactive elements: ${analysis.toolSignals.join(', ')}`
      : `${analysis.contentChars} chars of visible content`,
  ];
  if (attempts > 0) evidenceParts.push('retried after a transient failure');

  const record: VerificationRecord = {
    status: verdict.status,
    method: 'http+browser',
    checks: {
      ...verdict.checks,
      ...(attempts > 0 ? { retried: true } : {}),
    },
    evidence: `${verdict.reason} (${evidenceParts.join('; ')}).`,
    httpStatus: finalStatus,
    finalUrl: finalUrl.startsWith('http') ? finalUrl : url,
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    attempts: attempts + 1,
  };

  return { record, title: snapshot.title };
}
