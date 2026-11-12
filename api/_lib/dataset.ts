/**
 * Loads the directory dataset for API responses and scheduled ticks.
 * Prefers the live data branch, falls back to the JSON bundled at build time.
 */
import sitesFile from '../../data/sites.json';
import candidatesFile from '../../data/candidates.json';
import categoriesFile from '../../data/categories.json';
import sourcesFile from '../../data/sources.json';
import metadataFile from '../../data/scan-metadata.json';
import type { Candidate, Category, DiscoverySource, ScanMetadata, Site } from '../../src/lib/types.js';
import { DATA_BRANCH, readRepoJson, type DataFileName } from './repo.js';

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
    sites: sitesFile as unknown as RawFiles['sites'],
    candidates: candidatesFile as unknown as RawFiles['candidates'],
    categories: categoriesFile as unknown as RawFiles['categories'],
    sources: sourcesFile as unknown as RawFiles['sources'],
    metadata: metadataFile as unknown as ScanMetadata,
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
