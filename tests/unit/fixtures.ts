import type { Category, Site } from '../../src/lib/types';
import { BASE_CATEGORIES } from '../../src/lib/categories';

export const categories: Category[] = BASE_CATEGORIES;

export function makeSite(overrides: Partial<Site> = {}): Site {
  const name = overrides.name ?? 'Example Tool';
  const domain = overrides.domain ?? `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.example`;
  const now = new Date('2026-11-01T12:00:00.000Z').toISOString();
  return {
    id: overrides.id ?? domain.replace(/[^a-z0-9]+/g, '-'),
    name,
    url: `https://${domain}`,
    domain,
    description: 'A carefully verified browser tool used to test the directory rendering.',
    category: 'developer',
    tags: ['testing', 'browser'],
    free: true,
    accountRequired: false,
    apiKeyRequired: false,
    openSource: false,
    sourceRepo: null,
    license: null,
    discoverySource: 'editorial-research',
    dateDiscovered: now,
    addedAt: now,
    lastVerifiedAt: now,
    verification: {
      status: 'verified',
      method: 'http+browser',
      checks: {
        http: true,
        browser: true,
        noLoginWall: true,
        noApiKey: true,
        coreUiReachable: true,
      },
      evidence: 'HTTP 200; clean browser context; interactive interface detected.',
      httpStatus: 200,
      finalUrl: `https://${domain}`,
      checkedAt: now,
      durationMs: 1200,
      attempts: 1,
    },
    availability: 'online',
    icon: null,
    ...overrides,
  };
}

export const sampleSites: Site[] = [
  makeSite({ id: 'squoosh', name: 'Squoosh', domain: 'squoosh.app', description: 'Compresses and converts images in the browser.', tags: ['images', 'compression'], category: 'image' }),
  makeSite({ id: 'excalidraw', name: 'Excalidraw', domain: 'excalidraw.com', description: 'Hand-drawn style whiteboard for diagrams.', tags: ['whiteboard', 'diagrams'], category: 'productivity', openSource: true }),
  makeSite({ id: 'regex101', name: 'regex101', domain: 'regex101.com', description: 'Builds and debugs regular expressions with live matching.', tags: ['regex', 'developer'], category: 'developer' }),
  makeSite({ id: 'zebra', name: 'Zebra Tables', domain: 'zebra.example', description: 'Formats tabular text into clean aligned tables.', tags: ['tables', 'text'], category: 'data' }),
];
