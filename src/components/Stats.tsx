import { Icon } from './Icon';
import { formatAbsoluteTime, formatRelativeTime } from '../lib/format';
import type { DirectoryStats } from '../lib/data';
import type { ScanMetadata } from '../lib/types';

interface StatsProps {
  stats: DirectoryStats;
  metadata: ScanMetadata;
  sourceCount: number;
}

export function Stats({ stats, metadata, sourceCount }: StatsProps) {
  const automation =
    metadata.status === 'failed'
      ? { label: 'Failing', state: 'failed' }
      : metadata.status === 'partial'
        ? { label: 'Partial', state: 'degraded' }
        : metadata.status === 'running'
          ? { label: 'Running', state: 'degraded' }
          : metadata.lastSuccessfulScanAt
            ? { label: 'Operational', state: 'ok' }
            : { label: 'Standby', state: 'idle' };

  return (
    <section aria-label="Directory statistics" className="pb-14 pt-8">
      <div className="shell grid grid-cols-2 gap-3 lg:grid-cols-5">
        <article className="panel-solid group relative overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-[0.56rem]">Verified websites</span>
            <Icon name="ShieldCheck" size={14} className="text-[var(--success)]" />
          </div>
          <p className="mono mt-3 text-[1.75rem] leading-none text-[var(--text)]">
            {stats.verifiedSites.toLocaleString()}
          </p>
          <p className="mt-2 text-[0.66rem] leading-snug text-[var(--muted)]">
            Every listing passed the no-login check
          </p>
        </article>

        <article className="panel-solid p-4">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-[0.56rem]">Categories</span>
            <Icon name="Layers" size={14} className="text-[var(--accent-2)]" />
          </div>
          <p className="mono mt-3 text-[1.75rem] leading-none text-[var(--text)]">
            {stats.categoriesInUse}
            <span className="ml-1 text-[0.8rem] text-[var(--faint)]">/ {stats.categoriesAvailable}</span>
          </p>
          <p className="mt-2 text-[0.66rem] leading-snug text-[var(--muted)]">
            Areas of the directory currently in use
          </p>
        </article>

        <article className="panel-solid p-4">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-[0.56rem]">New additions</span>
            <Icon name="Sparkles" size={14} className="text-[var(--violet-400)]" />
          </div>
          <p className="mono mt-3 text-[1.75rem] leading-none text-[var(--text)]">
            {stats.newThisWeek.toLocaleString()}
          </p>
          <p className="mt-2 text-[0.66rem] leading-snug text-[var(--muted)]">
            Published in the last 7 days · {stats.addedLast30Days} this month
          </p>
        </article>

        <article className="panel-solid p-4">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-[0.56rem]">Last successful scan</span>
            <Icon name="RefreshCw" size={14} className="text-[var(--accent)]" />
          </div>
          <p className="mt-3 text-[1.05rem] font-medium leading-tight text-[var(--text)]">
            {formatRelativeTime(stats.lastSuccessfulScan)}
          </p>
          <p className="mt-2 text-[0.66rem] leading-snug text-[var(--muted)]">
            {stats.lastSuccessfulScan ? formatAbsoluteTime(stats.lastSuccessfulScan) : 'No completed scan recorded yet'}
          </p>
        </article>

        <article className="panel-solid col-span-2 p-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-[0.56rem]">Automation</span>
            <span className="status-dot" data-state={automation.state} aria-hidden />
          </div>
          <p className="mt-3 text-[1.05rem] font-medium leading-tight text-[var(--text)]">
            {automation.label}
          </p>
          <p className="mt-2 text-[0.66rem] leading-snug text-[var(--muted)]">
            {sourceCount} sources · {stats.pendingCandidates} candidates queued
          </p>
        </article>
      </div>
    </section>
  );
}
