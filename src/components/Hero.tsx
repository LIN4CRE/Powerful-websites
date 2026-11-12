import { Icon } from './Icon';

interface HeroProps {
  query: string;
  onQueryChange: (value: string) => void;
  onQuickFilter: (category: string | null) => void;
  total: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const QUICK_LINKS = [
  { label: 'Compress images', query: 'compress' },
  { label: 'Regex', query: 'regex' },
  { label: 'Maps', category: 'maps' },
  { label: 'Privacy checks', category: 'privacy' },
  { label: 'Unusual', category: 'unusual' },
];

export function Hero({ query, onQueryChange, onQuickFilter, total, inputRef }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden pb-10 pt-16 sm:pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div
          className="hero-glow"
          style={{
            width: 520,
            height: 520,
            top: -220,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, rgba(56,232,255,0.32), transparent 65%)',
          }}
        />
        <div
          className="hero-glow"
          style={{
            width: 420,
            height: 420,
            top: -60,
            right: '8%',
            background: 'radial-gradient(circle, rgba(79,140,255,0.22), transparent 68%)',
            animationDelay: '-6s',
          }}
        />
        <div className="orbit-ring left-1/2 top-[-340px] h-[720px] w-[720px] -translate-x-1/2 opacity-40" />
        <div className="orbit-ring left-1/2 top-[-260px] h-[560px] w-[560px] -translate-x-1/2 opacity-30" />
        <div className="noise" />
      </div>

      <div className="shell flex flex-col items-center text-center">
        <div className="reveal inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5">
          <span className="status-dot status-dot--pulse" data-state="ok" aria-hidden />
          <span className="eyebrow text-[0.6rem]">The open web, verified continuously</span>
        </div>

        <h1 className="reveal mt-7 max-w-4xl text-balance text-[clamp(2.4rem,6.4vw,4.6rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
          Discover websites you
          <br className="hidden sm:block" />{' '}
          <span className="gradient-text">didn&apos;t know existed.</span>
        </h1>

        <p className="reveal mt-6 max-w-2xl text-pretty text-[0.98rem] leading-relaxed text-[var(--muted)] sm:text-[1.05rem]">
          An ever-growing collection of powerful websites. No accounts. No unnecessary barriers.
          Just useful things.
        </p>

        <div className="reveal mt-9 w-full max-w-2xl">
          <label htmlFor="hero-search" className="sr-only">
            Search the directory
          </label>
          <div className="search-field h-[58px] shadow-[0_24px_60px_-40px_rgba(56,232,255,0.55)]">
            <Icon name="Search" size={19} className="text-[var(--accent)]" />
            <input
              ref={inputRef}
              id="hero-search"
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={
                total > 0
                  ? `Search ${total.toLocaleString()} verified websites, categories or tags…`
                  : 'Search verified websites, categories or tags…'
              }
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
            />
            {query ? (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                className="rounded-md p-1 text-[var(--muted)] transition-colors hover:text-[var(--text)]"
                aria-label="Clear search"
              >
                <Icon name="X" size={16} />
              </button>
            ) : (
              <kbd className="kbd hidden sm:inline-flex">
                <span className="px-0.5">CTRL</span>K
              </kbd>
            )}
          </div>
        </div>

        <div className="reveal mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="eyebrow mr-1 text-[0.58rem]">Try</span>
          {QUICK_LINKS.map((link) => (
            <button
              key={link.label}
              type="button"
              className="chip text-[0.7rem]"
              onClick={() => {
                if (link.query) onQueryChange(link.query);
                if (link.category) onQuickFilter(link.category);
              }}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
