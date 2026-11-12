/**
 * Serverless verification: an HTTP + DOM review of the rendered document.
 *
 * This is deliberately NOT reported as a browser verification. The decision
 * logic is the same pure `decideOutcome` used by the Playwright verifier, but
 * `browserLoaded` stays false, so records carry `method: "reader"` and the UI
 * labels them "Checked" rather than "Verified".
 */
import * as cheerio from 'cheerio';
import {
  analyseSnapshot,
  decideOutcome,
  detectSuspiciousRedirect,
  type PageSnapshot,
} from '../../scripts/lib/verify-core';
import { safeFetch } from './http';

export interface DocumentCheck {
  status: 'verified' | 'pending' | 'rejected';
  reason: string;
  evidence: string;
  httpStatus: number;
  finalUrl: string;
  checks: {
    http: boolean;
    browser: boolean;
    noLoginWall: boolean;
    noApiKey: boolean;
    coreUiReachable: boolean;
  };
  attempts: number;
}

const BOT_MARKERS =
  /just a moment|attention required|checking your browser|enable javascript and cookies|cf-chl|captcha-delivery/i;

export function buildSnapshot(
  html: string,
  requestedUrl: string,
  finalUrl: string,
  httpStatus: number,
  loadError?: string,
): PageSnapshot {
  const $ = cheerio.load(html);
  $('script, style, noscript, template').remove();

  const visibleText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 20_000);
  const signInText = $('a, button, [role="button"]')
    .map((_, element) => $(element).text())
    .get()
    .join(' ')
    .toLowerCase();

  return {
    requestedUrl,
    finalUrl,
    httpStatus,
    title: $('title').first().text().trim().slice(0, 200),
    visibleText,
    htmlLength: html.length,
    passwordFields: $('input[type="password"]').length,
    textInputs: $('input[type="text"], input[type="email"], input[type="search"], input:not([type])')
      .length,
    textareas: $('textarea').length,
    canvases: $('canvas').length,
    contentEditables: $('[contenteditable="true"], [contenteditable=""]').length,
    fileInputs: $('input[type="file"]').length,
    selects: $('select').length,
    forms: $('form').length,
    iframes: $('iframe').length,
    hasSignInControl: /sign in|log in|login|sign up|create account|register/.test(signInText),
    botProtection: BOT_MARKERS.test(`${$('title').text()} ${visibleText.slice(0, 4000)}`),
    ...(loadError ? { loadError } : {}),
  };
}

export async function documentVerify(
  url: string,
  domain: string,
  attempts = 1,
): Promise<DocumentCheck> {
  const fetched = await safeFetch(url, { timeoutMs: 12_000 });

  const snapshot = buildSnapshot(
    fetched.body,
    url,
    fetched.finalUrl,
    fetched.status,
    fetched.error,
  );

  const redirect = detectSuspiciousRedirect(domain, fetched.finalUrl);
  if (redirect) {
    return {
      status: 'pending',
      reason: `Verification reached a different destination: ${redirect}. Held back for review.`,
      evidence: `Document review followed ${url} to ${fetched.finalUrl} (HTTP ${fetched.status}); destination differs from ${domain}.`,
      httpStatus: fetched.status,
      finalUrl: fetched.finalUrl,
      checks: {
        http: fetched.status > 0 && fetched.status < 400,
        browser: false,
        noLoginWall: true,
        noApiKey: true,
        coreUiReachable: false,
      },
      attempts,
    };
  }

  const analysis = analyseSnapshot(snapshot);
  const verdict = decideOutcome(snapshot, analysis, { browserLoaded: false, attempts, maxAttempts: 2 });

  const toolSignals = analysis.toolSignals.length;
  const evidence = [
    `Server-side document review (HTTP ${fetched.status || 'no response'})`,
    `final URL ${fetched.finalUrl}`,
    `${toolSignals} tool signal${toolSignals === 1 ? '' : 's'}`,
    analysis.loginWall ? 'login wall detected' : 'no login wall detected',
    analysis.apiKeyRequired ? 'API key required' : 'no API key required',
    fetched.error ? `error: ${fetched.error}` : null,
  ]
    .filter(Boolean)
    .join('; ');

  return {
    status: verdict.status,
    reason: verdict.reason,
    evidence: `${evidence}.`,
    httpStatus: fetched.status,
    finalUrl: fetched.finalUrl,
    checks: verdict.checks,
    attempts,
  };
}
