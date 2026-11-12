import { z } from 'zod';

const isoDateTime = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'must be an ISO date/time');

const httpUrl = z
  .string()
  .url()
  .refine((v) => v.startsWith('https://') || v.startsWith('http://'), 'must be http(s)');

export const categorySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  icon: z.string().min(1),
  description: z.string().min(8),
});

export const sourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  type: z.enum(['github-awesome', 'github-search', 'rss', 'atom', 'html-links', 'no-signup-list']),
  url: httpUrl,
  enabled: z.boolean(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  maxItems: z.number().int().positive().max(500).optional(),
  selector: z.string().optional(),
  query: z.record(z.string()).optional(),
});

export const verificationChecksSchema = z.object({
  http: z.boolean(),
  browser: z.boolean(),
  noLoginWall: z.boolean(),
  noApiKey: z.boolean(),
  coreUiReachable: z.boolean(),
  retried: z.boolean().optional(),
});

export const verificationRecordSchema = z.object({
  status: z.enum(['verified', 'pending', 'rejected']),
  method: z.enum(['http+browser', 'reader', 'http', 'editorial']),
  checks: verificationChecksSchema,
  evidence: z.string().min(1),
  httpStatus: z.number().int().min(0).max(599),
  finalUrl: httpUrl,
  checkedAt: isoDateTime,
  durationMs: z.number().nonnegative().optional(),
  attempts: z.number().int().positive().optional(),
});

export const siteSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'ids are lowercase slugs'),
  name: z.string().min(1).max(80),
  url: httpUrl,
  domain: z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/),
  description: z.string().min(20).max(220),
  category: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1).max(8),
  features: z.array(z.string()).max(8).optional(),
  free: z.boolean(),
  accountRequired: z.literal(false),
  apiKeyRequired: z.literal(false),
  openSource: z.boolean(),
  sourceRepo: httpUrl.nullish(),
  license: z.string().nullish(),
  discoverySource: z.string().min(1),
  dateDiscovered: isoDateTime,
  addedAt: isoDateTime,
  lastVerifiedAt: isoDateTime,
  verification: verificationRecordSchema,
  availability: z.enum(['online', 'offline', 'unknown']),
  icon: z.string().nullish(),
  featured: z.boolean().optional(),
  consecutiveFailures: z.number().int().nonnegative().optional(),
});

export const candidateSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(80),
  url: httpUrl,
  domain: z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/),
  description: z.string().min(10).max(240),
  category: z.string().min(1),
  tags: z.array(z.string()).max(8),
  suggestedBy: z.string().min(1),
  discoverySource: z.string().min(1),
  dateDiscovered: isoDateTime,
  status: z.enum(['pending', 'rejected']),
  attempts: z.number().int().nonnegative(),
  lastAttemptAt: isoDateTime.nullable(),
  verification: verificationRecordSchema.nullable(),
  rejectionReason: z.string().nullish(),
  regressedFrom: isoDateTime.nullish(),
  openSource: z.boolean().optional(),
  sourceRepo: httpUrl.nullish(),
  license: z.string().nullish(),
  free: z.boolean().optional(),
});

export const robotSchema = z.object({
  state: z.enum(['ok', 'degraded', 'failed', 'idle']),
  summary: z.string(),
  lastRunAt: isoDateTime.nullable(),
  metrics: z.record(z.number()),
});

export const scanMetadataSchema = z.object({
  version: z.number().int(),
  status: z.enum(['success', 'partial', 'failed', 'running']),
  scheduleProvider: z.enum(['vercel-schedules', 'github-actions', 'manual', 'none']).optional(),
  schedule: z.string().min(1),
  scheduleIntervalMinutes: z.number().int().positive(),
  scheduleNote: z.string().min(1),
  lastScanAttemptAt: isoDateTime.nullable(),
  lastSuccessfulScanAt: isoDateTime.nullable(),
  lastCompletedScanAt: isoDateTime.nullable(),
  lastVerificationRunAt: isoDateTime.nullable(),
  lastAdditionAt: isoDateTime.nullable(),
  nextScheduledRunAt: isoDateTime.nullable().optional(),
  durationMs: z.number().nonnegative().nullable(),
  counts: z.object({
    sourcesChecked: z.number().int().nonnegative(),
    sourcesFailed: z.number().int().nonnegative(),
    discovered: z.number().int().nonnegative(),
    pending: z.number().int().nonnegative(),
    verified: z.number().int().nonnegative(),
    rejected: z.number().int().nonnegative(),
    rechecked: z.number().int().nonnegative(),
    removed: z.number().int().nonnegative(),
    duplicatesRemoved: z.number().int().nonnegative(),
    totalSites: z.number().int().nonnegative(),
    addedThisRun: z.number().int().nonnegative(),
  }),
  robots: z.object({
    scout: robotSchema,
    verifier: robotSchema,
    curator: robotSchema,
  }),
  sourceHealth: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      status: z.enum(['ok', 'failed', 'skipped']),
      items: z.number().int().nonnegative(),
      durationMs: z.number().nonnegative(),
      error: z.string().optional(),
    }),
  ),
  workflow: z.object({
    provider: z.string(),
    runId: z.string().nullable(),
    runUrl: z.string().url().nullable(),
    repositoryUrl: z.string().url(),
    historyUrl: z.string().url(),
    event: z.string(),
    commit: z.string().nullable(),
  }),
  dashboardUrl: z.string().url().nullable().optional(),
  notes: z.array(z.string()).optional(),
});

export const sitesFileSchema = z.object({
  schemaVersion: z.number().int(),
  updatedAt: isoDateTime,
  sites: z.array(siteSchema),
});

export const candidatesFileSchema = z.object({
  schemaVersion: z.number().int(),
  updatedAt: isoDateTime,
  candidates: z.array(candidateSchema),
});

export const categoriesFileSchema = z.object({
  schemaVersion: z.number().int(),
  categories: z.array(categorySchema),
});

export const sourcesFileSchema = z.object({
  schemaVersion: z.number().int(),
  sources: z.array(sourceSchema),
});

export type SiteInput = z.infer<typeof siteSchema>;
