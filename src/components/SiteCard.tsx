import { useMemo, useState } from 'react';
import { Icon } from './Icon';
import type { Category, Site } from '../lib/types';
import { formatRelativeTime, formatAbsoluteTime } from '../lib/format';

interface SiteCardProps {
  site: Site;
  category?: Category;
  saved: boolean;
  onToggleSave: (id: string) => void;
  query?: string;
}

function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return (words[0] ?? '').slice(0, 2).toUpperCase();
  return `${(words[0] ?? '')[0] ?? ''}${(words[1] ?? '')[0] ?? ''}`.toUpperCase();
}

function hueFrom(text: string): number {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 360;
  }
  return hash;
}

function Highlight({ text, query }: { text: string; query?: string }) {
  const terms = (query ?? '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 1)
    .slice(0, 3);
  if (terms.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, index) =>
        terms.includes(part.toLowerCase()) ? (
          <mark
            key={`${part}-${index}`}
            className="rounded-[3px] bg-[rgba(56,232,255,0.16)] px-0.5 text-inherit"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

export function SiteCard({ site, category, saved, onToggleSave, query }: SiteCardProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const base = import.meta.env.BASE_URL;
  const iconSrc = site.icon ? `${base}${site.icon.replace(/^\//, '')}` : null;
  const hue = useMemo(() => hueFrom(site.domain), [site.domain]);

  return (
    <article className="site-card group">
      <a
        className="site-card__hit"
        href={site.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${site.name} — opens the official website in a new tab`}
      />

      <div className="flex items-start gap-3">
        <div
          className={`card-logo ${iconSrc && !logoFailed ? '' : 'card-logo--fallback'}`}
          aria-hidden
          style={
            iconSrc && !logoFailed
              ? undefined
              : {
                  color: `hsl(${hue} 90% 74%)`,
                  background: `radial-gradient(circle at 30% 20%, hsl(${hue} 96% 62% / 0.26), transparent 65%), linear-gradient(150deg, hsl(${hue} 90% 60% / 0.16), rgba(255,255,255,0.02))`,
                }
          }
        >
          {iconSrc && !logoFailed ? (
            <img
              src={iconSrc}
              alt=""
              width={26}
              height={26}
              loading="lazy"
              decoding="async"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span>{initials(site.name)}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[0.98rem] font-semibold leading-tight tracking-[-0.01em]">
            <Highlight text={site.name} query={query} />
          </h3>
          <p className="mono mt-1 truncate text-[0.63rem] text-[var(--faint)]">{site.domain}</p>
        </div>

        <div className="site-card__actions flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleSave(site.id)}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${site.name} from saved sites` : `Save ${site.name} for later`}
            title={saved ? 'Saved locally' : 'Save for later (stored in your browser only)'}
            className={`rounded-lg p-1.5 transition-colors ${
              saved
                ? 'text-[var(--accent)]'
                : 'text-[var(--faint)] opacity-70 hover:text-[var(--text)] hover:opacity-100'
            }`}
          >
            <Icon name={saved ? 'BookmarkCheck' : 'Bookmark'} size={15} />
          </button>
          <Icon
            name="ArrowUpRight"
            size={15}
            className="text-[var(--faint)] opacity-0 transition-all duration-200 group-hover:opacity-100"
          />
        </div>
      </div>

      <p className="line-clamp-2 text-[0.82rem] leading-relaxed text-[var(--text-soft)]">
        <Highlight text={site.description} query={query} />
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        {category && (
          <span className="badge badge--accent">
            <Icon name={category.icon} size={10} />
            {category.name.split(' & ')[0]}
          </span>
        )}
        {site.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="badge badge--muted">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="badge badge--success" title="Verified: no account or login needed">
            <Icon name="ShieldCheck" size={10} />
            No login required
          </span>
          {site.free && <span className="badge">Free</span>}
          {site.openSource && (
            <span className="badge" style={{ color: 'var(--violet-400)' }}>
              Open source
            </span>
          )}
        </div>
        <time
          dateTime={site.lastVerifiedAt}
          title={`Last verified ${formatAbsoluteTime(site.lastVerifiedAt)}`}
          className="mono text-[0.58rem] text-[var(--faint)]"
        >
          Verified {formatRelativeTime(site.lastVerifiedAt)}
        </time>
      </div>
    </article>
  );
}
