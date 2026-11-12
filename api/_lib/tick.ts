/**
 * One bounded scheduled tick: SCOUT → VERIFIER → CURATOR.
 *
 * Vercel Hobby functions are limited to 300 s, so each invocation does a small,
 * resumable slice of the work and persists progress through the GitHub Contents
 * API. Without a write token the tick runs read-only and says so.
 */
import type {
  Candidate,
  ScanMetadata,
  Site,
  SourceHealthEntry,
  VerificationRecord,
} from '../../src/lib/types';
import { deriveTags, descriptionFromLinkText, idFor, inferCategory } from '../../scripts/lib/classify';
import { extractFeedEntries, extractHtmlLinks, extractMarkdownLinks } from '../../scripts/lib/extract';
import { assertSafeHttpUrl } from '../../scripts/lib/safety';
import { loadRawFiles } from './dataset';
import { isAllowedByRobots, safeFetch } from './http';
import { canPersist, writeRepoJson } from './repo';
import { documentVerify } from './verify-document';

const REPOSITORY_URL = 'https://github.com/LIN4CRE/Powerful-websites';
const VERIFY_BUDGET_MS = 210_000;

export interface TickSummary {
  mode: 'persisted' | 'read-only';
  durationMs: number;
  scout: { sourcesTried: number; discovered: number; failures: number };
  verifier: { tested: number; verified: number; rejected: number; pending: number };
  curator: { published: number; duplicatesRemoved: number };
  persisted: { committed: string[]; unchanged: string[]; error?: string };
  notes: string[];
}

interface TickOptions {
  maxVerify?: number;
  maxNewCandidates?: number;
}

function domainOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
}

function slug(name: string, domain: string): string {
  return idFor(name, domain);
}

