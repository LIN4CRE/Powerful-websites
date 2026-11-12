/**
 * VERIFIER — enforces the directory's core rule.
 *
 * Every site is opened in a brand-new headless Chromium context (no cookies, no
 * storage, no auth) plus an HTTP preflight. Only sites that pass are published.
 * A login link in a header does not disqualify a site; a mandatory barrier does.
 */
import type { Candidate, Site } from '../src/lib/types.js';
import { loadCandidates, loadCategories, loadSites, saveCandidates, saveSites } from './lib/state.js';
import { closeBrowser, verifyUrl } from './lib/verify-browser.js';
import { mapLimit, nowIso, truncate } from './lib/util.js';
import { detectSuspiciousRedirect } from './lib/verify-core.js';
import { inferCategory } from './lib/classify.js';
import { pathToFileURL } from 'node:url';

export interface VerifyReport {
  verified: number;
  rejected: number;
  pending: number;
  rechecked: number;
  removed: number;
  added: Site[];
  startedAt: string;
  finishedAt: string;
  durationMs: number;
}

export interface VerifyOptions {
  maxCandidates?: number;
  maxRechecks?: number;
  concurrency?: number;
  dryRun?: boolean;
  filter?: (candidate: Candidate) => boolean;
}

const MIN_DESCRIPTION_LENGTH = 40;

export function isPublishableDescription(description: string): boolean {
  const clean = description.trim();
  if (clean.length < MIN_DESCRIPTION_LENGTH) return false;
  if (/discovered by the automated scout/i.test(clean)) return false;
  return true;
}

function buildSite(candidate: Candidate, record: Site['verification'], categories: Set<string>): Site {
  const category = categories.has(candidate.category)
    ? candidate.category
    : inferCategory(`${candidate.name} ${candidate.description}`);
  const addedAt = nowIso();
  return {
    id: candidate.id,
    name: candidate.name,
    url: candidate.url,
    domain: candidate.domain,
    description: candidate.description.replace(/\s+/g, ' ').trim(),
    category,
    tags: candidate.tags.length > 0 ? candidate.tags : ['web-tool'],
    free: candidate.free ?? true,
    accountRequired: false,
    apiKeyRequired: false,
    openSource: candidate.openSource ?? false,
    sourceRepo: candidate.sourceRepo ?? null,
    license: candidate.license ?? null,
    discoverySource: candidate.discoverySource,
    dateDiscovered: candidate.dateDiscovered,
    addedAt,
    lastVerifiedAt: record.checkedAt,
    verification: record,
    availability: 'online',
    icon: null,
    consecutiveFailures: 0,
  };
}

