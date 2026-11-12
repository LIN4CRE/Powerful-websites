/**
 * SCOUT — discovers candidate websites from public sources.
 *
 * Design rules:
 *  - one failing source never stops the run (each source is isolated);
 *  - sources are declarative (data/sources.json), so new ones need no code;
 *  - respectful crawling: robots.txt is honoured for HTML pages, responses are
 *    cached, GitHub API calls use the provided token and stay well under rate
 *    limits, and every source has an item cap.
 */
import type { Candidate, DiscoverySource, SourceHealthEntry } from '../src/lib/types.js';
import { inferCategory, descriptionFromLinkText, deriveTags, idFor } from './lib/classify.js';
import { extractFeedEntries, extractHtmlLinks, extractMarkdownLinks, type ExtractedLink } from './lib/extract.js';
import { fetchWithTimeout, isAllowedByRobots } from './lib/http.js';
import { loadCandidates, loadSites, loadSources, saveCandidates } from './lib/state.js';
import {
  domainOf,
  isUsefulExternalUrl,
  mapLimit,
  normalizeUrl,
  nowIso,
  slugify,
  truncate,
  writeJson,
  CACHE_DIR,
} from './lib/util.js';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? '';

interface ScoutOptions {
  maxNewCandidates?: number;
  maxPerSource?: number;
  dryRun?: boolean;
}

export interface ScoutReport {
  health: SourceHealthEntry[];
  added: Candidate[];
  duplicates: number;
  totalConsidered: number;
}

async function githubJson<T>(url: string): Promise<T | null> {
  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  };
  if (GITHUB_TOKEN) headers.authorization = `Bearer ${GITHUB_TOKEN}`;
  const res = await fetchWithTimeout(url, { headers, retries: 1, cache: true });
  if (!res.ok) return null;
  try {
    return JSON.parse(res.body) as T;
  } catch {
    return null;
  }
}

async function githubReadme(owner: string, repo: string): Promise<string | null> {
  const headers: Record<string, string> = { accept: 'application/vnd.github.raw' };
  if (GITHUB_TOKEN) headers.authorization = `Bearer ${GITHUB_TOKEN}`;
  const res = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers,
    retries: 1,
    cache: true,
  });
  if (res.ok && res.body.length > 200) return res.body;
  for (const name of ['README.md', 'readme.md', 'README.rst']) {
    const raw = await fetchWithTimeout(
      `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${name}`,
      { retries: 0, cache: true },
    );
    if (raw.ok && raw.body.length > 200) return raw.body;
  }
  return null;
}

function parseRepo(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'github.com') return null;
    const [owner, repo] = parsed.pathname.replace(/^\//, '').split('/');
    if (!owner || !repo) return null;
    return { owner, repo: repo.replace(/\.git$/, '') };
  } catch {
    return null;
  }
}

function linksFromReadme(markdown: string): ExtractedLink[] {
  return extractMarkdownLinks(markdown);
}

async function collectGitHubAwesome(source: DiscoverySource): Promise<ExtractedLink[]> {
  const repo = parseRepo(source.url);
  if (!repo) return [];
  const readme = await githubReadme(repo.owner, repo.repo);
  if (!readme) throw new Error('README could not be fetched');
  return linksFromReadme(readme);
}

interface GitHubSearchRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  topics?: string[];
  stargazers_count?: number;
  archived?: boolean;
}

async function collectGitHubSearch(source: DiscoverySource): Promise<ExtractedLink[]> {
  const params = new URLSearchParams({
    sort: 'stars',
    order: 'desc',
    per_page: String(Math.min(source.maxItems ?? 10, 30)),
    ...(source.query ?? {}),
  });
  const search = await githubJson<{ items: GitHubSearchRepo[] }>(
    `https://api.github.com/search/repositories?${params.toString()}`,
  );
  if (!search?.items) throw new Error('GitHub repository search failed');

  const links: ExtractedLink[] = [];
  const repos = search.items.filter((repo) => !repo.archived).slice(0, 8);

  await mapLimit(repos, 3, async (repo) => {
    const [owner, name] = repo.full_name.split('/');
    if (!owner || !name) return;
    const readme = await githubReadme(owner, name).catch(() => null);
    if (!readme) return;
    // Repos that link out to a hosted app are the useful ones; raw README links
    // are filtered by isUsefulExternalUrl later.
    links.push(...linksFromReadme(readme).slice(0, 60));
  });

  return links;
}

async function collectFeed(source: DiscoverySource): Promise<ExtractedLink[]> {
  const res = await fetchWithTimeout(source.url, { retries: 1 });
  if (!res.ok) throw new Error(`feed returned HTTP ${res.status}`);
  const entries = extractFeedEntries(res.body);
  return entries.map((entry) => ({
    name: entry.title,
    url: normalizeUrl(entry.link) ?? entry.link,
    description: entry.description,
  }));
}

async function collectHtml(source: DiscoverySource): Promise<ExtractedLink[]> {
  const allowed = await isAllowedByRobots(source.url);
  if (!allowed) throw new Error('robots.txt disallows this page');
  const res = await fetchWithTimeout(source.url, { retries: 1 });
  if (!res.ok) throw new Error(`page returned HTTP ${res.status}`);
  return extractHtmlLinks(res.body, source.url, source.selector);
}

