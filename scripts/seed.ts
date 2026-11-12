/**
 * Seeds data/candidates.json from the editorial candidate list.
 *
 * Seeding is additive and idempotent: existing candidates and published sites
 * are never overwritten, and nothing seeded here is published until the verifier
 * has tested it in a fresh browser context.
 */
import type { Candidate } from '../src/lib/types.js';
import { SEED_CANDIDATES } from './seed-sites.js';
import { idFor } from './lib/classify.js';
import { loadCandidates, loadSites, saveCandidates } from './lib/state.js';
import { domainOf, normalizeUrl, nowIso, slugify } from './lib/util.js';
import { pathToFileURL } from 'node:url';

async function seed(): Promise<{ added: number; skipped: number }> {
  const [candidates, sites] = await Promise.all([loadCandidates(), loadSites()]);
  const knownDomains = new Set([
    ...candidates.map((candidate) => candidate.domain),
    ...sites.map((site) => site.domain),
  ]);
  const usedIds = new Set([...candidates.map((c) => c.id), ...sites.map((s) => s.id)]);

  let added = 0;
  let skipped = 0;
  const generatedAt = nowIso();

  for (const entry of SEED_CANDIDATES) {
    const url = normalizeUrl(entry.url);
    const domain = url ? domainOf(url) : '';
    if (!url || !domain) {
      console.warn(`Skipping invalid seed URL: ${entry.url}`);
      skipped += 1;
      continue;
    }
    if (knownDomains.has(domain)) {
      skipped += 1;
      continue;
    }

    let id = slugify(idFor(entry.name, domain));
    let suffix = 1;
    while (usedIds.has(id)) {
      suffix += 1;
      id = `${slugify(idFor(entry.name, domain))}-${suffix}`;
    }
    usedIds.add(id);
    knownDomains.add(domain);

    const candidate: Candidate = {
      id,
      name: entry.name,
      url,
      domain,
      description: entry.description,
      category: entry.category,
      tags: entry.tags,
      suggestedBy: 'Editorial research',
      discoverySource: entry.source ?? 'editorial-research',
      dateDiscovered: generatedAt,
      status: 'pending',
      attempts: 0,
      lastAttemptAt: null,
      verification: null,
      rejectionReason: null,
      openSource: entry.openSource ?? false,
      sourceRepo: entry.repo ?? null,
      license: entry.license ?? null,
      free: true,
    };
    candidates.push(candidate);
    added += 1;
  }

  if (added > 0) await saveCandidates(candidates);
  return { added, skipped };
}

const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) {
  seed()
    .then(({ added, skipped }) => {
      console.log(`SEED: ${added} candidate(s) queued, ${skipped} already known or invalid.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('SEED failed:', error);
      process.exit(1);
    });
}
