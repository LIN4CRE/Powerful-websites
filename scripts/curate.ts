/**
 * CURATOR — keeps the directory consistent.
 *
 * Responsibilities: de-duplicate, repair categories/tags/descriptions, flag
 * stale records for rechecking, drop anything that violates publish invariants,
 * and ensure every category referenced by a site exists.
 */
import type { Candidate, Category, Site } from '../src/lib/types';
import { BASE_CATEGORIES } from '../src/lib/categories';
import {
  loadCandidates,
  loadCategories,
  loadSites,
  saveCandidates,
  saveCategories,
  saveSites,
} from './lib/state';
import { inferCategory } from './lib/classify';
import { isPublishableDescription } from './verify';
import { pathToFileURL } from 'node:url';

export interface CurateReport {
  sites: number;
  candidates: number;
  duplicatesRemoved: number;
  categoryFixes: number;
  tagFixes: number;
  descriptionFixes: number;
  droppedInvalid: number;
  staleForRecheck: string[];
  categoriesAdded: string[];
}

const STALE_DAYS = Number(process.env.STALE_DAYS ?? 45);

function normaliseTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean))]
    .filter((tag) => tag.length <= 24)
    .slice(0, 6);
}

function normaliseDescription(description: string): string {
  let clean = description.replace(/\s+/g, ' ').trim();
  if (!/[.!?]$/.test(clean)) clean = `${clean.replace(/[,;:]$/, '')}.`;
  if (clean.length > 200) {
    const cut = clean.slice(0, 197);
    const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    clean = lastStop > 90 ? cut.slice(0, lastStop + 1) : `${cut.replace(/[,;\s]+\S*$/, '')}…`;
  }
  return clean;
}

/** Curation is deterministic and idempotent, so it is safe to run every scan. */
export async function runCuration(options: { dryRun?: boolean; now?: number } = {}): Promise<CurateReport> {
  const now = options.now ?? Date.now();
  const [rawSites, rawCandidates, existingCategories] = await Promise.all([
    loadSites(),
    loadCandidates(),
    loadCategories(),
  ]);

  const categories: Category[] = [...existingCategories];
  for (const base of BASE_CATEGORIES) {
    if (!categories.some((category) => category.id === base.id)) categories.push(base);
  }
  const categoryIds = new Set(categories.map((category) => category.id));
  const categoriesAdded: string[] = [];

  let duplicatesRemoved = 0;
  let categoryFixes = 0;
  let tagFixes = 0;
  let descriptionFixes = 0;
  let droppedInvalid = 0;

  const sorted = [...rawSites].sort(
    (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.name.localeCompare(b.name),
  );

  const seenDomains = new Set<string>();
  const sites: Site[] = [];

  for (const raw of sorted) {
    let site = { ...raw };

    if (seenDomains.has(site.domain)) {
      duplicatesRemoved += 1;
      continue;
    }

    // Publish invariants: verified, free, no account, no API key.
    if (
      site.verification?.status !== 'verified' ||
      site.accountRequired !== false ||
      site.apiKeyRequired !== false ||
      site.free !== true ||
      !site.url.startsWith('https://')
    ) {
      droppedInvalid += 1;
      continue;
    }

    if (!isPublishableDescription(site.description)) {
      droppedInvalid += 1;
      continue;
    }

    const description = normaliseDescription(site.description);
    if (description !== site.description) {
      site = { ...site, description };
      descriptionFixes += 1;
    }

    if (!categoryIds.has(site.category)) {
      const inferred = inferCategory(`${site.name} ${site.description}`);
      if (!categoryIds.has(inferred)) {
        categories.push({
          id: inferred,
          name: inferred
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' '),
          icon: 'Layers',
          description: 'A newer area of the directory added by the curator.',
        });
        categoryIds.add(inferred);
        categoriesAdded.push(inferred);
      }
      site = { ...site, category: inferred };
      categoryFixes += 1;
    }

    const tags = normaliseTags(site.tags);
    if (tags.join('|') !== site.tags.join('|')) {
      site = { ...site, tags };
      tagFixes += 1;
    }

    if (site.icon && !site.icon.startsWith('logos/')) {
      site = { ...site, icon: null };
    }

    // Keep derived summary fields honest.
    if (site.availability === 'offline') {
      site = { ...site, availability: 'unknown' };
    }

    seenDomains.add(site.domain);
    sites.push(site);
  }

  // Candidates: de-duplicate by domain, prefer rejected records that carry a
  // reason, otherwise the one with the most verification attempts.
  const candidateByDomain = new Map<string, Candidate>();
  let candidateDuplicates = 0;
  for (const candidate of rawCandidates) {
    if (seenDomains.has(candidate.domain)) {
      candidateDuplicates += 1;
      continue;
    }
    const existing = candidateByDomain.get(candidate.domain);
    if (!existing) {
      candidateByDomain.set(candidate.domain, {
        ...candidate,
        tags: normaliseTags(candidate.tags),
        description: candidate.description.replace(/\s+/g, ' ').trim(),
      });
      continue;
    }
    candidateDuplicates += 1;
    if (existing.status === 'rejected' && candidate.status === 'pending') continue;
    candidateByDomain.set(candidate.domain, {
      ...candidate,
      tags: normaliseTags(candidate.tags),
      description: candidate.description.replace(/\s+/g, ' ').trim(),
    });
  }
  const candidates = [...candidateByDomain.values()].sort(
    (a, b) => Date.parse(b.dateDiscovered) - Date.parse(a.dateDiscovered),
  );

  const staleForRecheck = sites
    .filter((site) => now - Date.parse(site.lastVerifiedAt) > STALE_DAYS * 86_400_000)
    .map((site) => site.id);

  if (!options.dryRun) {
    await saveSites(sites);
    await saveCandidates(candidates);
    await saveCategories(categories);
  }

  return {
    sites: sites.length,
    candidates: candidates.length,
    duplicatesRemoved: duplicatesRemoved + candidateDuplicates,
    categoryFixes,
    tagFixes,
    descriptionFixes,
    droppedInvalid,
    staleForRecheck,
    categoriesAdded,
  };
}

const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) {
  runCuration()
    .then((report) => {
      console.log(
        `CURATOR: ${report.sites} published sites, ${report.candidates} candidates, ` +
          `${report.duplicatesRemoved} duplicates removed, ${report.categoryFixes} category fixes, ` +
          `${report.tagFixes} tag fixes, ${report.staleForRecheck.length} stale.`,
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error('CURATOR failed:', error);
      process.exit(1);
    });
}
