import { Icon } from './Icon';
import { LogoMark, Wordmark } from './Logo';
import { useClock } from '../hooks/useClock';
import { formatClock, formatFullDate, formatRelativeTime, timezoneLabel } from '../lib/format';
import type { ScanMetadata } from '../lib/types';
import type { Theme } from '../hooks/useTheme';

interface HeaderProps {
  onOpenSearch: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  metadata: ScanMetadata;
  isStale: boolean;
}

const NAV = [
  { href: '#directory', label: 'Directory' },
  { href: '#automation', label: 'Automation' },
  { href: '#method', label: 'Method' },
];

function statusLabel(metadata: ScanMetadata, isStale: boolean): { text: string; state: string } {
  if (metadata.status === 'failed') return { text: 'Scan failing', state: 'failed' };
  if (metadata.status === 'partial') return { text: 'Partially degraded', state: 'degraded' };
  if (isStale) return { text: 'Scan delayed', state: 'degraded' };
  if (!metadata.lastSuccessfulScanAt) return { text: 'Awaiting first scan', state: 'idle' };
  return { text: 'All systems operational', state: 'ok' };
}

export function Header({ onOpenSearch, theme, onToggleTheme, metadata, isStale }: HeaderProps) {
  const now = useClock();
  const status = statusLabel(metadata, isStale);

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--border)]"
      style={{
        backgroundColor: 'color-mix(in oklab, var(--bg) 78%, transparent)',
        backdropFilter: 'blur(18px) saturate(120%)',
      }}
    >
      <div className="shell flex h-[68px] items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-3" aria-label="Powerful Websites home">
          <LogoMark />
          <Wordmark />
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-[0.82rem] text-[var(--muted)] transition-colors hover:bg-white/[0.04] hover:text-[var(--text)]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#live-status"
            className="hidden items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-[0.7rem] text-[var(--text-soft)] transition-colors hover:border-[var(--border-strong)] xl:inline-flex"
            title={`Automation status: ${status.text}. Last successful scan ${formatRelativeTime(metadata.lastSuccessfulScanAt)}.`}
          >
            <span
              className={`status-dot ${status.state === 'ok' ? 'status-dot--pulse' : ''}`}
              data-state={status.state}
              aria-hidden
            />
            <span className="font-mono tracking-[0.1em] uppercase">{status.text}</span>
          </a>

          <div className="mono hidden flex-col items-end leading-tight lg:flex">
            <span className="text-[0.8rem] text-[var(--text)]">{formatClock(now)}</span>
            <span className="text-[0.6rem] text-[var(--faint)]">
              {formatFullDate(now)} · {timezoneLabel(now)}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenSearch}
            className="control"
            aria-label="Search the directory (Control K)"
          >
            <Icon name="Search" size={15} />
            <span className="hidden sm:inline">Search</span>
            <kbd className="kbd hidden sm:inline-flex">
              <Icon name="Command" size={9} />K
            </kbd>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="control w-10 px-0"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={theme === 'light'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          >
            <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
