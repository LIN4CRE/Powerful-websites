/**
 * Public read-only directory feed.
 *
 * Serves the freshest data available (live data branch → bundled JSON) with
 * shared-cache headers, so scheduled scans reach visitors without rebuilding or
 * redeploying the application.
 */
import { loadDataset } from './_lib/dataset';

export const config = { maxDuration: 30 };

export async function GET(request: Request): Promise<Response> {
  const dataset = await loadDataset();
  const body = JSON.stringify({
    schemaVersion: 1,
    generatedAt: dataset.generatedAt,
    source: dataset.source,
    sites: dataset.sites,
    candidates: dataset.candidates,
    categories: dataset.categories,
    sources: dataset.sources,
    metadata: dataset.metadata,
  });

  let hash = 0;
  for (let index = 0; index < body.length; index += 1) {
    hash = (hash * 31 + body.charCodeAt(index)) | 0;
  }
  const etag = `W/"${dataset.source}-${dataset.sites.length}-${hash}"`;

  const headers: Record<string, string> = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
    'x-data-source': dataset.source,
    'x-data-generated-at': dataset.generatedAt,
    etag,
    vary: 'accept-encoding',
  };

  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(body, { status: 200, headers });
}
