import { promises as fs } from 'node:fs';
import path from 'node:path';
import { CACHE_DIR, ensureDir, sleep } from './util';

export const USER_AGENT =
  'PowerfulWebsitesBot/1.0 (+https://github.com/LIN4CRE/Powerful-websites; directory verification; contact via GitHub issues)';

const DEFAULT_TIMEOUT = 20_000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface CacheEntry {
  url: string;
  etag?: string;
  lastModified?: string;
  body?: string;
  fetchedAt: number;
  status: number;
}

export interface FetchResult {
  ok: boolean;
  status: number;
  url: string;
  finalUrl: string;
  body: string;
  headers: Headers;
  redirects: string[];
  error?: string;
  durationMs: number;
}

function cacheFile(url: string): string {
  const safe = Buffer.from(url).toString('base64url').slice(0, 120);
  return path.join(CACHE_DIR, 'http', `${safe}.json`);
}

async function readCache(url: string): Promise<CacheEntry | null> {
  try {
    const raw = await fs.readFile(cacheFile(url), 'utf8');
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

async function writeCache(entry: CacheEntry): Promise<void> {
  await ensureDir(path.join(CACHE_DIR, 'http'));
  await fs.writeFile(cacheFile(entry.url), JSON.stringify(entry), 'utf8');
}

/**
 * Fetches a URL with a timeout, a descriptive user agent, conditional request
 * headers and an on-disk cache. Discovery sources are polite: cached responses
 * are reused for six hours and 429/5xx responses trigger a short backoff.
 */
export async function fetchWithTimeout(
  url: string,
  options: {
    timeoutMs?: number;
    headers?: Record<string, string>;
    method?: 'GET' | 'HEAD';
    retries?: number;
    cache?: boolean;
    /** Only use the cache when it is younger than this. */
    maxCacheAgeMs?: number;
  } = {},
): Promise<FetchResult> {
  const {
    timeoutMs = DEFAULT_TIMEOUT,
    headers = {},
    method = 'GET',
    retries = 1,
    cache = true,
    maxCacheAgeMs = CACHE_TTL_MS,
  } = options;

  const cached = cache ? await readCache(url) : null;
  if (cached && method === 'GET' && Date.now() - cached.fetchedAt < maxCacheAgeMs) {
    return {
      ok: cached.status >= 200 && cached.status < 400,
      status: cached.status,
      url,
      finalUrl: url,
      body: cached.body ?? '',
      headers: new Headers(),
      redirects: [],
      durationMs: 0,
    };
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'user-agent': USER_AGENT,
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'en-GB,en;q=0.9',
          ...(cached?.etag ? { 'if-none-match': cached.etag } : {}),
          ...(cached?.lastModified ? { 'if-modified-since': cached.lastModified } : {}),
          ...headers,
        },
      });
      clearTimeout(timer);

      if (response.status === 304 && cached) {
        cached.fetchedAt = Date.now();
        await writeCache(cached);
        return {
          ok: true,
          status: 200,
          url,
          finalUrl: response.url || url,
          body: cached.body ?? '',
          headers: response.headers,
          redirects: [],
          durationMs: Date.now() - started,
        };
      }

      const body = method === 'GET' ? await response.text() : '';
      const result: FetchResult = {
        ok: response.ok,
        status: response.status,
        url,
        finalUrl: response.url || url,
        body,
        headers: response.headers,
        redirects: response.url && response.url !== url ? [response.url] : [],
        durationMs: Date.now() - started,
      };

      if (method === 'GET' && response.ok) {
        await writeCache({
          url,
          etag: response.headers.get('etag') ?? undefined,
          lastModified: response.headers.get('last-modified') ?? undefined,
          body,
          fetchedAt: Date.now(),
          status: response.status,
        });
      }

      if (response.status === 429 || response.status >= 500) {
        const retryAfter = Number(response.headers.get('retry-after') ?? 0);
        if (attempt < retries) {
          await sleep(Math.min(10_000, (retryAfter || 2) * 1000 * (attempt + 1)));
          continue;
        }
      }

      return result;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt < retries) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
    }
  }

  return {
    ok: false,
    status: 0,
    url,
    finalUrl: url,
    body: '',
    headers: new Headers(),
    redirects: [],
    error: lastError instanceof Error ? lastError.message : 'network error',
    durationMs: 0,
  };
}

const robotsCache = new Map<string, { allowed: (pathname: string) => boolean; fetchedAt: number }>();

/**
 * Minimal robots.txt support: parses `User-agent: *` groups for Disallow rules.
 * Sources that disallow crawling are skipped instead of being scraped.
 */
export async function isAllowedByRobots(url: string): Promise<boolean> {
  try {
    const target = new URL(url);
    const origin = target.origin;
    const cached = robotsCache.get(origin);
    let rules = cached;
    if (!rules || Date.now() - rules.fetchedAt > 24 * 60 * 60 * 1000) {
      const res = await fetchWithTimeout(`${origin}/robots.txt`, {
        timeoutMs: 8000,
        retries: 0,
        cache: false,
      });
      const lines = res.ok ? res.body.split(/\r?\n/) : [];
      const disallow: string[] = [];
      let applies = false;
      for (const line of lines) {
        const clean = line.split('#')[0]?.trim() ?? '';
        if (!clean) continue;
        const [rawKey, ...rest] = clean.split(':');
        const key = (rawKey ?? '').toLowerCase().trim();
        const value = rest.join(':').trim();
        if (key === 'user-agent') applies = value === '*' || value.toLowerCase().includes('powerfulwebsites');
        else if (key === 'disallow' && applies && value) disallow.push(value);
      }
      rules = {
        allowed: (pathname: string) => !disallow.some((rule) => pathname.startsWith(rule)),
        fetchedAt: Date.now(),
      };
      robotsCache.set(origin, rules);
    }
    return rules.allowed(target.pathname || '/');
  } catch {
    return true;
  }
}
