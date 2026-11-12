/**
 * Small, secret-free health probe used by the UI status panel and uptime checks.
 */
import { loadDataset } from './_lib/dataset';
import { canPersist } from './_lib/repo';

export async function GET(): Promise<Response> {
  const dataset = await loadDataset();
  const metadata = dataset.metadata;

  return new Response(
    JSON.stringify({
      ok: dataset.sites.length > 0,
      dataSource: dataset.source,
      persistedWrites: canPersist(),
      scheduleProvider: metadata.scheduleProvider ?? 'none',
      schedule: metadata.schedule,
      status: metadata.status,
      counts: {
        verified: dataset.sites.length,
        pending: dataset.candidates.filter((candidate) => candidate.status === 'pending').length,
        rejected: dataset.candidates.filter((candidate) => candidate.status === 'rejected')
          .length,
      },
      lastScanAttemptAt: metadata.lastScanAttemptAt,
      lastSuccessfulScanAt: metadata.lastSuccessfulScanAt,
      lastVerificationRunAt: metadata.lastVerificationRunAt,
      lastAdditionAt: metadata.lastAdditionAt,
      nextScheduledRunAt: metadata.nextScheduledRunAt ?? null,
    }),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=60',
      },
    },
  );
}
