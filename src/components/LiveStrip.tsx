import { Icon } from './Icon';
import { useClock } from '../hooks/useClock';
import {
  formatAbsoluteTime,
  formatClock,
  formatFullDate,
  formatRelativeTime,
  timezoneLabel,
} from '../lib/format';
import type { ScanMetadata } from '../lib/types';

interface LiveStripProps {
  metadata: ScanMetadata;
  isStale: boolean;
  verifiedCount: number;
  pendingCount: number;
}

export function LiveStrip({ metadata, isStale, verifiedCount, pendingCount }: LiveStripProps) {
  const now = useClock();
  const stale = isStale && metadata.lastSuccessfulScanAt;

  return (
    <section id="live-status" className="scroll-mt-24 pb-4">
      <div className="shell">
        <div className="panel grid grid-cols-1 divide-y divide-[var(--border)] overflow-hidden sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Icon name="Activity" size={12} className="text-[var(--accent)]" />
              <span className="eyebrow text-[0.58rem]">Current date &amp; time</span>
            </div>
            <p className="mono mt-2 text-[1.35rem] leading-none text-[var(--text)]">
              {formatClock(now)}
            </p>
            <p className="mt-1.5 text-[0.7rem] text-[var(--muted)]">
              {formatFullDate(now)} · {timezoneLabel(now)} <span className="text-[var(--faint)]">(your local time)</span>
            </p>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Icon name="Radar" size={12} className="text-[var(--accent)]" />
              <span className="eyebrow text-[0.58rem]">Last searched</span>
            </div>
            <p className="mono mt-2 text-[1.35rem] leading-none text-[var(--text)]">
              {formatRelativeTime(metadata.lastSuccessfulScanAt, now.getTime())}
            </p>
            <p className="mt-1.5 text-[0.7rem] text-[var(--muted)]">
              {metadata.lastSuccessfulScanAt
                ? `Completed ${formatAbsoluteTime(metadata.lastSuccessfulScanAt)}`
                : 'Waiting for the first completed scan'}
            </p>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Icon name="RefreshCw" size={12} className="text-[var(--accent)]" />
              <span className="eyebrow text-[0.58rem]">Scan frequency</span>
            </div>
            <p className="mono mt-2 text-[1.35rem] leading-none text-[var(--text)]">
              ≈ every 15 min
            </p>
            <p className="mt-1.5 text-[0.7rem] text-[var(--muted)]">
              Best-effort GitHub Actions schedule · {verifiedCount} verified · {pendingCount} queued
            </p>
          </div>
        </div>

        {verifiedCount > 0 && !metadata.lastSuccessfulScanAt && (
          <div className="mt-3 rounded-xl border border-[color-mix(in_oklab,var(--warning)_28%,transparent)] bg-[color-mix(in_oklab,var(--warning)_8%,transparent)] px-3 py-2 text-[0.7rem] leading-relaxed text-[var(--text-soft)]">
            <strong className="font-medium text-[var(--warning)]">Automation paused.</strong>{' '}
            The scheduled workflow has not completed yet. Current listings were checked with a
            rendered-document review; headless browser verification runs automatically once the
            workflow is enabled.
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-[0.68rem] text-[var(--faint)]">
          <span className="inline-flex items-center gap-1.5">
            <span className={`status-dot ${stale ? '' : 'status-dot--pulse'}`} data-state={stale ? 'degraded' : 'ok'} aria-hidden />
            {stale
              ? `No completed scan for ${Math.round((now.getTime() - Date.parse(metadata.lastSuccessfulScanAt ?? '')) / 60000)} minutes — scheduled runs may be delayed.`
              : 'Automation is reporting normally.'}
          </span>
          <a
            href={metadata.workflow.historyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-[var(--text-soft)]"
          >
            Workflow history <Icon name="ArrowUpRight" size={11} />
          </a>
        </div>
      </div>
    </section>
  );
}
