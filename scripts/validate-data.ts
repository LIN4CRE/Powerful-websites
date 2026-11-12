/**
 * Data validation used by `npm test`, CI and the pull-request checks.
 * Fails loudly on schema violations, duplicate domains, dangling category
 * references and any published site that has not passed verification.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  candidatesFileSchema,
  categoriesFileSchema,
  scanMetadataSchema,
  sitesFileSchema,
  sourcesFileSchema,
} from '../src/lib/schema.js';
import {
  candidatesPath,
  categoriesPath,
  metadataPath,
  sitesPath,
  sourcesPath,
} from './lib/state.js';
import { readJson, ROOT } from './lib/util.js';
import { pathToFileURL } from 'node:url';

export interface ValidationIssue {
  file: string;
  message: string;
}

export async function validateDataFiles(): Promise<{ issues: ValidationIssue[]; counts: Record<string, number> }> {
  const issues: ValidationIssue[] = [];
  const counts: Record<string, number> = {};

  const add = (file: string, message: string) => issues.push({ file, message });

  const [sitesRaw, candidatesRaw, categoriesRaw, sourcesRaw, metadataRaw] = await Promise.all([
    readJson<unknown>(sitesPath, null),
    readJson<unknown>(candidatesPath, null),
    readJson<unknown>(categoriesPath, null),
    readJson<unknown>(sourcesPath, null),
    readJson<unknown>(metadataPath, null),
  ]);

  const sitesParsed = sitesFileSchema.safeParse(sitesRaw);
  if (!sitesParsed.success) {
    for (const issue of sitesParsed.error.issues) {
      add('data/sites.json', `${issue.path.join('.')}: ${issue.message}`);
    }
  }

  const candidatesParsed = candidatesFileSchema.safeParse(candidatesRaw);
  if (!candidatesParsed.success) {
    for (const issue of candidatesParsed.error.issues) {
      add('data/candidates.json', `${issue.path.join('.')}: ${issue.message}`);
    }
  }

  const categoriesParsed = categoriesFileSchema.safeParse(categoriesRaw);
  if (!categoriesParsed.success) {
    for (const issue of categoriesParsed.error.issues) {
      add('data/categories.json', `${issue.path.join('.')}: ${issue.message}`);
    }
  }

  const sourcesParsed = sourcesFileSchema.safeParse(sourcesRaw);
  if (!sourcesParsed.success) {
    for (const issue of sourcesParsed.error.issues) {
      add('data/sources.json', `${issue.path.join('.')}: ${issue.message}`);
    }
  }

  const metadataParsed = scanMetadataSchema.safeParse(metadataRaw);
  if (!metadataParsed.success) {
    for (const issue of metadataParsed.error.issues) {
      add('data/scan-metadata.json', `${issue.path.join('.')}: ${issue.message}`);
    }
  }

  const sites = sitesParsed.success ? sitesParsed.data.sites : [];
  const candidates = candidatesParsed.success ? candidatesParsed.data.candidates : [];
  const categories = categoriesParsed.success ? categoriesParsed.data.categories : [];

  counts.sites = sites.length;
  counts.candidates = candidates.length;
  counts.categories = categories.length;
  counts.sources = sourcesParsed.success ? sourcesParsed.data.sources.length : 0;

  const categoryIds = new Set(categories.map((category) => category.id));
  const ids = new Set<string>();
  const domains = new Set<string>();

  for (const site of sites) {
    if (ids.has(site.id)) add('data/sites.json', `duplicate id: ${site.id}`);
    ids.add(site.id);
    if (domains.has(site.domain)) add('data/sites.json', `duplicate domain: ${site.domain}`);
    domains.add(site.domain);
    if (!categoryIds.has(site.category)) {
      add('data/sites.json', `${site.name} uses unknown category "${site.category}"`);
    }
    if (site.verification.status !== 'verified') {
      add('data/sites.json', `${site.name} is published without a verified record`);
    }
    const checks = site.verification.checks;
    if (!checks.http || !checks.noLoginWall || !checks.noApiKey || !checks.coreUiReachable) {
      add('data/sites.json', `${site.name} has an incomplete verification check set`);
    }
    // The browser check is the automated standard. Records verified through a
    // rendered-document review while runners were unavailable must say so and
    // must not claim a browser pass.
    if (site.verification.method === 'http+browser' && !checks.browser) {
      add('data/sites.json', `${site.name} claims a browser verification without a browser check`);
    }
    if (site.verification.method !== 'http+browser' && checks.browser) {
      add('data/sites.json', `${site.name} records a browser check under a non-browser method`);
    }
    if (site.accountRequired !== false || site.apiKeyRequired !== false) {
      add('data/sites.json', `${site.name} is marked as requiring an account or API key`);
    }
    if (site.verification.status === 'verified' && site.verification.checkedAt !== site.lastVerifiedAt) {
      add('data/sites.json', `${site.name} has a lastVerifiedAt that differs from its verification timestamp`);
    }
    if (site.icon) {
      const iconPath = path.join(ROOT, 'public', site.icon);
      if (!existsSync(iconPath)) add('data/sites.json', `${site.name} references a missing logo: ${site.icon}`);
    }
    if (Date.parse(site.addedAt) > Date.now() + 60_000) {
      add('data/sites.json', `${site.name} has a future addedAt date`);
    }
  }

  const candidateIds = new Set<string>();
  const candidateDomains = new Set<string>();
  for (const candidate of candidates) {
    if (candidateIds.has(candidate.id)) add('data/candidates.json', `duplicate id: ${candidate.id}`);
    candidateIds.add(candidate.id);
    if (candidateDomains.has(candidate.domain)) {
      add('data/candidates.json', `duplicate domain: ${candidate.domain}`);
    }
    candidateDomains.add(candidate.domain);
    if (domains.has(candidate.domain)) {
      add('data/candidates.json', `${candidate.domain} is both published and a candidate`);
    }
    if (!categoryIds.has(candidate.category)) {
      add('data/candidates.json', `${candidate.name} uses unknown category "${candidate.category}"`);
    }
  }

  if (metadataParsed.success) {
    const meta = metadataParsed.data;
    if (meta.counts.totalSites !== sites.length) {
      add(
        'data/scan-metadata.json',
        `counts.totalSites is ${meta.counts.totalSites} but sites.json contains ${sites.length}`,
      );
    }
    if (meta.lastSuccessfulScanAt && meta.lastScanAttemptAt && Date.parse(meta.lastSuccessfulScanAt) > Date.parse(meta.lastScanAttemptAt)) {
      add('data/scan-metadata.json', 'lastSuccessfulScanAt is later than lastScanAttemptAt');
    }
  }

  const sourceIds = new Set<string>();
  if (sourcesParsed.success) {
    for (const source of sourcesParsed.data.sources) {
      if (sourceIds.has(source.id)) add('data/sources.json', `duplicate source id: ${source.id}`);
      sourceIds.add(source.id);
    }
  }

  return { issues, counts };
}

const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) {
  validateDataFiles()
    .then(({ issues, counts }) => {
      if (issues.length === 0) {
        console.log(
          `DATA OK — ${counts.sites} verified sites, ${counts.candidates} candidates, ` +
            `${counts.categories} categories, ${counts.sources} sources.`,
        );
        process.exit(0);
      }
      console.error(`DATA INVALID — ${issues.length} issue(s):`);
      for (const issue of issues.slice(0, 50)) console.error(`  ${issue.file}: ${issue.message}`);
      process.exit(1);
    })
    .catch((error) => {
      console.error('VALIDATION failed:', error);
      process.exit(1);
    });
}
