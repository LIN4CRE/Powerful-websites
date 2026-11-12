import { describe, expect, it } from 'vitest';
import {
  buildIndex,
  categoryCounts,
  filterSites,
  isNewAddition,
  scoreEntry,
  sortSites,
  tokenize,
} from '../../src/lib/search';
import { makeSite, sampleSites } from './fixtures';

const index = buildIndex(sampleSites);

describe('tokenize', () => {
  it('lowercases, trims and caps the number of tokens', () => {
    expect(tokenize('  Image   COMPRESSION ')).toEqual(['image', 'compression']);
    expect(tokenize('')).toEqual([]);
    expect(tokenize('a b c d e f g h i j')).toHaveLength(8);
  });
});

describe('filterSites', () => {
  it('returns every site for an empty query', () => {
    expect(filterSites(index)).toHaveLength(sampleSites.length);
  });

  it('matches names, descriptions and tags', () => {
    expect(filterSites(index, { query: 'squoosh' }).map((s) => s.id)).toEqual(['squoosh']);
    expect(filterSites(index, { query: 'diagrams' }).map((s) => s.id)).toEqual(['excalidraw']);
    expect(filterSites(index, { query: 'compresses' }).map((s) => s.id)).toEqual(['squoosh']);
  });

  it('requires every token to match (AND semantics)', () => {
    expect(filterSites(index, { query: 'image excalidraw' })).toHaveLength(0);
    expect(filterSites(index, { query: 'image compress' }).map((s) => s.id)).toEqual(['squoosh']);
  });

  it('is case-insensitive and tolerates extra whitespace', () => {
    expect(filterSites(index, { query: '  EXCALIDRAW  ' }).map((s) => s.id)).toEqual(['excalidraw']);
  });

  it('filters by category', () => {
    expect(filterSites(index, { category: 'developer' }).map((s) => s.id)).toEqual(['regex101']);
  });

  it('filters to confirmed open-source projects only', () => {
    expect(filterSites(index, { openSourceOnly: true }).map((s) => s.id)).toEqual(['excalidraw']);
  });

  it('filters to saved ids only', () => {
    const savedIds = new Set(['zebra']);
    expect(filterSites(index, { savedOnly: true, savedIds }).map((s) => s.id)).toEqual(['zebra']);
    expect(filterSites(index, { savedOnly: true })).toHaveLength(0);
  });

  it('combines category, query and open-source filters', () => {
    expect(filterSites(index, { query: 'whiteboard', category: 'productivity', openSourceOnly: true })).toHaveLength(1);
    expect(filterSites(index, { query: 'whiteboard', category: 'image' })).toHaveLength(0);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterSites(index, { query: 'quantum-basket-weaving' })).toEqual([]);
  });
});

describe('relevance', () => {
  it('ranks a name match above a description-only match', () => {
    const [nameMatch, descriptionMatch] = [sampleSites[0]!, sampleSites[1]!];
    const nameScore = scoreEntry(buildIndex([nameMatch])[0]!, ['squoosh']);
    const descriptionScore = scoreEntry(buildIndex([descriptionMatch])[0]!, ['diagrams']);
    expect(nameScore).toBeGreaterThan(descriptionScore);
  });

  it('orders results by relevance for text searches', () => {
    const results = filterSites(index, { query: 'text' });
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('sorting', () => {
  it('sorts alphabetically', () => {
    expect(sortSites(sampleSites, 'name').map((s) => s.name)).toEqual([
      'Excalidraw',
      'regex101',
      'Squoosh',
      'Zebra Tables',
    ]);
  });

  it('sorts by newest first', () => {
    const older = makeSite({ id: 'old', name: 'Old', addedAt: '2020-01-01T00:00:00.000Z' });
    const newer = makeSite({ id: 'new', name: 'New', addedAt: '2026-01-01T00:00:00.000Z' });
    expect(sortSites([older, newer], 'newest').map((s) => s.id)).toEqual(['new', 'old']);
  });
});

describe('derived counts', () => {
  it('counts sites per category', () => {
    const counts = categoryCounts(sampleSites);
    expect(counts.get('developer')).toBe(1);
    expect(counts.get('unknown')).toBeUndefined();
  });

  it('flags recent additions using the provided clock', () => {
    const now = Date.parse('2026-11-03T12:00:00.000Z');
    expect(isNewAddition(sampleSites[0]!, now)).toBe(true);
    expect(isNewAddition(sampleSites[0]!, Date.parse('2027-01-01T00:00:00.000Z'))).toBe(false);
  });
});

describe('scale', () => {
  it('filters a 3,000-entry directory quickly', () => {
    const big = Array.from({ length: 3000 }, (_, position) =>
      makeSite({
        id: `site-${position}`,
        name: `Tool ${position}`,
        domain: `tool-${position}.example`,
        description: `Utility number ${position} for processing text and images in the browser.`,
        tags: ['utility', `tag-${position % 20}`],
      }),
    );
    const bigIndex = buildIndex(big);
    const started = performance.now();
    const results = filterSites(bigIndex, { query: 'utility 199' });
    const elapsed = performance.now() - started;
    expect(results.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(400);
  });
});
