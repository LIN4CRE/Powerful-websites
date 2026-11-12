import type { Site } from './types';

export type SortKey = 'featured' | 'newest' | 'name' | 'verified';

export interface SearchQuery {
  query?: string;
  category?: string | null;
  sort?: SortKey;
  openSourceOnly?: boolean;
  savedOnly?: boolean;
  savedIds?: ReadonlySet<string>;
}

export interface IndexedSite {
  site: Site;
  nameLower: string;
  domainLower: string;
  haystack: string;
  tagList: string[];
}

/**
 * Pre-computes a lowercase haystack per site once, so filtering thousands of
 * entries stays comfortably interactive (O(n) per keystroke, no DOM work).
 */
export function buildIndex(sites: readonly Site[]): IndexedSite[] {
  return sites.map((site) => {
    const tagList = site.tags.map((t) => t.toLowerCase());
    return {
      site,
      nameLower: site.name.toLowerCase(),
      domainLower: site.domain.toLowerCase(),
      haystack: [
        site.name,
        site.domain,
        site.description,
        site.category,
        ...site.tags,
        ...(site.features ?? []),
      ]
        .join(' ')
        .toLowerCase(),
      tagList,
    };
  });
}

export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
}

export function scoreEntry(entry: IndexedSite, tokens: readonly string[]): number {
  if (tokens.length === 0) return 0;
  let score = 0;

  for (const token of tokens) {
    let tokenScore = 0;
    if (entry.nameLower === token) tokenScore = 120;
    else if (entry.nameLower.startsWith(token)) tokenScore = 90;
    else if (entry.nameLower.includes(token)) tokenScore = 70;
    else if (entry.domainLower.includes(token)) tokenScore = 60;
    else if (entry.tagList.some((t) => t.startsWith(token))) tokenScore = 50;
    else if (entry.tagList.some((t) => t.includes(token))) tokenScore = 38;
    else if (entry.haystack.includes(token)) tokenScore = 18;
    else return -1; // every token must match somewhere (AND semantics)
    score += tokenScore;
  }

  if (entry.site.featured) score += 4;
  return score;
}

const byName = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

export function sortSites(sites: Site[], sort: SortKey): Site[] {
  const copy = [...sites];
  switch (sort) {
    case 'name':
      return copy.sort((a, b) => byName.compare(a.name, b.name));
    case 'newest':
      return copy.sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt));
    case 'verified':
      return copy.sort((a, b) => Date.parse(b.lastVerifiedAt) - Date.parse(a.lastVerifiedAt));
    case 'featured':
    default:
      return copy.sort(
        (a, b) =>
          Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
          Date.parse(b.addedAt) - Date.parse(a.addedAt) ||
          byName.compare(a.name, b.name),
      );
  }
}

export function filterSites(index: readonly IndexedSite[], opts: SearchQuery = {}): Site[] {
  const tokens = tokenize(opts.query ?? '');
  const category = opts.category ?? null;
  const savedIds = opts.savedIds ?? new Set<string>();

  const scored: { site: Site; score: number }[] = [];

  for (const entry of index) {
    const site = entry.site;
    if (category && site.category !== category) continue;
    if (opts.openSourceOnly && !site.openSource) continue;
    if (opts.savedOnly && !savedIds.has(site.id)) continue;
    const score = scoreEntry(entry, tokens);
    if (score < 0) continue;
    scored.push({ site, score });
  }

  const sort = opts.sort ?? 'featured';
  if (tokens.length > 0 && sort === 'featured') {
    scored.sort(
      (a, b) =>
        b.score - a.score ||
        Number(Boolean(b.site.featured)) - Number(Boolean(a.site.featured)) ||
        byName.compare(a.site.name, b.site.name),
    );
    return scored.map((s) => s.site);
  }

  return sortSites(
    scored.map((s) => s.site),
    sort,
  );
}

export function categoryCounts(sites: readonly Site[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const site of sites) {
    counts.set(site.category, (counts.get(site.category) ?? 0) + 1);
  }
  return counts;
}

export function isNewAddition(site: Site, now = Date.now(), windowDays = 7): boolean {
  return now - Date.parse(site.addedAt) <= windowDays * 86_400_000;
}
