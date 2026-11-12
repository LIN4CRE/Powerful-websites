/**
 * Fetches each verified site's own favicon / touch icon, normalises it to a
 * 96×96 PNG and stores it in public/logos. The website then serves logos from
 * its own origin, so visitors never make third-party requests to render a card.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import sharp from 'sharp';
import type { Site } from '../src/lib/types.js';
import { fetchWithTimeout } from './lib/http.js';
import { loadSites, saveSites } from './lib/state.js';
import { ensureDir, mapLimit, ROOT } from './lib/util.js';
import { pathToFileURL } from 'node:url';

const LOGO_DIR = path.join(ROOT, 'public', 'logos');
const MAX_BYTES = 500_000;

interface IconCandidate {
  url: string;
  rel: string;
}

function iconCandidates(html: string, siteUrl: string): IconCandidate[] {
  const $ = cheerio.load(html);
  const out: IconCandidate[] = [];
  $('link[rel]').each((_, el) => {
    const rel = String($(el).attr('rel') ?? '').toLowerCase();
    const href = $(el).attr('href');
    if (!href) return;
    if (!/(^|\s)(icon|apple-touch-icon|apple-touch-icon-precomposed|mask-icon|shortcut icon)(\s|$)/.test(rel)) {
      return;
    }
    try {
      out.push({ url: new URL(href, siteUrl).toString(), rel });
    } catch {
      /* ignore malformed hrefs */
    }
  });

  const origin = new URL(siteUrl).origin;
  out.push(
    { url: `${origin}/apple-touch-icon.png`, rel: 'apple-touch-icon' },
    { url: `${origin}/favicon.ico`, rel: 'icon' },
  );

  const seen = new Set<string>();
  return out.filter((candidate) => {
    if (seen.has(candidate.url)) return false;
    seen.add(candidate.url);
    return true;
  });
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetchWithTimeout(url, {
      timeoutMs: 12_000,
      retries: 0,
      cache: false,
      headers: { accept: 'image/avif,image/webp,image/png,image/svg+xml,image/x-icon,*/*' },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType && !/image|icon|octet-stream/i.test(contentType)) return null;
    const buffer = Buffer.from(await new Response(res.body).arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) return null;
    return buffer;
  } catch {
    return null;
  }
}

async function toPng(buffer: Buffer): Promise<Buffer | null> {
  try {
    return await sharp(buffer, { animated: false })
      .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
  } catch {
    return null; // e.g. .ico files that libvips cannot decode
  }
}

async function fetchIconForSite(site: Site): Promise<string | null> {
  const page = await fetchWithTimeout(site.url, { timeoutMs: 15_000, retries: 0, cache: false });
  const candidates = iconCandidates(page.ok ? page.body : '', site.url);

  for (const candidate of candidates) {
    const image = await downloadImage(candidate.url);
    if (!image) continue;
    const png = await toPng(image);
    if (!png) continue;
    await ensureDir(LOGO_DIR);
    const file = path.join(LOGO_DIR, `${site.id}.png`);
    await fs.writeFile(file, png);
    return `logos/${site.id}.png`;
  }

  // Last resort: a PNG favicon service (runs only in CI, never in the browser).
  const fallbackUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(site.domain)}&sz=128`;
  const fallback = await downloadImage(fallbackUrl);
  if (fallback) {
    const png = await toPng(fallback);
    if (png) {
      await ensureDir(LOGO_DIR);
      await fs.writeFile(path.join(LOGO_DIR, `${site.id}.png`), png);
      return `logos/${site.id}.png`;
    }
  }
  return null;
}

export interface IconReport {
  fetched: number;
  skipped: number;
  failed: number;
}

export async function fetchIcons(options: { limit?: number; dryRun?: boolean } = {}): Promise<IconReport> {
  const limit = options.limit ?? Number(process.env.ICON_MAX ?? 20);
  const sites = await loadSites();
  const missing = sites.filter((site) => !site.icon).slice(0, limit);
  let fetched = 0;
  let failed = 0;

  await mapLimit(missing, 3, async (site) => {
    const icon = await fetchIconForSite(site).catch(() => null);
    if (icon) {
      site.icon = icon;
      fetched += 1;
      console.log(`  ◈ logo ${site.domain}`);
    } else {
      failed += 1;
    }
  });

  if (!options.dryRun && fetched > 0) await saveSites(sites);
  return { fetched, skipped: sites.length - missing.length, failed };
}

const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invokedDirectly) {
  fetchIcons()
    .then((report) => {
      console.log(`ICONS: ${report.fetched} fetched, ${report.failed} unavailable.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('ICONS failed:', error);
      process.exit(1);
    });
}
