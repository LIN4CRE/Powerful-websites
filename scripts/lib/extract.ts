import * as cheerio from 'cheerio';
import { XMLParser } from 'fast-xml-parser';
import { descriptionFromLinkText } from './classify.js';
import { isUsefulExternalUrl, normalizeUrl, stripHtml, truncate } from './util.js';

export interface ExtractedLink {
  name: string;
  url: string;
  description: string;
}

const MD_ITEM =
  /^\s*(?:[-*+]|\d+\.)\s+\[([^\]]{2,120})\]\((https?:\/\/[^\s)]+)\)\s*(?:[-–—:|]\s*)?(.*)$/gm;

/** Extracts bulleted links (with optional trailing descriptions) from Markdown. */
export function extractMarkdownLinks(markdown: string): ExtractedLink[] {
  const out: ExtractedLink[] = [];
  const seen = new Set<string>();

  for (const match of markdown.matchAll(MD_ITEM)) {
    const [, rawName, rawUrl, rawDescription] = match;
    const url = normalizeUrl(rawUrl ?? '');
    if (!url || !isUsefulExternalUrl(url)) continue;
    const name = stripHtml((rawName ?? '').replace(/[*_`]/g, '')).trim();
    if (!name || name.length < 2) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({
      name,
      url,
      description: descriptionFromLinkText(name, truncate(stripHtml(rawDescription ?? ''), 160)),
    });
  }

  return out;
}

/** Extracts anchors from an HTML page, optionally restricted by selector. */
export function extractHtmlLinks(html: string, baseUrl: string, selector?: string): ExtractedLink[] {
  const $ = cheerio.load(html);
  const out: ExtractedLink[] = [];
  const seen = new Set<string>();
  const scope = selector ? $(selector) : $('body');
  const anchors = scope.find('a[href]').toArray();

  for (const element of anchors.slice(0, 600)) {
    const href = $(element).attr('href');
    if (!href) continue;
    let absolute: string;
    try {
      absolute = new URL(href, baseUrl).toString();
    } catch {
      continue;
    }
    const url = normalizeUrl(absolute);
    if (!url || !isUsefulExternalUrl(url)) continue;
    if (seen.has(url)) continue;
    const text = $(element).text().replace(/\s+/g, ' ').trim();
    if (!text || text.length < 2 || /^(here|link|website|visit|read more|more)$/i.test(text)) {
      const domainName = new URL(url).hostname.replace(/^www\./, '').split('.')[0] ?? '';
      if (!domainName) continue;
      seen.add(url);
      out.push({ name: domainName, url, description: '' });
      continue;
    }
    const surrounding = $(element).closest('li, article, p, div').first().text();
    const description = descriptionFromLinkText(text, truncate(surrounding, 160));
    seen.add(url);
    out.push({ name: truncate(text, 70), url, description });
  }

  return out;
}

export interface FeedEntry {
  title: string;
  link: string;
  description: string;
  published?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
});

/** Parses RSS 2.0 and Atom feeds into a small, uniform shape. */
export function extractFeedEntries(xml: string): FeedEntry[] {
  const out: FeedEntry[] = [];
  try {
    const doc = parser.parse(xml) as Record<string, unknown>;
    const rss = (doc.rss as Record<string, unknown> | undefined) ?? doc;
    const channel = (rss.channel ?? doc.feed) as Record<string, unknown> | undefined;
    if (!channel) return out;
    const items = channel.item ?? channel.entry;
    const list = Array.isArray(items) ? items : items ? [items] : [];

    for (const rawItem of list.slice(0, 120)) {
      const item = rawItem as Record<string, unknown>;
      const title = String(item.title ?? '').trim();
      let link = '';
      const linkValue = item.link;
      if (typeof linkValue === 'string') link = linkValue;
      else if (Array.isArray(linkValue)) {
        const alternate =
          linkValue.find((l) => (l as Record<string, unknown>)['@_rel'] === 'alternate') ?? linkValue[0];
        link = String((alternate as Record<string, unknown>)?.['@_href'] ?? '');
      } else if (linkValue && typeof linkValue === 'object') {
        link = String((linkValue as Record<string, unknown>)['@_href'] ?? '');
      }
      const guid = String(item.guid ?? '').trim();
      if (!link) link = guid.startsWith('http') ? guid : '';
      if (!title || !link) continue;
      const rawDescription = String(
        item.description ?? item.summary ?? item['content:encoded'] ?? '',
      );
      out.push({
        title: stripHtml(title),
        link,
        description: truncate(stripHtml(rawDescription), 160),
        published: String(item.pubDate ?? item.published ?? item.updated ?? ''),
      });
    }
  } catch {
    return out;
  }
  return out;
}
