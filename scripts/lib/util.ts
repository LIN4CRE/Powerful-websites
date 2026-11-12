import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const DATA_DIR = path.join(ROOT, 'data');
export const CACHE_DIR = path.join(ROOT, '.cache');

export function dataPath(...parts: string[]): string {
  return path.join(DATA_DIR, ...parts);
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
    throw error;
  }
}

export async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fs.rename(tmp, file);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'referrer',
  'fbclid',
  'gclid',
  'mc_cid',
  'mc_eid',
];

/** Normalises a candidate URL: https, no tracking parameters, no trailing slash. */
export function normalizeUrl(input: string): string | null {
  let raw = input.trim();
  if (!raw) return null;
  if (!/^[a-z]+:\/\//i.test(raw)) raw = `https://${raw.replace(/^\/+/, '')}`;
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    url.protocol = 'https:';
    for (const key of TRACKING_PARAMS) url.searchParams.delete(key);
    let str = url.toString();
    str = str.replace(/\/$/, '');
    return str;
  } catch {
    return null;
  }
}

export function domainOf(input: string): string {
  try {
    return new URL(input).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

/** Rejects link targets that are never useful directory entries. */
export function isUsefulExternalUrl(url: string): boolean {
  const domain = domainOf(url);
  if (!domain || !domain.includes('.')) return false;
  const blocked = [
    'github.com',
    'githubusercontent.com',
    'npmjs.com',
    'pypi.org',
    'youtube.com',
    'youtu.be',
    'twitter.com',
    'x.com',
    'facebook.com',
    'instagram.com',
    'linkedin.com',
    'reddit.com',
    'discord.gg',
    't.me',
    'medium.com',
    'wikipedia.org',
    'amazon.com',
    'apple.com',
    'play.google.com',
    'apps.apple.com',
    'creativecommons.org',
    'opensource.org',
    'choosealicense.com',
    'shields.io',
    'badgen.net',
    'travis-ci.org',
    'circleci.com',
    'gitlab.com',
    'bitbucket.org',
    'sourceforge.net',
    'gitter.im',
    'patreon.com',
    'opencollective.com',
    'ko-fi.com',
    'buymeacoffee.com',
    'sponsor',
    'made-with-react',
    'stackoverflow.com',
    'stackexchange.com',
    'news.ycombinator.com',
  ];
  if (blocked.some((b) => domain === b || domain.endsWith(`.${b}`))) return false;
  return true;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      const item = items[index] as T;
      results[index] = await fn(item, index);
    }
  });

  await Promise.all(workers);
  return results;
}

export function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : max - 1)}…`;
}

export function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function firstSentence(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const match = clean.match(/^(.{25,190}?[.!?])(\s|$)/);
  return match ? (match[1] as string) : truncate(clean, 170);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}
