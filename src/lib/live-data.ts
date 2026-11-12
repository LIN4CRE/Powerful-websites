/**
 * Runtime directory data.
 *
 * The app ships with the repository JSON so it works on first paint and offline.
 * `/api/data` serves fresher records without rebuilding the frontend, and the
 * last good response is cached in localStorage for offline use.
 */
import { z } from 'zod';
import {
  candidateSchema,
  categorySchema,
  scanMetadataSchema,
  siteSchema,
  sourceSchema,
} from './schema';
import type { DirectoryData, ScanMetadata } from './types';

export const livePayloadSchema = z.object({
  schemaVersion: z.number().int().optional(),
  generatedAt: z.string().min(1),
  source: z.string().min(1),
  sites: z.array(siteSchema),
  candidates: z.array(candidateSchema),
  categories: z.array(categorySchema),
  sources: z.array(sourceSchema),
  metadata: scanMetadataSchema,
});

export type LivePayload = z.infer<typeof livePayloadSchema>;
export type DataOrigin = 'bundled' | 'live' | 'cache';

export interface LoadedDirectory {
  directory: DirectoryData;
  origin: DataOrigin;
  /** When the data itself was produced (not when it was fetched). */
  generatedAt: string | null;
}

const CACHE_KEY = 'pw:directory-cache';
const FETCH_TIMEOUT_MS = 6000;

interface CachedPayload {
  payload: LivePayload;
  cachedAt: string;
}

export function toDirectory(payload: LivePayload): DirectoryData {
  return {
    sites: payload.sites,
    candidates: payload.candidates,
    categories: payload.categories,
    sources: payload.sources,
    metadata: payload.metadata as ScanMetadata,
  };
}

export function parseLivePayload(raw: unknown): LivePayload | null {
  const parsed = livePayloadSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function readCachedDirectory(): CachedPayload | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload;
    const payload = parseLivePayload(parsed?.payload);
    if (!payload || typeof parsed.cachedAt !== 'string') return null;
    return { payload, cachedAt: parsed.cachedAt };
  } catch {
    return null;
  }
}

function writeCachedDirectory(payload: LivePayload): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ payload, cachedAt: new Date().toISOString() }));
  } catch {
    /* quota or private mode: caching is best-effort */
  }
}

export async function fetchLiveDirectory(signal?: AbortSignal): Promise<LivePayload> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  try {
    const response = await fetch('/api/data', {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`data endpoint responded ${response.status}`);
    const payload = parseLivePayload(await response.json());
    if (!payload) throw new Error('data endpoint returned an unexpected shape');
    writeCachedDirectory(payload);
    return payload;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onAbort);
  }
}
