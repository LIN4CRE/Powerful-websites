/**
 * SCAN — orchestrates SCOUT → VERIFIER → CURATOR and writes honest metadata.
 *
 * A failure in one stage or one source never aborts the whole run. The metadata
 * file records exactly what happened, including partial runs, so the website can
 * show the truth rather than an assumed schedule.
 */
import type { RobotRunInfo, ScanMetadata, SourceHealthEntry } from '../src/lib/types';
import { runScout } from './scout';
import { runVerification } from './verify';
import { runCuration } from './curate';
import { fetchIcons } from './fetch-icons';
import { loadCandidates, loadMetadata, loadSites, saveMetadata } from './lib/state';
import { nowIso, truncate } from './lib/util';

const REPOSITORY_URL = 'https://github.com/LIN4CRE/Powerful-websites';
const WORKFLOW_HISTORY_URL = `${REPOSITORY_URL}/actions/workflows/scan.yml`;

function workflowInfo(): ScanMetadata['workflow'] {
  const runId = process.env.GITHUB_RUN_ID ?? null;
  return {
    provider: 'GitHub Actions',
    runId,
    runUrl: runId
      ? `${process.env.GITHUB_SERVER_URL ?? 'https://github.com'}/${process.env.GITHUB_REPOSITORY ?? 'LIN4CRE/Powerful-websites'}/actions/runs/${runId}`
      : null,
    repositoryUrl: REPOSITORY_URL,
    historyUrl: WORKFLOW_HISTORY_URL,
    event: process.env.GITHUB_EVENT_NAME ?? 'local',
    commit: process.env.GITHUB_SHA ?? null,
  };
}

function stateFrom(metrics: Record<string, number>, failureKey: string): RobotRunInfo['state'] {
  const failures = metrics[failureKey] ?? 0;
  if (failures === 0) return 'ok';
  const total = metrics.total ?? 0;
  return total > 0 && failures < total ? 'degraded' : 'failed';
}

