import { Icon } from './Icon';
import { formatRelativeTime } from '../lib/format';
import type { RobotRunInfo, ScanMetadata } from '../lib/types';

interface RobotsProps {
  metadata: ScanMetadata;
}

const ROBOTS: {
  key: 'scout' | 'verifier' | 'curator';
  name: string;
  role: string;
  icon: string;
  accent: string;
  metrics: (info: RobotRunInfo) => { label: string; value: string }[];
}[] = [
  {
    key: 'scout',
    name: 'SCOUT',
    role: 'Discovers new websites from public sources.',
    icon: 'Radar',
    accent: 'var(--accent)',
    metrics: (info) => [
      { label: 'Sources', value: `${info.metrics.sources ?? 0}` },
      { label: 'Failed', value: `${info.metrics.failures ?? 0}` },
      { label: 'Discovered', value: `${info.metrics.discovered ?? 0}` },
    ],
  },
  {
    key: 'verifier',
    name: 'VERIFIER',
    role: 'Checks availability and whether registration is required.',
    icon: 'ScanSearch',
    accent: 'var(--success)',
    metrics: (info) => [
      { label: 'Tested', value: `${info.metrics.total ?? 0}` },
      { label: 'Approved', value: `${info.metrics.verified ?? 0}` },
      { label: 'Rejected', value: `${info.metrics.rejected ?? 0}` },
    ],
  },
  {
    key: 'curator',
    name: 'CURATOR',
    role: 'Organises discoveries, removes duplicates and maintains records.',
    icon: 'Layers',
    accent: 'var(--violet-400)',
    metrics: (info) => [
      { label: 'Listings', value: `${info.metrics.published ?? 0}` },
      { label: 'Duplicates', value: `${info.metrics.duplicatesRemoved ?? 0}` },
      { label: 'Stale', value: `${info.metrics.stale ?? 0}` },
    ],
  },
];

const STATE_LABEL: Record<RobotRunInfo['state'], string> = {
  ok: 'Operating normally',
  degraded: 'Degraded',
  failed: 'Failed',
  idle: 'Awaiting first run',
};

export function Robots({ metadata }: RobotsProps) {
  return (
    <section id="automation" className="scroll-mt-24 border-t border-[var(--border)] py-16">
      <div className="shell">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">The machine behind the directory</p>
            <h2 className="mt-3 text-[clamp(1.6rem,3.4vw,2.3rem)] font-semibold tracking-[-0.02em]">
              Three robots. <span className="text-[var(--muted)]">Real work, every 15 minutes.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-[0.88rem] leading-relaxed text-[var(--muted)]">
              These statuses are written by the scheduled GitHub Actions workflow after each run.
              Nothing on this page is simulated — if a robot fails, it says so.
            </p>
          </div>
          <a
            href={metadata.workflow.historyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="control self-start sm:self-auto"
          >
            <Icon name="Github" size={15} />
            Workflow history
            <Icon name="ArrowUpRight" size={13} />
          </a>
        </div>

        <div className="stagger mt-9 grid gap-4 md:grid-cols-3">
          {ROBOTS.map((robot) => {
            const info = metadata.robots[robot.key];
            return (
              <article
                key={robot.key}
                className="panel-solid relative overflow-hidden p-5 transition-colors hover:border-[var(--border-strong)]"
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full opacity-[0.16] blur-2xl"
                  style={{ background: robot.accent }}
                  aria-hidden
                />
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white/[0.03]"
                      style={{ color: robot.accent }}
                    >
                      <Icon name={robot.icon} size={19} />
                    </span>
                    <div>
                      <h3 className="mono text-[0.78rem] tracking-[0.22em] text-[var(--text)]">
                        {robot.name}
                      </h3>
                      <p className="mt-1 text-[0.7rem] text-[var(--muted)]">{STATE_LABEL[info.state]}</p>
                    </div>
                  </div>
                  <span className="status-dot" data-state={info.state} title={STATE_LABEL[info.state]} aria-hidden />
                </div>

                <p className="mt-4 text-[0.82rem] leading-relaxed text-[var(--text-soft)]">{robot.role}</p>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-4">
                  {robot.metrics(info).map((metric) => (
                    <div key={metric.label}>
                      <p className="mono text-[1.02rem] leading-none text-[var(--text)]">{metric.value}</p>
                      <p className="mt-1.5 font-mono text-[0.56rem] uppercase tracking-[0.12em] text-[var(--faint)]">
                        {metric.label}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-[0.7rem] leading-relaxed text-[var(--muted)]">{info.summary}</p>
                <p className="mt-2 font-mono text-[0.6rem] text-[var(--faint)]">
                  Last run {formatRelativeTime(info.lastRunAt)}
                </p>
              </article>
            );
          })}
        </div>

        <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.68rem] text-[var(--faint)]">
          <Icon name="RefreshCw" size={11} />
          Cron <code className="mono text-[var(--muted)]">{metadata.schedule}</code> ·{' '}
          {metadata.scheduleNote}
        </p>
      </div>
    </section>
  );
}
