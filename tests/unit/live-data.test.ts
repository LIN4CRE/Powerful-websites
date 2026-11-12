import { describe, expect, it, beforeEach } from 'vitest';
import sitesFile from '../../data/sites.json';
import candidatesFile from '../../data/candidates.json';
import categoriesFile from '../../data/categories.json';
import sourcesFile from '../../data/sources.json';
import metadataFile from '../../data/scan-metadata.json';
import { parseLivePayload, readCachedDirectory, toDirectory } from '../../src/lib/live-data';

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: 'bundled',
  sites: sitesFile.sites,
  candidates: candidatesFile.candidates,
  categories: categoriesFile.categories,
  sources: sourcesFile.sources,
  metadata: metadataFile,
};

describe('live directory data', () => {
  beforeEach(() => localStorage.clear());

  it('parses a well-formed API payload', () => {
    const parsed = parseLivePayload(payload);
    expect(parsed).not.toBeNull();
    expect(toDirectory(parsed!).sites.length).toBe(sitesFile.sites.length);
  });

  it('rejects payloads that claim published sites without verification', () => {
    const broken = {
      ...payload,
      sites: payload.sites.map((site) => ({
        ...site,
        accountRequired: true,
      })),
    };
    expect(parseLivePayload(broken)).toBeNull();
  });

  it('rejects junk instead of crashing the app', () => {
    expect(parseLivePayload({ hello: 'world' })).toBeNull();
    expect(parseLivePayload(null)).toBeNull();
  });

  it('returns null when nothing has been cached', () => {
    expect(readCachedDirectory()).toBeNull();
    localStorage.setItem('pw:directory-cache', '{not json');
    expect(readCachedDirectory()).toBeNull();
  });
});