export async function runScan(options: { dryRun?: boolean; skipScout?: boolean; skipIcons?: boolean } = {}) {
  const startedAt = nowIso();
  const started = Date.now();
  const previous = await loadMetadata();
  const notes: string[] = [];

  const meta: ScanMetadata = {
    ...previous,
    status: 'running',
    lastScanAttemptAt: startedAt,
    workflow: workflowInfo(),
  };
  await saveMetadata(meta);

  console.log(`\n▶ SCAN started ${startedAt}`);

  // ── SCOUT ────────────────────────────────────────────────────────────────
  let scoutHealth: SourceHealthEntry[] = [];
  let scoutCount = 0;
  let scoutDuplicates = 0;
  let scoutFatal = false;
  let scoutDuration = 0;
  try {
    const scoutStarted = Date.now();
    const report = await runScout({ maxNewCandidates: Number(process.env.SCOUT_MAX_NEW ?? 24), dryRun: options.dryRun });
    scoutHealth = report.health;
    scoutCount = report.added.length;
    scoutDuplicates = report.duplicates;
    scoutDuration = Date.now() - scoutStarted;
    const failedSources = report.health.filter((entry) => entry.status === 'failed');
    if (failedSources.length > 0) {
      notes.push(`${failedSources.length} discovery source(s) failed: ${failedSources.map((s) => s.name).join(', ')}.`);
    }
    console.log(`SCOUT: ${report.added.length} new candidates (${failedSources.length} failed sources).`);
  } catch (error) {
    scoutFatal = true;
    const message = error instanceof Error ? error.message : 'unknown error';
    notes.push(`Scout stage failed: ${truncate(message, 160)}`);
    console.error('SCOUT fatal error:', error);
  }

  // ── VERIFIER ─────────────────────────────────────────────────────────────
  let verifyResult: Awaited<ReturnType<typeof runVerification>> | null = null;
  let verifierFatal = false;
  try {
    verifyResult = await runVerification({ dryRun: options.dryRun });
    console.log(
      `VERIFIER: ${verifyResult.verified} verified, ${verifyResult.rejected} rejected, ${verifyResult.pending} pending.`,
    );
  } catch (error) {
    verifierFatal = true;
    notes.push(
      `Verifier stage failed: ${truncate(error instanceof Error ? error.message : 'unknown', 160)}`,
    );
    console.error('VERIFIER fatal error:', error);
  }

  // ── CURATOR ──────────────────────────────────────────────────────────────
  let curation: Awaited<ReturnType<typeof runCuration>> | null = null;
  try {
    curation = await runCuration({ dryRun: options.dryRun });
    console.log(
      `CURATOR: ${curation.sites} published, ${curation.duplicatesRemoved} duplicates removed, ${curation.staleForRecheck.length} stale.`,
    );
  } catch (error) {
    notes.push(`Curator stage failed: ${truncate(error instanceof Error ? error.message : 'unknown', 160)}`);
    console.error('CURATOR fatal error:', error);
  }

  // ── ICONS (new additions only) ───────────────────────────────────────────
  if (!options.skipIcons && !options.dryRun) {
    try {
      const iconReport = await fetchIcons({ limit: 18 });
      if (iconReport.fetched > 0) console.log(`ICONS: ${iconReport.fetched} logos stored.`);
    } catch (error) {
      notes.push('Logo download failed; monogram fallbacks will be used.');
      console.warn('ICON stage warning:', error instanceof Error ? error.message : error);
    }
  }

  const sites = await loadSites();
  const candidates = await loadCandidates();
  const finishedAt = nowIso();
  const durationMs = Date.now() - started;
  const pendingCount = candidates.filter((candidate) => candidate.status === 'pending').length;
  const rejectedCount = candidates.filter((candidate) => candidate.status === 'rejected').length;
  const lastAddition = sites.reduce<string | null>(
    (latest, site) => (!latest || Date.parse(site.addedAt) > Date.parse(latest) ? site.addedAt : latest),
    null,
  );

  const sourceFailures = scoutHealth.filter((entry) => entry.status === 'failed').length;
  const status: ScanMetadata['status'] =
    verifierFatal || scoutFatal ? (scoutFatal && verifierFatal ? 'failed' : 'partial') : sourceFailures > 0 ? 'partial' : 'success';
  const completedSuccessfully = status !== 'failed';

  const scoutMetrics = {
    total: scoutHealth.length,
    failures: sourceFailures,
    sources: scoutHealth.length,
    discovered: scoutCount,
    duplicates: scoutDuplicates,
  };
  const verifierMetrics = {
    total: (verifyResult?.verified ?? 0) + (verifyResult?.rejected ?? 0) + (verifyResult?.pending ?? 0),
    failures: verifierFatal ? 1 : 0,
    checked: verifyResult?.rechecked ?? 0,
    verified: verifyResult?.verified ?? 0,
    rejected: verifyResult?.rejected ?? 0,
    pending: verifyResult?.pending ?? 0,
  };
  const curatorMetrics = {
    total: sites.length,
    failures: curation ? 0 : 1,
    published: sites.length,
    duplicatesRemoved: curation?.duplicatesRemoved ?? 0,
    stale: curation?.staleForRecheck.length ?? 0,
  };

  const nextMeta: ScanMetadata = {
    ...meta,
    status,
    lastCompletedScanAt: finishedAt,
    lastSuccessfulScanAt: completedSuccessfully ? finishedAt : previous.lastSuccessfulScanAt,
    lastVerificationRunAt: verifyResult ? finishedAt : previous.lastVerificationRunAt,
    lastAdditionAt: lastAddition ?? previous.lastAdditionAt,
    durationMs,
    counts: {
      sourcesChecked: scoutHealth.length,
      sourcesFailed: sourceFailures,
      discovered: scoutCount,
      pending: pendingCount,
      verified: verifyResult?.verified ?? 0,
      rejected: verifyResult?.rejected ?? 0,
      rechecked: verifyResult?.rechecked ?? 0,
      removed: verifyResult?.removed ?? 0,
      duplicatesRemoved: curation?.duplicatesRemoved ?? 0,
      totalSites: sites.length,
      addedThisRun: verifyResult?.verified ?? 0,
    },
    robots: {
      scout: {
        state: scoutFatal ? 'failed' : stateFrom(scoutMetrics, 'failures'),
        summary: scoutFatal
          ? 'Discovery failed this run; the next scheduled scan will retry every source.'
          : `${scoutHealth.length - sourceFailures}/${scoutHealth.length} sources responded, ${scoutCount} new candidate(s) queued.`,
        lastRunAt: finishedAt,
        metrics: scoutMetrics,
      },
      verifier: {
        state: verifierFatal ? 'failed' : (verifyResult?.pending ?? 0) > 0 ? 'degraded' : 'ok',
        summary: verifierFatal
          ? 'Verification could not run; no new sites were published.'
          : `${verifierMetrics.total} site(s) tested in fresh browser contexts, ${verifyResult?.verified ?? 0} published, ${verifyResult?.rejected ?? 0} rejected.`,
        lastRunAt: verifyResult ? finishedAt : previous.robots.verifier.lastRunAt,
        metrics: verifierMetrics,
      },
      curator: {
        state: curation ? 'ok' : 'failed',
        summary: curation
          ? `${sites.length} listings kept consistent, ${curation.duplicatesRemoved} duplicate(s) removed, ${curation.staleForRecheck.length} flagged for recheck.`
          : 'Curation failed this run; data was left untouched.',
        lastRunAt: curation ? finishedAt : previous.robots.curator.lastRunAt,
        metrics: curatorMetrics,
      },
    },
    sourceHealth: scoutHealth,
    notes: notes.length > 0 ? notes : undefined,
    scheduleNote:
      'Approximately every 15 minutes. GitHub Actions schedules are best-effort and may be delayed at peak times.',
  };

  await saveMetadata(nextMeta);

  console.log(
    `\n■ SCAN ${status} in ${(durationMs / 1000).toFixed(1)}s — ${sites.length} published sites, ` +
      `${pendingCount} pending, ${rejectedCount} rejected, ${scoutDuration}ms in discovery.`,
  );

  return { status, metadata: nextMeta };
}

const invokedDirectly = process.argv[1]?.endsWith('scan.ts') ?? false;
if (invokedDirectly) {
  runScan({ skipScout: process.env.SKIP_SCOUT === '1' })
    .then(({ status }) => process.exit(status === 'failed' ? 1 : 0))
    .catch((error) => {
      console.error('SCAN failed:', error);
      process.exit(1);
    });
}