export async function runVerification(options: VerifyOptions = {}): Promise<VerifyReport> {
  const startedAt = nowIso();
  const started = Date.now();
  const maxCandidates = options.maxCandidates ?? Number(process.env.VERIFY_MAX ?? 26);
  const maxRechecks = options.maxRechecks ?? Number(process.env.RECHECK_MAX ?? 10);
  const concurrency = options.concurrency ?? Number(process.env.VERIFY_CONCURRENCY ?? 4);

  let sites = await loadSites();
  const candidates = await loadCandidates();
  const categories = new Set((await loadCategories()).map((category) => category.id));

  const pending = candidates
    .filter((candidate) => candidate.status === 'pending')
    .filter((candidate) => candidate.attempts < 12)
    .filter((candidate) => options.filter?.(candidate) ?? true)
    .sort(
      (a, b) =>
        a.attempts - b.attempts ||
        Date.parse(a.lastAttemptAt ?? '1970-01-01') - Date.parse(b.lastAttemptAt ?? '1970-01-01'),
    );

  const verifyQueue = pending.filter((c) => isPublishableDescription(c.description)).slice(0, maxCandidates);
  const needsCuration = pending.length - verifyQueue.length;

  const recheckQueue = [...sites]
    .sort((a, b) => Date.parse(a.lastVerifiedAt) - Date.parse(b.lastVerifiedAt))
    .slice(0, maxRechecks);

  const verifiedAdditions: Site[] = [];
  const removedIds = new Set<string>();
  let verifiedCount = 0;
  let rejectedCount = 0;
  let pendingCount = 0;
  let rechecked = 0;

  const results = await mapLimit(
    [
      ...verifyQueue.map((candidate) => ({ kind: 'candidate' as const, candidate })),
      ...recheckQueue.map((site) => ({ kind: 'site' as const, site })),
    ],
    Math.max(1, concurrency),
    async (job) => {
      const target = job.kind === 'candidate' ? job.candidate : job.site;
      const attemptsBefore = job.kind === 'candidate' ? job.candidate.attempts : 0;
      const result = await verifyUrl(target.url, { attemptsSoFar: attemptsBefore }).catch((error) => ({
        record: {
          status: 'pending' as const,
          method: 'http+browser' as const,
          checks: {
            http: false,
            browser: false,
            noLoginWall: false,
            noApiKey: false,
            coreUiReachable: false,
          },
          evidence: `Verifier error: ${error instanceof Error ? error.message : 'unknown'}`,
          httpStatus: 0,
          finalUrl: target.url,
          checkedAt: nowIso(),
        },
        title: '',
      }));
      return { job, result };
    },
  );

  for (const { job, result } of results) {
    const { record } = result;
    if (job.kind === 'candidate') {
      const index = candidates.findIndex((c) => c.id === job.candidate.id);
      if (index === -1) continue;
      const current = candidates[index] as Candidate;
      const attempts = current.attempts + 1;

      const redirectIssue =
        record.status === 'verified' ? detectSuspiciousRedirect(current.domain, record.finalUrl) : null;

      if (record.status === 'verified' && !redirectIssue) {
        const site = buildSite(current, record, categories);
        verifiedAdditions.push(site);
        sites.push(site);
        candidates.splice(index, 1);
        verifiedCount += 1;
      } else if (record.status === 'rejected' || redirectIssue) {
        const reason = redirectIssue
          ? `Verification reached a different destination: ${redirectIssue}. Held back for review.`
          : truncate(record.evidence, 220);
        candidates[index] = {
          ...current,
          status: redirectIssue ? 'pending' : 'rejected',
          attempts: redirectIssue ? Math.min(attempts, 11) : attempts,
          lastAttemptAt: record.checkedAt,
          verification: redirectIssue
            ? { ...record, status: 'pending', evidence: `${reason} ${record.evidence}` }
            : record,
          rejectionReason: reason,
        };
        if (redirectIssue) pendingCount += 1;
        else rejectedCount += 1;
      } else {
        candidates[index] = {
          ...current,
          status: 'pending',
          attempts,
          lastAttemptAt: record.checkedAt,
          verification: record,
        };
        pendingCount += 1;
      }
    } else {
      const site = job.site;
      rechecked += 1;
      const index = sites.findIndex((s) => s.id === site.id);
      if (index === -1) continue;

      if (record.status === 'verified') {
        sites[index] = {
          ...site,
          url: record.finalUrl.startsWith('http') && new URL(record.finalUrl).hostname === new URL(site.url).hostname ? record.finalUrl : site.url,
          lastVerifiedAt: record.checkedAt,
          verification: record,
          availability: 'online',
          consecutiveFailures: 0,
        };
      } else if (record.status === 'rejected') {
        sites.splice(index, 1);
        removedIds.add(site.id);
        candidates.push({
          id: site.id,
          name: site.name,
          url: site.url,
          domain: site.domain,
          description: site.description,
          category: site.category,
          tags: site.tags,
          suggestedBy: site.discoverySource,
          discoverySource: site.discoverySource,
          dateDiscovered: site.dateDiscovered,
          status: 'rejected',
          attempts: 1,
          lastAttemptAt: record.checkedAt,
          verification: record,
          rejectionReason: truncate(record.evidence, 220),
          regressedFrom: site.lastVerifiedAt,
          openSource: site.openSource,
          sourceRepo: site.sourceRepo ?? null,
          license: site.license ?? null,
          free: site.free,
        });
        rejectedCount += 1;
      } else {
        const failures = (site.consecutiveFailures ?? 0) + 1;
        if (failures >= 3) {
          sites.splice(index, 1);
          removedIds.add(site.id);
          candidates.push({
            id: site.id,
            name: site.name,
            url: site.url,
            domain: site.domain,
            description: site.description,
            category: site.category,
            tags: site.tags,
            suggestedBy: site.discoverySource,
            discoverySource: site.discoverySource,
            dateDiscovered: site.dateDiscovered,
            status: 'pending',
            attempts: failures,
            lastAttemptAt: record.checkedAt,
            verification: record,
            rejectionReason: 'Removed after three consecutive unreachable checks; awaiting re-verification.',
            regressedFrom: site.lastVerifiedAt,
            openSource: site.openSource,
            sourceRepo: site.sourceRepo ?? null,
            license: site.license ?? null,
            free: site.free,
          });
          removedIds.add(site.id);
        } else {
          sites[index] = {
            ...site,
            availability: 'unknown',
            consecutiveFailures: failures,
          };
        }
        pendingCount += 1;
      }
    }
  }

  // De-duplicate by domain after any movement between files.
  const seenDomains = new Set<string>();
  sites = sites.filter((site) => {
    if (seenDomains.has(site.domain)) return false;
    seenDomains.add(site.domain);
    return true;
  });

  if (!options.dryRun) {
    await saveSites(sites);
    await saveCandidates(candidates);
  }

  if (needsCuration > 0) {
    console.log(
      `VERIFIER: ${needsCuration} pending candidate(s) are waiting for a description long enough to publish.`,
    );
  }

  return {
    verified: verifiedCount,
    rejected: rejectedCount,
    pending: pendingCount,
    rechecked,
    removed: removedIds.size,
    added: verifiedAdditions,
    startedAt,
    finishedAt: nowIso(),
    durationMs: Date.now() - started,
  };
}

const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) {
  runVerification()
    .then(async (report) => {
      await closeBrowser();
      console.log(
        `VERIFIER: ${report.verified} verified, ${report.rejected} rejected, ${report.pending} still pending, ` +
          `${report.rechecked} rechecked, ${report.removed} removed in ${(report.durationMs / 1000).toFixed(1)}s.`,
      );
      for (const site of report.added) console.log(`  ✓ ${site.name} — ${site.url}`);
      process.exit(0);
    })
    .catch(async (error) => {
      await closeBrowser();
      console.error('VERIFIER failed:', error);
      process.exit(1);
    });
}
