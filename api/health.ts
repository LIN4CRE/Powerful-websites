/**
 * Small, secret-free health probe used by the UI status panel and uptime checks.
 */
import { loadDataset } from './_lib/dataset.js';
import { canPersist } from './_lib/repo.js';

export async function GET(): Promise<Response> {
  let dataset;
  try {
    dataset = await loadDataset();
  } catch (error) {
    // Never leak stack traces or filesystem paths to the public; the error code
    // is enough to identify a broken deployment from the outside.
    const code =
      typeof error === 'object' && error && 'code' in error
        ? String((error as { code?: unknown }).code)
        : (error as Error)?.name ?? 'Error';
    return new Response(JSON.stringify({ ok: false, error: code }), {
      status: 503,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
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
