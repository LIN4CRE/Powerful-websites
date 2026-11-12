import { useEffect, useMemo, useState } from 'react';
import { data as bundledData, deriveStats, type DirectoryStats } from '../lib/data';
import {
  fetchLiveDirectory,
  readCachedDirectory,
  toDirectory,
  type DataOrigin,
} from '../lib/live-data';
import type { DirectoryData } from '../lib/types';
import { useOnlineStatus } from './useOnlineStatus';

export interface DirectoryState {
  directory: DirectoryData;
  stats: DirectoryStats;
  origin: DataOrigin;
  /** ISO timestamp of the data itself (scan generated time when known). */
  generatedAt: string | null;
  /** ISO timestamp of the offline cache write, when the cache is in use. */
  cachedAt: string | null;
  online: boolean;
  refreshing: boolean;
}

/**
 * Loads the freshest available directory data:
 *   bundled JSON → offline cache → /api/data (live).
 * Failures are silent by design: the app keeps working with what it has.
 */
export function useDirectory(): DirectoryState {
  const online = useOnlineStatus();
  const [directory, setDirectory] = useState<DirectoryData>(bundledData);
  const [origin, setOrigin] = useState<DataOrigin>('bundled');
  const [generatedAt, setGeneratedAt] = useState<string | null>(
    bundledData.metadata.lastSuccessfulScanAt,
  );
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const cached = readCachedDirectory();
    if (cached) {
      setDirectory(toDirectory(cached.payload));
      setOrigin('cache');
      setGeneratedAt(cached.payload.generatedAt);
      setCachedAt(cached.cachedAt);
    }
  }, []);

  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    const controller = new AbortController();
    setRefreshing(true);

    fetchLiveDirectory(controller.signal)
      .then((payload) => {
        if (cancelled) return;
        setDirectory(toDirectory(payload));
        setOrigin('live');
        setGeneratedAt(payload.generatedAt);
        setCachedAt(null);
      })
      .catch(() => {
        /* offline or endpoint unavailable — keep bundled/cached data */
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [online]);

  const stats = useMemo(
    () => deriveStats(directory.sites, directory.categories, directory.metadata, directory.candidates),
    [directory],
  );

  return { directory, stats, origin, generatedAt, cachedAt, online, refreshing };
}
