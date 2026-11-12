import { describe, expect, it } from 'vitest';
import { analyseSnapshot, decideOutcome } from '../../scripts/lib/verify-core';
import { buildSnapshot } from '../../api/_lib/verify-document';

const URL = 'https://example.com/';

function classify(html: string, status = 200) {
  const snapshot = buildSnapshot(html, URL, URL, status);
  const analysis = analyseSnapshot(snapshot);
  return { snapshot, analysis, verdict: decideOutcome(snapshot, analysis, { browserLoaded: false, attempts: 1 }) };
}

describe('serverless document verification', () => {
  it('accepts a page whose tool interface is reachable without an account', () => {
    const html = `<html><head><title>Editor</title></head><body>
      <h1>Draw something</h1>
      <canvas width="800" height="600"></canvas>
      <div contenteditable="true">Type here</div>
      <button>Download</button>
      <a href="/pricing">Pricing</a>
    </body></html>`;
    const { verdict, snapshot } = classify(html);
    expect(snapshot.canvases).toBe(1);
    expect(snapshot.contentEditables).toBe(1);
    expect(verdict.status).toBe('verified');
  });

  it('refuses a mandatory login wall', () => {
    const html = `<html><head><title>Sign in</title></head><body>
      <p>Sign in to continue. You must create an account to use this tool.</p>
      <form><input type="password" name="pw"><button>Log in</button></form>
    </body></html>`;
    const { verdict } = classify(html);
    expect(verdict.status).toBe('rejected');
    expect(verdict.checks.noLoginWall).toBe(false);
  });

  it('keeps unreachable sites pending instead of passing them', () => {
    const { verdict } = classify('', 0);
    expect(verdict.status).toBe('pending');
    expect(verdict.checks.http).toBe(false);
  });

  it('never claims a browser check in the serverless path', () => {
    const html = `<html><body><canvas></canvas><p>${'tool '.repeat(200)}</p></body></html>`;
    const { verdict } = classify(html);
    expect(verdict.checks.browser).toBe(false);
  });
});
