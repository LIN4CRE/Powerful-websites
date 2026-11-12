import { slugify, truncate } from './util.js';

interface Rule {
  category: string;
  pattern: RegExp;
}

/**
 * Lightweight keyword classifier used when a discovery source does not supply a
 * category. The curator runs this, never the browser bundle, and it is
 * deliberately conservative: a wrong keyword only affects the default category,
 * which is reviewed on the next curation pass.
 */
const CATEGORY_RULES: Rule[] = [
  { category: 'ai', pattern: /\b(ai|llm|gpt|machine learning|diffusion|neural|chatbot|generative)\b/i },
  { category: 'developer', pattern: /\b(api|json|regex|developer|sdk|webhook|cli|debug|compiler|encoding)\b/i },
  { category: 'programming', pattern: /\b(code|coding|programming|sql|python|javascript|typescript|playground)\b/i },
  { category: 'design', pattern: /\b(design|colour|color|palette|font|typography|icon|svg|illustration)\b/i },
  { category: 'image', pattern: /\b(image|photo|png|jpeg|webp|background|picture|stock)\b/i },
  { category: 'video-audio', pattern: /\b(video|audio|mp3|mp4|sound|music|voice|podcast|convert)\b/i },
  { category: 'writing', pattern: /\b(write|writing|grammar|translation|translate|text|markdown|document)\b/i },
  { category: 'pdf-files', pattern: /\b(pdf|file|merge|compress|convert|upload|convert)\b/i },
  { category: 'privacy', pattern: /\b(privacy|security|encrypt|password|breach|tracker|vpn|secure)\b/i },
  { category: 'research', pattern: /\b(research|paper|academic|scholar|archive|data set|dataset|osint)\b/i },
  { category: 'education', pattern: /\b(learn|course|education|tutorial|school|university|textbook)\b/i },
  { category: 'science', pattern: /\b(science|space|nasa|physics|chemistry|weather|earthquake|astronomy)\b/i },
  { category: 'data', pattern: /\b(data|chart|visuali[sz]ation|analytics|statistics|dataset)\b/i },
  { category: 'maps', pattern: /\b(map|maps|geo|location|coordinates|latitude)\b/i },
  { category: 'internet', pattern: /\b(dns|ip|ping|network|bandwidth|ssl|http)\b/i },
  { category: 'calculators', pattern: /\b(calculator|convert|converter|unit|currency|timezone)\b/i },
  { category: 'business', pattern: /\b(finance|stock|market|company|crypto|invoice|accounting)\b/i },
  { category: 'browser-apps', pattern: /\b(browser|web app|offline|editor|playing in your browser)\b/i },
];

export function inferCategory(text: string, fallback = 'unusual'): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(text)) return rule.category;
  }
  return fallback;
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'is', 'it', 'its',
  'of', 'on', 'or', 'that', 'the', 'their', 'this', 'to', 'with', 'your', 'you', 'we', 'our',
  'free', 'online', 'tool', 'tools', 'website', 'web', 'app', 'apps', 'use', 'using', 'can',
]);

/** Derives 2–5 short tags from a name and description. */
export function deriveTags(name: string, description: string, max = 5): string[] {
  const words = `${name} ${description}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, max)
    .map(([word]) => word);
}

/** Turns link text from an awesome list into a plausible, honest description. */
export function descriptionFromLinkText(name: string, linkText: string): string {
  const cleaned = linkText
    .replace(new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-–—:]+\\s*`, 'i'), '')
    .replace(/^\s*[-–—:]\s*/, '')
    .replace(/`[^`]*`/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const sentence = truncate(cleaned || `${name} — discovered by the automated scout.`, 150);
  return /[.!?]$/.test(sentence) ? sentence : `${sentence.replace(/[.,;:]$/, '')}.`;
}

export function idFor(name: string, domain: string): string {
  const base = slugify(name) || slugify(domain.replace(/\./g, '-'));
  return base.slice(0, 48) || 'site';
}
