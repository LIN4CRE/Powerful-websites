import type {
  Candidate,
  Category,
  DiscoverySource,
  ScanMetadata,
  Site,
} from '../../src/lib/types';
import { BASE_CATEGORIES } from '../../src/lib/categories';
import { dataPath, nowIso, readJson, writeJson } from './util';

interface SitesFile {
  schemaVersion: number;
  updatedAt: string;
  sites: Site[];
}
interface CandidatesFile {
  schemaVersion: number;
  updatedAt: string;
  candidates: Candidate[];
}
interface CategoriesFile {
  schemaVersion: number;
  categories: Category[];
}
interface SourcesFile {
  schemaVersion: number;
  sources: DiscoverySource[];
}

export const sitesPath = dataPath('sites.json');
export const candidatesPath = dataPath('candidates.json');
export const categoriesPath = dataPath('categories.json');
export const sourcesPath = dataPath('sources.json');
export const metadataPath = dataPath('scan-metadata.json');

export async function loadSites(): Promise<Site[]> {
  const file = await readJson<SitesFile>(sitesPath, {
    schemaVersion: 1,
    updatedAt: nowIso(),
    sites: [],
  });
  return file.sites;
}

export async function saveSites(sites: Site[]): Promise<void> {
  const sorted = [...sites].sort((a, b) => a.name.localeCompare(b.name));
  await writeJson(sitesPath, {
    schemaVersion: 1,
    updatedAt: nowIso(),
    sites: sorted,
  } satisfies SitesFile);
}

export async function loadCandidates(): Promise<Candidate[]> {
  const file = await readJson<CandidatesFile>(candidatesPath, {
    schemaVersion: 1,
    updatedAt: nowIso(),
    candidates: [],
  });
  return file.candidates;
}

export async function saveCandidates(candidates: Candidate[]): Promise<void> {
  await writeJson(candidatesPath, {
    schemaVersion: 1,
    updatedAt: nowIso(),
    candidates,
  } satisfies CandidatesFile);
}

export async function loadCategories(): Promise<Category[]> {
  const file = await readJson<CategoriesFile>(categoriesPath, {
    schemaVersion: 1,
    categories: BASE_CATEGORIES,
  });
  return file.categories;
}

export async function saveCategories(categories: Category[]): Promise<void> {
  await writeJson(categoriesPath, { schemaVersion: 1, categories } satisfies CategoriesFile);
}

export async function loadSources(): Promise<DiscoverySource[]> {
  const file = await readJson<SourcesFile>(sourcesPath, { schemaVersion: 1, sources: [] });
  return file.sources;
}

export async function loadMetadata(): Promise<ScanMetadata> {
  return readJson<ScanMetadata>(metadataPath, defaultMetadata());
}

export async function saveMetadata(meta: ScanMetadata): Promise<void> {
  await writeJson(metadataPath, meta);
}

export function defaultMetadata(): ScanMetadata {
  const emptyCounts = {
    sourcesChecked: 0,
    sourcesFailed: 0,
    discovered: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    rechecked: 0,
    removed: 0,
    duplicatesRemoved: 0,
    totalSites: 0,
    addedThisRun: 0,
  };
  const idleRobot = {
    state: 'idle' as const,
    summary: 'Waiting for the first automated run.',
    lastRunAt: null,
    metrics: {},
  };
  const repositoryUrl = 'https://github.com/LIN4CRE/Powerful-websites';
  return {
    version: 1,
    status: 'success',
    schedule: '7,22,37,52 * * * *',
    scheduleIntervalMinutes: 15,
    scheduleNote:
      'Approximately every 15 minutes. GitHub Actions schedules are best-effort and may be delayed at peak times.',
    lastScanAttemptAt: null,
    lastSuccessfulScanAt: null,
    lastCompletedScanAt: null,
    lastVerificationRunAt: null,
    lastAdditionAt: null,
    durationMs: null,
    counts: emptyCounts,
    robots: { scout: idleRobot, verifier: idleRobot, curator: idleRobot },
    sourceHealth: [],
    workflow: {
      provider: 'GitHub Actions',
      runId: null,
      runUrl: null,
      repositoryUrl,
      historyUrl: `${repositoryUrl}/actions/workflows/scan.yml`,
      event: 'none',
      commit: null,
    },
  };
}
