import { Icon } from './Icon';
import { formatRelativeTime } from '../lib/format';

interface ConnectionBannerProps {
  online: boolean;
  generatedAt: string | null;
  cachedAt: string | null;
}

/**
 * Honest connectivity state. It never implies that external sites are available
 * offline — only the directory data that was previously downloaded.
 */
export function ConnectionBanner({ online, generatedAt, cachedAt }: ConnectionBannerProps) {
  if (online) return null;

  const stamp = cachedAt ?? generatedAt;
  return (
    <div className="shell pt-3" role="status" aria-live="polite">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-[color-mix(in_oklab,var(--warning)_30%,transparent)] bg-[color-mix(in_oklab,var(--warning)_8%,transparent)] px-3 py-2 text-[0.74rem] text-[var(--text-soft)]">
        <Icon name="WifiOff" size={13} className="text-[var(--warning)]" />
        <strong className="font-medium text-[var(--warning)]">Offline.</strong>
        <span>
          Showing the directory saved on this device
          {stamp ? ` (${formatRelativeTime(stamp)})` : ''}. Search and filters still work;
          website links need a connection.
        </span>
      </div>
    </div>
  );
}

interface DataFreshnessProps {
  origin: 'bundled' | 'live' | 'cache';
  generatedAt: string | null;
}

/** Small provenance line so visitors know which copy of the data they see. */
export function DataFreshness({ origin, generatedAt }: DataFreshnessProps) {
  if (origin === 'live' && !generatedAt) return null;
  const label =
    origin === 'live'
      ? 'Live directory data'
      : origin === 'cache'
        ? 'Data from this device’s cache'
        : 'Data bundled with this build';
  return (
    <p className="mt-1.5 text-[0.62rem] text-[var(--faint)]">
      {label}
      {generatedAt ? ` · updated ${formatRelativeTime(generatedAt)}` : ''}
    </p>
  );
}
