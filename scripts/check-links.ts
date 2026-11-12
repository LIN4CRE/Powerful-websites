/**
 * Link checker for published listings. Unlike the verifier it only performs HTTP
 * requests; it is used as an audit and in the scheduled quality workflow.
 */
import { loadSites } from './lib/state.js';
import { fetchWithTimeout } from './lib/http.js';
import { mapLimit } from './lib/util.js';
import { pathToFileURL } from 'node:url';

export interface LinkResult {
  id: string;
  url: string;
  status: number;
  ok: boolean;
  finalUrl: string;
  error?: string;
}

export async function checkLinks(options: { concurrency?: number; limit?: number } = {}): Promise<LinkResult[]> {
  const sites = (await loadSites()).slice(0, options.limit ?? 1000);
  return mapLimit(sites, options.concurrency ?? 6, async (site) => {
    const res = await fetchWithTimeout(site.url, { timeoutMs: 20_000, retries: 1, cache: false });
    return {
      id: site.id,
      url: site.url,
      status: res.status,
      ok: res.ok,
      finalUrl: res.finalUrl,
      ...(res.error ? { error: res.error } : {}),
    };
  });
}

const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) {
  checkLinks({ limit: Number(process.env.LINK_LIMIT ?? 1000) })
    .then((results) => {
      const broken = results.filter((result) => !result.ok);
      console.log(`LINKS: ${results.length - broken.length}/${results.length} reachable.`);
      for (const result of broken) {
        console.warn(`  ✗ ${result.id} — HTTP ${result.status} ${result.error ?? ''} ${result.url}`);
      }
      process.exit(broken.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('LINK CHECK failed:', error);
      process.exit(1);
    });
}
