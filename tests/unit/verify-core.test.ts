import { describe, expect, it } from 'vitest';
import {
  analyseSnapshot,
  decideOutcome,
  detectLoginWall,
  detectSuspiciousRedirect,
  registrableDomain,
  type PageSnapshot,
} from '../../scripts/lib/verify-core';

function snapshot(overrides: Partial<PageSnapshot> = {}): PageSnapshot {
  return {
    requestedUrl: 'https://tool.example',
    finalUrl: 'https://tool.example',
    httpStatus: 200,
    title: 'Tool',
    visibleText:
      'A free online utility for converting and compressing files. Drop a file to begin. Everything runs locally in your browser and nothing is uploaded.',
    htmlLength: 24_000,
    passwordFields: 0,
    textInputs: 2,
    textareas: 0,
    canvases: 1,
    contentEditables: 0,
    fileInputs: 1,
    selects: 1,
    forms: 1,
    iframes: 0,
    hasSignInControl: true,
    botProtection: false,
    ...overrides,
  };
}

function verdict(overrides: Partial<PageSnapshot> = {}, attempts = 0) {
  const snap = snapshot(overrides);
  return decideOutcome(snap, analyseSnapshot(snap), { browserLoaded: true, attempts });
}

describe('login wall detection', () => {
  it('does not flag a tool page that merely links to a login page', () => {
    const result = detectLoginWall(snapshot({ hasSignInControl: true }));
    expect(result.wall).toBe(false);
  });

  it('flags a short page whose only content is an authentication form', () => {
    const result = detectLoginWall(
      snapshot({
        visibleText: 'Sign in to your account. Email Password Forgot your password? Log in',
        passwordFields: 1,
        textInputs: 2,
        canvases: 0,
        fileInputs: 0,
        selects: 0,
      }),
    );
    expect(result.wall).toBe(true);
  });

  it('flags explicit "create an account to continue" gates', () => {
    const result = verdict({
      visibleText:
        'Create a free account to continue using this converter. Sign up with email or Google. It only takes a minute and unlocks every tool.',
      textInputs: 2,
      canvases: 0,
      fileInputs: 0,
      selects: 0,
    });
    expect(result.status).toBe('rejected');
    expect(result.reason).toContain('barrier');
    expect(result.checks.noLoginWall).toBe(false);
  });

  it('does not flag a long marketing page that mentions sign-in in a pricing footnote', () => {
    const filler =
      'Our platform helps teams collaborate on documents, images and data. '.repeat(60) +
      'Sign in to continue on your account page. ';
    const result = verdict({ visibleText: filler });
    expect(result.checks.noLoginWall).toBe(true);
    expect(result.status).toBe('verified');
  });

  it('rejects email verification gates', () => {
    const result = verdict({
      visibleText: 'Verify your email to continue. We sent a link to your inbox. Resend email.',
      textInputs: 0,
      canvases: 0,
      fileInputs: 0,
      selects: 0,
      textareas: 0,
    });
    expect(result.status).toBe('rejected');
  });

  it('rejects subscription-only gates', () => {
    const result = verdict({
      visibleText: 'Subscribe to continue reading this story. Already a member? Sign in.',
      textInputs: 0,
      canvases: 0,
      fileInputs: 0,
      selects: 0,
      textareas: 0,
    });
    expect(result.status).toBe('rejected');
  });
});

describe('API keys', () => {
  it('rejects a tool that asks for an API key before use', () => {
    const result = verdict({
      visibleText:
        'To use this service, enter your API key below. API key required for all requests. Manage keys in your dashboard.',
      textInputs: 1,
      forms: 1,
      canvases: 0,
      fileInputs: 0,
      selects: 0,
    });
    expect(result.status).toBe('rejected');
    expect(result.checks.noApiKey).toBe(false);
  });
});

describe('reachability decisions', () => {
  it('verifies a working tool page', () => {
    const result = verdict();
    expect(result.status).toBe('verified');
    expect(result.checks).toMatchObject({
      http: true,
      browser: true,
      noLoginWall: true,
      noApiKey: true,
      coreUiReachable: true,
    });
  });

  it('verifies a content page without an interactive tool', () => {
    const result = verdict({
      textInputs: 0,
      canvases: 0,
      fileInputs: 0,
      selects: 0,
      textareas: 0,
      forms: 0,
      visibleText: 'Reference material. '.repeat(80),
    });
    expect(result.status).toBe('verified');
  });

  it('rejects an empty marketing shell with no interface', () => {
    const result = verdict({
      textInputs: 0,
      canvases: 0,
      fileInputs: 0,
      selects: 0,
      textareas: 0,
      forms: 0,
      visibleText: 'Coming soon. Join the waitlist.',
    });
    expect(result.status).toBe('rejected');
  });

  it('rejects missing pages', () => {
    expect(verdict({ httpStatus: 404 }).status).toBe('rejected');
    expect(verdict({ httpStatus: 410 }).status).toBe('rejected');
  });

  it('keeps a 403 bot challenge pending rather than rejecting it', () => {
    const result = verdict({
      httpStatus: 403,
      htmlLength: 1200,
      visibleText: 'Checking your browser before accessing the site.',
    });
    expect(result.status).toBe('pending');
  });

  it('keeps server errors pending so they can be retried', () => {
    expect(verdict({ httpStatus: 503 }).status).toBe('pending');
    expect(verdict({ httpStatus: 0 }).status).toBe('pending');
  });

  it('keeps timeouts pending', () => {
    const snap = snapshot({ loadError: 'net::ERR_TIMED_OUT' });
    const result = decideOutcome(snap, analyseSnapshot(snap), { browserLoaded: false, attempts: 1 });
    expect(result.status).toBe('pending');
  });
});

describe('analysis details', () => {
  it('records the interactive surfaces it found as evidence', () => {
    const analysis = analyseSnapshot(snapshot());
    expect(analysis.coreUi).toBe('tool');
    expect(analysis.toolSignals.join(' ')).toContain('canvas');
    expect(analysis.toolSignals.join(' ')).toContain('file-input');
  });

  it('measures readable content for content-only pages', () => {
    const analysis = analyseSnapshot(
      snapshot({
        visibleText: 'x'.repeat(900),
        textInputs: 0,
        canvases: 0,
        fileInputs: 0,
        selects: 0,
        textareas: 0,
        forms: 0,
      }),
    );
    expect(analysis.coreUi).toBe('content');
    expect(analysis.contentChars).toBeGreaterThan(700);
  });
});


describe('redirect safety', () => {
  it('accepts www and subdomain redirects', () => {
    expect(detectSuspiciousRedirect('squoosh.app', 'https://www.squoosh.app/')).toBeNull();
    expect(detectSuspiciousRedirect('example.co.uk', 'https://app.example.co.uk/tool')).toBeNull();
  });

  it('flags redirects to another domain', () => {
    expect(detectSuspiciousRedirect('oldtld.example', 'https://newproduct.com')).toMatch(/different domain/);
  });

  it('flags parking services', () => {
    expect(detectSuspiciousRedirect('example.com', 'https://example.com.sedoparking.com/')).toMatch(/parking/);
  });

  it('computes registrable domains for multi-level suffixes', () => {
    expect(registrableDomain('www.example.co.uk')).toBe('example.co.uk');
    expect(registrableDomain('foo.github.io')).toBe('foo.github.io');
    expect(registrableDomain('tool.example.com')).toBe('example.com');
  });
});