async function readSource(source: {
  id: string;
  type: string;
  url: string;
  selector?: string;
}): Promise<{ links: { url: string; text: string }[]; error?: string }> {
  if (source.type === 'github-awesome' || source.type === 'github-search') {
    const match = source.url.match(/github\.com\/([^/]+)\/([^/#?]+)/);
    if (!match) return { links: [], error: 'Unsupported GitHub URL' };
    const [, owner, repo] = match;
    const raw = await safeFetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README.md`,
      { accept: 'text/plain', timeoutMs: 10_000 },
    );
    if (!raw.ok) return { links: [], error: `README fetch failed (${raw.status || raw.error})` };
    return {
      links: extractMarkdownLinks(raw.body).map((link) => ({
        url: link.url,
        text: link.description ? `${link.name} - ${link.description}` : link.name,
      })),
    };
  }

  const allowed = await isAllowedByRobots(source.url);
  if (!allowed.allowed) return { links: [], error: allowed.reason ?? 'Blocked by robots.txt' };

  if (source.type === 'rss' || source.type === 'atom') {
    const feed = await safeFetch(source.url, { accept: 'application/rss+xml, application/atom+xml, application/xml' });
    if (!feed.ok) return { links: [], error: `Feed fetch failed (${feed.status || feed.error})` };
    return { links: extractFeedEntries(feed.body).map((entry) => ({ url: entry.link, text: entry.title })) };
  }

  const page = await safeFetch(source.url, { accept: 'text/html' });
  if (!page.ok) return { links: [], error: `Page fetch failed (${page.status || page.error})` };
  return {
    links: extractHtmlLinks(page.body, source.url, source.selector).map((link) => ({
      url: link.url,
      text: link.description ? `${link.name} - ${link.description}` : link.name,
    })),
  };
}

function candidateFrom(
  link: { url: string; text: string },
  source: { id: string; name?: string; category?: string; tags?: string[] },
  now: string,
): Candidate | null {
  let normalised: URL;
  try {
    normalised = assertSafeHttpUrl(link.url);
  } catch {
    return null;
  }
  const url = `${normalised.origin}${normalised.pathname === '/' ? '' : normalised.pathname}`;
  const domain = domainOf(url);
  if (domain === 'github.com' || domain.endsWith('githubusercontent.com')) return null;
  if (domain === 'twitter.com' || domain === 'x.com') return null;

  const text = link.text.replace(/\s+/g, ' ').trim();
  const name = (text.split(/[–—-]/)[0] ?? text).trim().slice(0, 60) || domain;
  const description = descriptionFromLinkText(name, text);
  if (description.length < 10) return null;

  return {
    id: slug(name, domain),
    name,
    url,
    domain,
    description,
    category: source.category ?? inferCategory(`${name} ${description}`, 'unusual'),
    tags: [...new Set([...(source.tags ?? []), ...deriveTags(name, description, 3)])].slice(0, 5),
    suggestedBy: source.name ?? source.id,
    discoverySource: source.id,
    dateDiscovered: now,
    status: 'pending',
    attempts: 0,
    lastAttemptAt: null,
    verification: null,
    rejectionReason: null,
    openSource: false,
    sourceRepo: null,
    license: null,
    free: true,
  };
}

function siteFromCandidate(candidate: Candidate, record: VerificationRecord): Site {
  return {
    id: candidate.id,
    name: candidate.name,
    url: candidate.url,
    domain: candidate.domain,
    description: candidate.description,
    category: candidate.category,
    tags: candidate.tags,
    free: true,
    accountRequired: false,
    apiKeyRequired: false,
    openSource: candidate.openSource === true,
    sourceRepo: candidate.sourceRepo ?? null,
    license: candidate.license ?? null,
    discoverySource: candidate.discoverySource,
    dateDiscovered: candidate.dateDiscovered,
    addedAt: new Date().toISOString(),
    lastVerifiedAt: record.checkedAt,
    verification: record,
    availability: 'online',
    icon: null,
    featured: false,
    consecutiveFailures: 0,
  };
}

export async function runTick(options: TickOptions = {}): Promise<TickSummary> {
  const startedAt = Date.now();
  const now = new Date().toISOString();
  const maxVerify = Math.min(Math.max(options.maxVerify ?? 3, 1), 6);
  const maxNewCandidates = Math.min(Math.max(options.maxNewCandidates ?? 6, 0), 20);

  const { files } = await loadRawFiles();
  const sites = [...(files.sites.sites ?? [])];
  const candidates = [...(files.candidates.candidates ?? [])];
  const sources = files.sources.sources ?? [];
  const metadata: ScanMetadata = { ...files.metadata };
  const notes: string[] = [];
  const sourceHealth: SourceHealthEntry[] = [];

  /* ------------------------------- SCOUT -------------------------------- */
  const enabledSources = sources.filter((entry) => entry.enabled);
  const cursor = Number(metadata.robots?.scout?.metrics?.cursor ?? 0);
  const source = enabledSources.length > 0 ? enabledSources[cursor % enabledSources.length] : undefined;
  let discovered = 0;
  let scoutFailures = 0;

  if (source) {
    const healthStart = Date.now();
    const result = await readSource(source);
    const knownDomains = new Set([...sites, ...candidates].map((entry) => entry.domain));
    const knownIds = new Set([...sites, ...candidates].map((entry) => entry.id));

    for (const link of result.links) {
      if (discovered >= maxNewCandidates) break;
      const candidate = candidateFrom(link, source, now);
      if (!candidate) continue;
      if (knownDomains.has(candidate.domain) || knownIds.has(candidate.id)) continue;
      knownDomains.add(candidate.domain);
      knownIds.add(candidate.id);
      candidates.push(candidate);
      discovered += 1;
    }

    if (result.error) {
      scoutFailures += 1;
      notes.push(`Source ${source.id}: ${result.error}`);
    }
    sourceHealth.push({
      id: source.id,
      name: source.name,
      type: source.type,
      status: result.error ? 'failed' : 'ok',
      items: discovered,
      durationMs: Date.now() - healthStart,
      ...(result.error ? { error: result.error } : {}),
    });
  }

  /* ------------------------------ VERIFIER ------------------------------ */
  const queue = candidates
    .filter((candidate) => candidate.status === 'pending' && (candidate.attempts ?? 0) < 3)
    .sort((a, b) => (a.lastAttemptAt ?? '').localeCompare(b.lastAttemptAt ?? ''))
    .slice(0, maxVerify);

  const counts = { tested: 0, verified: 0, rejected: 0, pending: 0 };

  for (const candidate of queue) {
    if (Date.now() - startedAt > VERIFY_BUDGET_MS) {
      notes.push('Time budget reached; remaining candidates stay queued for the next tick.');
      break;
    }

    const attempts = (candidate.attempts ?? 0) + 1;
    const check = await documentVerify(candidate.url, candidate.domain, attempts);
    counts.tested += 1;

    const record: VerificationRecord = {
      status: check.status,
      method: 'reader',
      checks: check.checks,
      evidence: check.evidence,
      httpStatus: check.httpStatus,
      finalUrl: check.finalUrl,
      checkedAt: new Date().toISOString(),
      attempts,
    };

    const index = candidates.findIndex((entry) => entry.id === candidate.id);
    if (index === -1) continue;

    if (check.status === 'verified') {
      counts.verified += 1;
      const site = siteFromCandidate(candidate, record);
      if (!sites.some((entry) => entry.domain === site.domain || entry.id === site.id)) {
        sites.push(site);
      }
      candidates.splice(index, 1);
    } else if (check.status === 'rejected') {
      counts.rejected += 1;
      candidates[index] = {
        ...candidate,
        status: 'rejected',
        attempts,
        lastAttemptAt: record.checkedAt,
        verification: record,
        rejectionReason: check.reason,
      };
    } else {
      counts.pending += 1;
      candidates[index] = {
        ...candidate,
        status: 'pending',
        attempts,
        lastAttemptAt: record.checkedAt,
        verification: record,
      };
    }
  }

  /* ------------------------------- CURATOR ------------------------------ */
  const seenDomains = new Set<string>();
  let duplicatesRemoved = 0;
  const curatedSites = sites.filter((site) => {
    if (seenDomains.has(site.domain)) {
      duplicatesRemoved += 1;
      return false;
    }
    seenDomains.add(site.domain);
    return site.verification?.status === 'verified' && site.accountRequired === false;
  });

  /* ------------------------------ METADATA ------------------------------ */
  const verifiedCount = curatedSites.length;
  const rejectedCount = candidates.filter((entry) => entry.status === 'rejected').length;
  const pendingCount = candidates.filter((entry) => entry.status === 'pending').length;
  const partial = scoutFailures > 0;

  metadata.scheduleProvider = 'vercel-schedules';
  metadata.status = partial ? 'partial' : 'success';
  metadata.lastScanAttemptAt = now;
  metadata.lastCompletedScanAt = now;
  if (counts.verified > 0 || counts.tested > 0) metadata.lastVerificationRunAt = now;
  metadata.lastSuccessfulScanAt = now;
  if (counts.verified > 0) metadata.lastAdditionAt = now;
  metadata.counts = {
    ...metadata.counts,
    sourcesChecked: source ? 1 : 0,
    sourcesFailed: scoutFailures,
    discovered,
    pending: pendingCount,
    verified: verifiedCount,
    rejected: rejectedCount,
    rechecked: counts.tested,
    totalSites: verifiedCount,
    addedThisRun: counts.verified,
  };
  metadata.sourceHealth = sourceHealth;
  metadata.robots = {
    scout: {
      state: scoutFailures > 0 ? 'degraded' : 'ok',
      summary: source
        ? `Read ${source.name}; ${discovered} new candidate${discovered === 1 ? '' : 's'}.`
        : 'No enabled sources.',
      lastRunAt: now,
      metrics: {
        sources: source ? 1 : 0,
        failures: scoutFailures,
        discovered,
        cursor: enabledSources.length > 0 ? (cursor + 1) % enabledSources.length : 0,
      },
    },
    verifier: {
      state: counts.tested === 0 ? 'idle' : 'ok',
      summary: `Reviewed ${counts.tested} candidate${counts.tested === 1 ? '' : 's'} with a server-side document check (HTTP + DOM, no browser).`,
      lastRunAt: now,
      metrics: {
        total: counts.tested,
        verified: counts.verified,
        rejected: counts.rejected,
        pending: counts.pending,
        browserChecks: 0,
      },
    },
    curator: {
      state: 'ok',
      summary: `Published ${verifiedCount} listings; removed ${duplicatesRemoved} duplicate${duplicatesRemoved === 1 ? '' : 's'}.`,
      lastRunAt: now,
      metrics: { published: verifiedCount, duplicatesRemoved, stale: 0 },
    },
  };
  metadata.workflow = {
    ...metadata.workflow,
    provider: 'Vercel Schedules',
    runId: null,
    runUrl: null,
    repositoryUrl: REPOSITORY_URL,
    historyUrl: process.env.VERCEL_PROJECT_DASHBOARD_URL ?? metadata.workflow.historyUrl,
    event: 'schedule/v1beta',
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  };
  metadata.notes = notes.slice(0, 6);

  /* ------------------------------- PERSIST ------------------------------ */
  let persisted: TickSummary['persisted'] = { committed: [], unchanged: [], error: undefined };
  let mode: TickSummary['mode'] = 'read-only';

  if (canPersist()) {
    const result = await writeRepoJson(
      {
        'sites.json': { schemaVersion: 1, updatedAt: now, sites: curatedSites },
        'candidates.json': { schemaVersion: 1, updatedAt: now, candidates },
        'scan-metadata.json': metadata,
      },
      `chore(data): scheduled scan ${now}`,
    );
    persisted = {
      committed: result.committed,
      unchanged: result.unchanged,
      ...(result.error ? { error: result.error } : {}),
    };
    if (result.committed.length > 0 && !result.error) mode = 'persisted';
    else if (!result.error) mode = 'persisted';
    else notes.push(result.error);
  } else {
    notes.push(
      'Read-only tick: GITHUB_DATA_TOKEN is not configured, so verified results were not saved.',
    );
  }

  return {
    mode,
    durationMs: Date.now() - startedAt,
    scout: { sourcesTried: source ? 1 : 0, discovered, failures: scoutFailures },
    verifier: counts,
    curator: { published: verifiedCount, duplicatesRemoved },
    persisted,
    notes,
  };
}
