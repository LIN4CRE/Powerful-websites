import { Icon } from './Icon';
import { LogoMark, Wordmark } from './Logo';
import type { ScanMetadata } from '../lib/types';
import { formatAbsoluteTime, formatRelativeTime } from '../lib/format';

interface FooterProps {
  metadata: ScanMetadata;
  siteCount: number;
  categoryCount: number;
}

const REPO = 'https://github.com/LIN4CRE/Powerful-websites';

export function Footer({ metadata, siteCount, categoryCount }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-[var(--border)] pb-10 pt-14">
      <div className="shell">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
          <div>
            <a href="#top" className="inline-flex items-center gap-3" aria-label="Back to top">
              <LogoMark size={30} />
              <Wordmark compact />
            </a>
            <p className="mt-4 max-w-xs text-[0.8rem] leading-relaxed text-[var(--muted)]">
              A continuously updated directory of the most useful corners of the open web —
              verified to work without an account.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--faint)]">
              <span className="status-dot" data-state={metadata.status === 'failed' ? 'failed' : metadata.status === 'partial' ? 'degraded' : 'ok'} aria-hidden />
              {siteCount} verified · {categoryCount} categories
            </p>
          </div>

          <nav aria-label="Directory">
            <h2 className="eyebrow text-[0.58rem]">Explore</h2>
            <ul className="mt-4 space-y-2.5 text-[0.8rem]">
              <li><a href="#directory" className="link-underline">All websites</a></li>
              <li><a href="#automation" className="link-underline">Automation status</a></li>
              <li><a href="#method" className="link-underline">Verification method</a></li>
              <li>
                <a href={`${REPO}#readme`} target="_blank" rel="noopener noreferrer" className="link-underline">
                  Documentation
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label="Data and source">
            <h2 className="eyebrow text-[0.58rem]">Open data</h2>
            <ul className="mt-4 space-y-2.5 text-[0.8rem]">
              <li>
                <a href={`${REPO}/blob/main/data/sites.json`} target="_blank" rel="noopener noreferrer" className="link-underline">
                  sites.json
                </a>
              </li>
              <li>
                <a href={`${REPO}/blob/main/data/candidates.json`} target="_blank" rel="noopener noreferrer" className="link-underline">
                  candidates.json
                </a>
              </li>
              <li>
                <a href={`${REPO}/blob/main/data/scan-metadata.json`} target="_blank" rel="noopener noreferrer" className="link-underline">
                  scan-metadata.json
                </a>
              </li>
              <li>
                <a href={`${REPO}/blob/main/data/sources.json`} target="_blank" rel="noopener noreferrer" className="link-underline">
                  discovery sources
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label="Platform">
            <h2 className="eyebrow text-[0.58rem]">Platform</h2>
            <ul className="mt-4 space-y-2.5 text-[0.8rem]">
              <li>
                <a href={REPO} target="_blank" rel="noopener noreferrer" className="link-underline inline-flex items-center gap-1.5">
                  <Icon name="Github" size={13} /> Source code
                </a>
              </li>
              <li>
                <a href={metadata.workflow.historyUrl} target="_blank" rel="noopener noreferrer" className="link-underline inline-flex items-center gap-1.5">
                  <Icon name="RefreshCw" size={13} /> Scan workflow
                </a>
              </li>
              <li>
                <a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer" className="link-underline">
                  MIT licence
                </a>
              </li>
              <li>
                <a href={`${REPO}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer" className="link-underline">
                  Contribute
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="hairline my-8" />

        <div className="flex flex-col gap-4 text-[0.68rem] text-[var(--faint)] lg:flex-row lg:items-center lg:justify-between">
          <p>
            © {year} Powerful Websites. Original project code released under the MIT licence.
            Third-party names and logos belong to their owners.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="ShieldCheck" size={12} /> No accounts · no trackers · no cookies
            </span>
            <span className="inline-flex items-center gap-1.5" title={formatAbsoluteTime(metadata.lastSuccessfulScanAt)}>
              <Icon name="RefreshCw" size={12} /> Updated {formatRelativeTime(metadata.lastSuccessfulScanAt)}
            </span>
          </div>
        </div>

        <p className="mt-4 text-[0.62rem] leading-relaxed text-[var(--faint)]/80">
          Powerful Websites is an independent directory. Listings link directly to official sites;
          we do not host, proxy or alter them. Verification reflects an automated browser check at a
          point in time — sites can change, and reports of regressions are welcome via GitHub issues.
        </p>
      </div>
    </footer>
  );
}