async function collectSource(source: DiscoverySource): Promise<ExtractedLink[]> {
  switch (source.type) {
    case 'github-awesome':
    case 'no-signup-list':
      return collectGitHubAwesome(source);
    case 'github-search':
      return collectGitHubSearch(source);
    case 'rss':
    case 'atom':
      return collectFeed(source);
    case 'html-links':
      return collectHtml(source);
    default:
      return [];
  }
}

function uniqueId(base: string, taken: Set<string>): string {
  let id = slugify(base);
  if (!id) id = 'site';
  let suffix = 1;
  let candidate = id;
  while (taken.has(candidate)) {
    suffix += 1;
    candidate = `${id}-${suffix}`;
  }
  taken.add(candidate);
  return candidate;
}

/**
 * Runs every enabled source, isolates failures and appends new candidates.
 */
export async function runScout(options: ScoutOptions = {}): Promise<ScoutReport> {
  const maxNew = options.maxNewCandidates ?? 24;
  const maxPerSource = options.maxPerSource ?? 12;
  const [sources, sites, candidates] = await Promise.all([
    loadSources(),
    loadSites(),
    loadCandidates(),
  ]);

  const knownDomains = new Set<string>([
    ...sites.map((site) => site.domain),
    ...candidates.map((candidate) => candidate.domain),
  ]);
  const usedIds = new Set<string>([
    ...sites.map((site) => site.id),
    ...candidates.map((candidate) => candidate.id),
  ]);

  const health: SourceHealthEntry[] = [];
  const fresh: Candidate[] = [];
  const freshDomains = new Set<string>();
  let duplicates = 0;
  let totalConsidered = 0;

  const enabled = sources.filter((source) => source.enabled);
  const startedAll = Date.now();

  await mapLimit(enabled, 3, async (source) => {
    const started = Date.now();
    try {
      const links = await collectSource(source);
      totalConsidered += links.length;
      let used = 0;

      for (const link of links) {
        if (used >= Math.min(maxPerSource, source.maxItems ?? maxPerSource)) break;
        const url = normalizeUrl(link.url);
        if (!url || !isUsefulExternalUrl(url)) continue;
        const domain = domainOf(url);
        if (!domain) continue;
        const name = truncate(link.name.replace(/[*_`#]/g, '').trim(), 70);
        if (!name || name.length < 2) continue;
        if (knownDomains.has(domain) || freshDomains.has(domain)) {
          duplicates += 1;
          continue;
        }
        if (fresh.length >= maxNew) break;

        const description = descriptionFromLinkText(name, link.description);
        const category = source.category ?? inferCategory(`${name} ${description}`);
        const tags = [...new Set([...(source.tags ?? []), ...deriveTags(name, description, 4)])].slice(0, 6);
        const id = uniqueId(idFor(name, domain), usedIds);

        freshDomains.add(domain);
        used += 1;
        fresh.push({
          id,
          name,
          url,
          domain,
          description,
          category,
          tags,
          suggestedBy: source.name,
          discoverySource: source.id,
          dateDiscovered: nowIso(),
          status: 'pending',
          attempts: 0,
          lastAttemptAt: null,
          verification: null,
        });
      }

      health.push({
        id: source.id,
        name: source.name,
        type: source.type,
        status: 'ok',
        items: used,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      health.push({
        id: source.id,
        name: source.name,
        type: source.type,
        status: 'failed',
        items: 0,
        durationMs: Date.now() - started,
        error: truncate(error instanceof Error ? error.message : 'unknown error', 180),
      });
    }
  });

  // Refresh the cache index so operators can inspect what was fetched.
  await writeJson(path.join(CACHE_DIR, 'scout-last-run.json'), {
    ranAt: nowIso(),
    durationMs: Date.now() - startedAll,
    sources: health,
    considered: totalConsidered,
    duplicates,
    added: fresh.map((c) => ({ name: c.name, url: c.url })),
  }).catch(() => undefined);

  if (!options.dryRun && fresh.length > 0) {
    await saveCandidates([...candidates, ...fresh]);
  }

  return { health, added: fresh, duplicates, totalConsidered };
}

/* ── CLI ─────────────────────────────────────────────────────────────────── */

const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) {
  runScout({ maxNewCandidates: Number(process.env.SCOUT_MAX_NEW ?? 24) })
    .then((report) => {
      const ok = report.health.filter((h) => h.status === 'ok').length;
      console.log(
        `SCOUT: ${report.added.length} new candidates from ${ok}/${report.health.length} sources ` +
          `(${report.duplicates} duplicate domains skipped, ${report.totalConsidered} links considered).`,
      );
      for (const entry of report.health) {
        if (entry.status === 'failed') console.warn(`  ✗ ${entry.name}: ${entry.error}`);
      }
      for (const candidate of report.added.slice(0, 10)) {
        console.log(`  + ${candidate.name} — ${candidate.url}`);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('SCOUT failed:', error);
      process.exit(1);
    });
}
