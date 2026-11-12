/**
 * Loads the directory dataset for API responses and scheduled ticks.
 * Prefers the live data branch, falls back to the JSON bundled at build time.
 */
import { createRequire } from 'node:module';
import type { Candidate, Category, DiscoverySource, ScanMetadata, Site } from '../../src/lib/types.js';
import { DATA_BRANCH, readRepoJson, type DataFileName } from './repo.js';

// Node's ESM loader refuses JSON modules without an import attribute, and Vercel
// transpiles each function file individually, so the bundled JSON is read through
// createRequire instead. The literal paths are what makes nft trace data/*.json
// into the function bundle.
const require = createRequire(import.meta.url);


export interface Dataset {
  sites: Site[];
  candidates: Candidate[];
  categories: Category[];
  sources: DiscoverySource[];
  metadata: ScanMetadata;
  source: 'github' | 'bundled';
  generatedAt: string;
}

interface RawFiles {
  sites: { sites?: Site[] };
  candidates: { candidates?: Candidate[] };
  categories: { categories?: Category[] };
  sources: { sources?: DiscoverySource[] };
  metadata: ScanMetadata;
}

function bundled(): RawFiles {
  return {
    sites: require('../../data/sites.json') as RawFiles['sites'],
    candidates: require('../../data/candidates.json') as RawFiles['candidates'],
    categories: require('../../data/categories.json') as RawFiles['categories'],
    sources: require('../../data/sources.json') as RawFiles['sources'],
    metadata: require('../../data/scan-metadata.json') as ScanMetadata,
  };
}

async function fromBranch(branch: string): Promise<RawFiles | null> {
  const names: Record<keyof RawFiles, DataFileName> = {
    sites: 'sites.json',
    candidates: 'candidates.json',
    categories: 'categories.json',
    sources: 'sources.json',
    metadata: 'scan-metadata.json',
  };

  const [sites, candidates, categories, sources, metadata] = await Promise.all([
    readRepoJson<RawFiles['sites']>(names.sites, branch),
    readRepoJson<RawFiles['candidates']>(names.candidates, branch),
    readRepoJson<RawFiles['categories']>(names.categories, branch),
    readRepoJson<RawFiles['sources']>(names.sources, branch),
    readRepoJson<ScanMetadata>(names.metadata, branch),
  ]);

  if (!sites?.sites || !candidates?.candidates || !categories?.categories || !sources?.sources) {
    return null;
  }
  return { sites, candidates, categories, sources, metadata: metadata ?? bundled().metadata };
}

export function toDataset(files: RawFiles, source: Dataset['source']): Dataset {
  const metadata = files.metadata;
  return {
    sites: files.sites.sites ?? [],
    candidates: files.candidates.candidates ?? [],
    categories: files.categories.categories ?? [],
    sources: files.sources.sources ?? [],
    metadata,
    source,
    generatedAt:
      metadata.lastCompletedScanAt ??
      metadata.lastSuccessfulScanAt ??
      new Date().toISOString(),
  };
}

export async function loadDataset(): Promise<Dataset> {
  try {
    const live = await fromBranch(DATA_BRANCH);
    if (live) return toDataset(live, 'github');
  } catch {
    /* fall through to the bundled copy */
  }
  return toDataset(bundled(), 'bundled');
}

/** Raw files for the scheduler, which must read the same revision it writes. */
export async function loadRawFiles(): Promise<{ files: RawFiles; source: Dataset['source'] }> {
  try {
    const live = await fromBranch(DATA_BRANCH);
    if (live) return { files: live, source: 'github' };
  } catch {
    /* fall through */
  }
  return { files: bundled(), source: 'bundled' };
}
