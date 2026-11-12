import sitesFile from '../../data/sites.json';
import candidatesFile from '../../data/candidates.json';
import categoriesFile from '../../data/categories.json';
import sourcesFile from '../../data/sources.json';
import metadataFile from '../../data/scan-metadata.json';
import type {
  Candidate,
  Category,
  DiscoverySource,
  DirectoryData,
  ScanMetadata,
  Site,
} from './types';
import { categoryCounts, isNewAddition } from './search';

export const data: DirectoryData = {
  sites: (sitesFile.sites as Site[]).slice(),
  candidates: (candidatesFile.candidates as Candidate[]).slice(),
  categories: categoriesFile.categories as Category[],
  sources: sourcesFile.sources as DiscoverySource[],
  metadata: metadataFile as ScanMetadata,
};

export interface DirectoryStats {
  verifiedSites: number;
  categoriesAvailable: number;
  categoriesInUse: number;
  newThisWeek: number;
  addedLast30Days: number;
  openSourceSites: number;
  lastSuccessfulScan: string | null;
  lastScanAttempt: string | null;
  lastAddition: string | null;
  pendingCandidates: number;
  rejectedCandidates: number;
  automationStatus: ScanMetadata['status'];
  isStale: boolean;
  staleMinutes: number;
}

export function deriveStats(
  sites: readonly Site[],
  categories: readonly Category[],
  metadata: ScanMetadata,
  candidates: readonly Candidate[] = [],
  now = Date.now(),
): DirectoryStats {
  const counts = categoryCounts(sites);
  const lastSuccessful = metadata.lastSuccessfulScanAt;
  const staleMinutes = lastSuccessful
    ? Math.max(0, Math.floor((now - Date.parse(lastSuccessful)) / 60_000))
    : Number.POSITIVE_INFINITY;

  return {
    verifiedSites: sites.length,
    categoriesAvailable: categories.length,
    categoriesInUse: counts.size,
    newThisWeek: sites.filter((s) => isNewAddition(s, now)).length,
    addedLast30Days: sites.filter((s) => isNewAddition(s, now, 30)).length,
    openSourceSites: sites.filter((s) => s.openSource).length,
    lastSuccessfulScan: lastSuccessful,
    lastScanAttempt: metadata.lastScanAttemptAt,
    lastAddition: metadata.lastAdditionAt,
    pendingCandidates: candidates.filter((c) => c.status === 'pending').length,
    rejectedCandidates: candidates.filter((c) => c.status === 'rejected').length,
    automationStatus: metadata.status,
    isStale: staleMinutes > 90,
    staleMinutes,
  };
}

export const stats = deriveStats(data.sites, data.categories, data.metadata, data.candidates);
