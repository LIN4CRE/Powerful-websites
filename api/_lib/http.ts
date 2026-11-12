/**
 * Outbound HTTP for the serverless scanner: manual redirect hops (each one
 * re-validated), hard timeouts, a response-size cap and robots.txt awareness.
 */
import { assertPublicResolution, assertSafeHttpUrl, UnsafeUrlError } from '../../scripts/lib/safety';

export interface SafeFetchResult {
  ok: boolean;
  status: number;
  finalUrl: string;
  body: string;
  contentType: string;
  error?: string;
}

const USER_AGENT =
  'PowerfulWebsitesBot/1.1 (+https://github.com/LIN4CRE/Powerful-websites; no-account directory verification)';

const MAX_BYTES = 2_500_000;
const MAX_REDIRECTS = 5;

async function readCapped(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel().catch(() => {});
      break;
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total > MAX_BYTES ? 0 : total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(merged);
}

export async function safeFetch(
  rawUrl: string,
  options: { timeoutMs?: number; accept?: string; maxRedirects?: number } = {},
): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? 12_000;
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let current: URL;
  try {
    current = assertSafeHttpUrl(rawUrl);
  } catch (error) {
    clearTimeout(timer);
    return {
      ok: false,
      status: 0,
      finalUrl: rawUrl,
      body: '',
      contentType: '',
      error: error instanceof Error ? error.message : 'Unsafe URL',
    };
  }

  try {
    for (let hop = 0; hop <= maxRedirects; hop += 1) {
      await assertPublicResolution(current);
      const response = await fetch(current, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'user-agent': USER_AGENT,
          accept: options.accept ?? 'text/html,application/xhtml+xml',
        },
      });

      const location = response.headers.get('location');
      if (response.status >= 300 && response.status < 400 && location) {
        const next = new URL(location, current);
        assertSafeHttpUrl(next);
        current = next;
        continue;
      }

      const body = response.status === 204 ? '' : await readCapped(response);
      return {
        ok: response.ok,
        status: response.status,
        finalUrl: current.toString(),
        body,
        contentType: response.headers.get('content-type') ?? '',
      };
    }
    return {
      ok: false,
      status: 0,
      finalUrl: current.toString(),
      body: '',
      contentType: '',
      error: 'Too many redirects',
    };
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      return {
        ok: false,
        status: 0,
        finalUrl: current.toString(),
        body: '',
        contentType: '',
        error: error.message,
      };
    }
    const aborted = error instanceof Error && error.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      finalUrl: current.toString(),
      body: '',
      contentType: '',
      error: aborted ? `Timed out after ${timeoutMs} ms` : 'Network request failed',
    };
  } finally {
    clearTimeout(timer);
  }
}

/* -------------------------------------------------------------------------- */
/* robots.txt                                                                  */
/* -------------------------------------------------------------------------- */

const robotsCache = new Map<string, { rules: string[]; fetchedAt: number }>();
const ROBOTS_TTL_MS = 6 * 60 * 60 * 1000;

function parseDisallow(body: string): string[] {
  const rules: string[] = [];
  let applies = false;
  for (const line of body.split(/\r?\n/)) {
    const clean = line.split('#')[0]?.trim() ?? '';
    if (!clean) continue;
    const [rawKey, ...rest] = clean.split(':');
    const key = rawKey?.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (key === 'user-agent') applies = value === '*';
    else if (key === 'disallow' && applies && value) rules.push(value);
  }
  return rules;
}

/** Conservative robots.txt check; a failed fetch follows the existing policy of allowing. */
export async function isAllowedByRobots(rawUrl: string): Promise<{ allowed: boolean; reason?: string }> {
  const url = new URL(rawUrl);
  const origin = url.origin;
  const cached = robotsCache.get(origin);
  let rules = cached?.rules;

  if (!cached || Date.now() - cached.fetchedAt > ROBOTS_TTL_MS) {
    const result = await safeFetch(`${origin}/robots.txt`, {
      timeoutMs: 5000,
      accept: 'text/plain',
      maxRedirects: 2,
    });
    rules = result.ok ? parseDisallow(result.body) : [];
    robotsCache.set(origin, { rules, fetchedAt: Date.now() });
  }

  const path = `${url.pathname}${url.search}`;
  const blocked = (rules ?? []).find((rule) => rule !== '/' && path.startsWith(rule));
  if (blocked) return { allowed: false, reason: `robots.txt disallows ${blocked}` };
  return { allowed: true };
}
