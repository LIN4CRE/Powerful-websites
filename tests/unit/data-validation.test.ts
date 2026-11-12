import { describe, expect, it } from 'vitest';
import { validateDataFiles } from '../../scripts/validate-data';
import { siteSchema, candidateSchema, scanMetadataSchema } from '../../src/lib/schema';
import { makeSite } from './fixtures';
import { SEED_CANDIDATES } from '../../scripts/seed-sites';
import { BASE_CATEGORIES } from '../../src/lib/categories';
import { deriveStats } from '../../src/lib/data';
import { defaultMetadata } from '../../scripts/lib/state';
import metadataFile from '../../data/scan-metadata.json';
import sitesFile from '../../data/sites.json';
import categoriesFile from '../../data/categories.json';
import sourcesFile from '../../data/sources.json';
import type { Site } from '../../src/lib/types';

describe('repository data', () => {
  it('passes every schema and cross-reference check', async () => {
    const { issues } = await validateDataFiles();
    expect(issues).toEqual([]);
  });

  it('ships the full starting taxonomy', () => {
    expect(categoriesFile.categories.length).toBeGreaterThanOrEqual(20);
    expect(new Set(categoriesFile.categories.map((c) => c.id)).size).toBe(categoriesFile.categories.length);
  });

  it('declares enabled discovery sources with unique ids', () => {
    expect(sourcesFile.sources.length).toBeGreaterThanOrEqual(5);
    expect(sourcesFile.sources.some((source) => source.enabled)).toBe(true);
    expect(new Set(sourcesFile.sources.map((s) => s.id)).size).toBe(sourcesFile.sources.length);
  });

  it('only publishes sites that record a complete verification', () => {
    for (const site of sitesFile.sites as Site[]) {
      expect(site.verification.status).toBe('verified');
      expect(site.accountRequired).toBe(false);
      expect(site.apiKeyRequired).toBe(false);
      expect(site.verification.checks.noLoginWall).toBe(true);
      expect(site.verification.checks.browser).toBe(true);
    }
  });

  it('has metadata consistent with the published catalogue', () => {
    expect(scanMetadataSchema.safeParse(metadataFile).success).toBe(true);
    expect(metadataFile.counts.totalSites).toBe(sitesFile.sites.length);
  });
});

describe('site schema', () => {
  it('accepts a valid verified site', () => {
    expect(siteSchema.safeParse(makeSite()).success).toBe(true);
  });

  it('refuses to validate a site that requires an account', () => {
    const invalid = { ...makeSite(), accountRequired: true };
    expect(siteSchema.safeParse(invalid).success).toBe(false);
  });

  it('refuses to validate a site that requires an API key', () => {
    const invalid = { ...makeSite(), apiKeyRequired: true };
    expect(siteSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects malformed ids and non-http urls', () => {
    expect(siteSchema.safeParse({ ...makeSite(), id: 'Not A Slug' }).success).toBe(false);
    expect(siteSchema.safeParse({ ...makeSite(), url: 'ftp://example.com/file' }).success).toBe(false);
  });

  it('rejects truncated descriptions', () => {
    expect(siteSchema.safeParse({ ...makeSite(), description: 'Too short.' }).success).toBe(false);
  });
});

describe('verification records', () => {
  it('requires a candidate to be either pending or rejected', () => {
    const candidate = {
      id: 'example',
      name: 'Example',
      url: 'https://example.com',
      domain: 'example.com',
      description: 'A discovered candidate website that has not been published yet.',
      category: 'developer',
      tags: ['tools'],
      suggestedBy: 'Test',
      discoverySource: 'test',
      dateDiscovered: new Date().toISOString(),
      status: 'pending',
      attempts: 0,
      lastAttemptAt: null,
      verification: null,
    };
    expect(candidateSchema.safeParse(candidate).success).toBe(true);
    expect(candidateSchema.safeParse({ ...candidate, status: 'verified' }).success).toBe(false);
  });
});

describe('statistics', () => {
  it('derives stats only from supplied data', () => {
    const now = Date.parse('2026-11-12T12:00:00.000Z');
    const recent = makeSite({ id: 'recent', name: 'Recent', addedAt: '2026-11-10T12:00:00.000Z' });
    const old = makeSite({ id: 'old', name: 'Old', addedAt: '2026-01-01T00:00:00.000Z' });
    const metadata = {
      ...defaultMetadata(),
      lastSuccessfulScanAt: '2026-11-12T11:45:00.000Z',
      lastScanAttemptAt: '2026-11-12T11:45:00.000Z',
    };
    const stats = deriveStats([recent, old], BASE_CATEGORIES, metadata, [], now);
    expect(stats.verifiedSites).toBe(2);
    expect(stats.newThisWeek).toBe(1);
    expect(stats.categoriesInUse).toBe(1);
    expect(stats.isStale).toBe(false);
    expect(stats.staleMinutes).toBe(15);
  });

  it('reports stale automation honestly', () => {
    const metadata = { ...defaultMetadata(), lastSuccessfulScanAt: '2026-11-12T08:00:00.000Z' };
    const stats = deriveStats([], BASE_CATEGORIES, metadata, [], Date.parse('2026-11-12T12:00:00.000Z'));
    expect(stats.isStale).toBe(true);
    expect(stats.verifiedSites).toBe(0);
  });
});

describe('editorial seed', () => {
  it('contains a substantial starting collection', () => {
    expect(SEED_CANDIDATES.length).toBeGreaterThanOrEqual(80);
  });

  it('has unique domains, valid urls and real descriptions', () => {
    const domains = new Set<string>();
    const categoryIds = new Set(BASE_CATEGORIES.map((category) => category.id));
    for (const entry of SEED_CANDIDATES) {
      const url = new URL(entry.url);
      expect(url.protocol).toBe('https:');
      const domain = url.hostname.replace(/^www\./, '');
      expect(domains.has(domain)).toBe(false);
      domains.add(domain);
      expect(categoryIds.has(entry.category)).toBe(true);
      expect(entry.description.length).toBeGreaterThanOrEqual(40);
      expect(entry.description.length).toBeLessThanOrEqual(200);
      expect(entry.tags.length).toBeGreaterThan(0);
      expect(entry.tags.length).toBeLessThanOrEqual(6);
    }
  });
});
