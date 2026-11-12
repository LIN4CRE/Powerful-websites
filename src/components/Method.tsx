import { Icon } from './Icon';

const STEPS = [
  {
    number: '01',
    title: 'Discover',
    icon: 'Radar',
    copy: 'The scout reads public repositories, curated lists, RSS feeds and GitHub search results. Sources are declared in a config file, rate limits are respected, and one failing source never stops the rest.',
  },
  {
    number: '02',
    title: 'Verify',
    icon: 'ScanSearch',
    copy: 'Every candidate is loaded in a fresh headless browser with no cookies or saved state. The verifier looks for login walls, email-verification gates, paywalls and API-key requirements, and retries transient network failures before deciding.',
  },
  {
    number: '03',
    title: 'Maintain',
    icon: 'Layers',
    copy: 'Only verified entries are published. The curator de-duplicates domains, repairs categories and tags, and re-checks older listings. A site that starts demanding an account is removed until it passes again.',
  },
];

export function Method() {
  return (
    <section id="method" className="scroll-mt-24 border-t border-[var(--border)] py-16">
      <div className="shell">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">How this stays trustworthy</p>
            <h2 className="mt-3 text-[clamp(1.6rem,3.4vw,2.3rem)] font-semibold tracking-[-0.02em]">
              The rule is simple. <span className="text-[var(--muted)]">Useful without an account.</span>
            </h2>
          </div>
          <p className="max-w-sm text-[0.8rem] leading-relaxed text-[var(--muted)]">
            No sponsored placements, no fabricated ratings and no “verified” badges that were never
            earned.
          </p>
        </div>

        <div className="stagger mt-9 grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => (
            <article key={step.number} className="panel-solid relative p-5">
              <div className="flex items-center justify-between">
                <span className="mono text-[0.66rem] tracking-[0.2em] text-[var(--accent)]">{step.number}</span>
                <Icon name={step.icon} size={17} className="text-[var(--muted)]" />
              </div>
              <h3 className="mt-5 text-[1.02rem] font-semibold tracking-[-0.01em]">{step.title}</h3>
              <p className="mt-2.5 text-[0.8rem] leading-relaxed text-[var(--muted)]">{step.copy}</p>
            </article>
          ))}
        </div>

        <div className="panel mt-4 grid gap-4 p-5 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <Icon name="ShieldCheck" size={16} className="mt-0.5 text-[var(--success)]" />
            <div>
              <p className="text-[0.8rem] font-medium">No account requirement</p>
              <p className="mt-1 text-[0.72rem] leading-relaxed text-[var(--muted)]">
                A login button in the header is fine. A login wall that blocks the advertised tool
                is not.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Icon name="Code2" size={16} className="mt-0.5 text-[var(--violet-400)]" />
            <div>
              <p className="text-[0.8rem] font-medium">Open source only when proven</p>
              <p className="mt-1 text-[0.72rem] leading-relaxed text-[var(--muted)]">
                The badge appears only where the project’s own licence has been confirmed — free
                and open source are different things.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Icon name="Activity" size={16} className="mt-0.5 text-[var(--accent)]" />
            <div>
              <p className="text-[0.8rem] font-medium">Honest timestamps</p>
              <p className="mt-1 text-[0.72rem] leading-relaxed text-[var(--muted)]">
                Every date comes from a completed workflow run, not from a schedule or an
                assumption.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
