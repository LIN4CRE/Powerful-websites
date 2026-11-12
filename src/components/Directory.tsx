import { useEffect, useMemo, useState } from 'react';
import { Icon } from './Icon';
import { SiteCard } from './SiteCard';
import type { Category, Site } from '../lib/types';
import type { SortKey } from '../lib/search';

interface DirectoryProps {
  sites: Site[];
  totalSites: number;
  categories: Category[];
  counts: Map<string, number>;
  query: string;
  onQueryChange: (value: string) => void;
  category: string | null;
  onCategoryChange: (value: string | null) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  openSourceOnly: boolean;
  onToggleOpenSource: () => void;
  savedOnly: boolean;
  onToggleSavedOnly: () => void;
  savedCount: number;
  saved: Set<string>;
  onToggleSave: (id: string) => void;
  onResetFilters: () => void;
  totalVerified: number;
}

const PAGE_SIZE = 36;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Curated order' },
  { value: 'newest', label: 'Newest first' },
  { value: 'name', label: 'A → Z' },
  { value: 'verified', label: 'Recently verified' },
];

export function Directory({
  sites,
  totalSites,
  categories,
  counts,
  query,
  onQueryChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  openSourceOnly,
  onToggleOpenSource,
  savedOnly,
  onToggleSavedOnly,
  savedCount,
  saved,
  onToggleSave,
  onResetFilters,
  totalVerified,
}: DirectoryProps) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, category, sort, openSourceOnly, savedOnly, totalSites]);

  const categoryById = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);
  const filtersActive = query.trim() !== '' || category !== null || openSourceOnly || savedOnly;
  const shown = sites.slice(0, visible);

  return (
    <section id="directory" className="scroll-mt-20 border-t border-[var(--border)] py-14">
      <div className="shell">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">The directory</p>
            <h2 className="mt-3 text-[clamp(1.6rem,3.4vw,2.3rem)] font-semibold tracking-[-0.02em]">
              {totalVerified.toLocaleString()} websites worth your time.
            </h2>
            <p className="mt-3 max-w-2xl text-[0.88rem] leading-relaxed text-[var(--muted)]">
              Every entry below was reviewed against its live page and confirmed usable
              without an account. Click any card to go straight to the official site.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="sort">
              Sort websites
            </label>
            <select
              id="sort"
              className="select"
              value={sort}
              onChange={(event) => onSortChange(event.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="control"
              aria-pressed={openSourceOnly}
              onClick={onToggleOpenSource}
              title="Only show projects whose source licence has been confirmed"
            >
              <Icon name="Code2" size={14} />
              Open source
            </button>

            <button
              type="button"
              className="control"
              aria-pressed={savedOnly}
              onClick={onToggleSavedOnly}
              title="Show the sites you saved in this browser"
            >
              <Icon name="Bookmark" size={14} />
              Saved
              {savedCount > 0 && <span className="count-pill">{savedCount}</span>}
            </button>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="search-field h-[46px]">
            <Icon name="Search" size={16} className="text-[var(--accent)]" />
            <label htmlFor="directory-search" className="sr-only">
              Filter the directory
            </label>
            <input
              id="directory-search"
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Filter by name, description, category, tag or feature…"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                aria-label="Clear filter"
                className="rounded p-1 text-[var(--muted)] hover:text-[var(--text)]"
              >
                <Icon name="X" size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="control h-[46px] justify-start sm:justify-center"
            onClick={onResetFilters}
            disabled={!filtersActive}
            style={{ opacity: filtersActive ? 1 : 0.45, cursor: filtersActive ? 'pointer' : 'not-allowed' }}
          >
            <Icon name="SlidersHorizontal" size={14} />
            Reset filters
          </button>
        </div>

        <div className="scroll-x -mx-1 mt-4 flex items-center gap-2 px-1 pb-1">
          <button
            type="button"
            className="chip"
            aria-pressed={category === null}
            onClick={() => onCategoryChange(null)}
          >
            <Icon name="Layers" size={12} />
            All websites
            <span className="count-pill">{totalSites}</span>
          </button>
          {categories.map((item) => {
            const count = counts.get(item.id) ?? 0;
            return (
              <button
                key={item.id}
                type="button"
                className="chip"
                aria-pressed={category === item.id}
                onClick={() => onCategoryChange(category === item.id ? null : item.id)}
                aria-label={`${item.name} — ${count} websites`}
                style={count === 0 ? { opacity: 0.55 } : undefined}
              >
                <Icon name={item.icon} size={12} />
                {item.name.split(' & ')[0]}
                <span className="count-pill">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.76rem] text-[var(--muted)]" role="status" aria-live="polite">
            {sites.length === 0 ? (
              'No websites match these filters.'
            ) : (
              <>
                Showing <span className="text-[var(--text)]">{shown.length.toLocaleString()}</span> of{' '}
                <span className="text-[var(--text)]">{sites.length.toLocaleString()}</span> matching
                {sites.length === totalVerified ? ' verified' : ' filtered'} websites
              </>
            )}
            {category && categoryById.get(category) && (
              <span className="text-[var(--faint)]"> · {categoryById.get(category)?.name}</span>
            )}
          </p>
          {filtersActive && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[0.72rem] text-[var(--accent)] transition-opacity hover:opacity-80"
            >
              Clear all filters
            </button>
          )}
        </div>

        {shown.length > 0 ? (
          <div className="stagger mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                category={categoryById.get(site.category)}
                saved={saved.has(site.id)}
                onToggleSave={onToggleSave}
                query={query}
              />
            ))}
          </div>
        ) : (
          <div className="panel mt-4 flex flex-col items-center justify-center px-6 py-20 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel)]">
              <Icon name={totalVerified === 0 ? 'Radar' : 'Search'} size={20} className="text-[var(--muted)]" />
            </span>
            <h3 className="text-[1.05rem] font-medium">
              {totalVerified === 0 ? 'The first verification pass is running' : 'Nothing matches those filters yet'}
            </h3>
            <p className="mt-2 max-w-md text-[0.82rem] leading-relaxed text-[var(--muted)]">
              {totalVerified === 0
                ? 'Candidates are queued. This directory only publishes a site after the verifier has reviewed it and confirmed it works without an account.'
                : 'Try a broader search term, pick another category, or clear the filters to see the whole directory.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {filtersActive && (
                <button type="button" className="control" onClick={onResetFilters}>
                  <Icon name="X" size={14} />
                  Clear filters
                </button>
              )}
              <a
                href="https://github.com/LIN4CRE/Powerful-websites/actions/workflows/scan.yml"
                target="_blank"
                rel="noopener noreferrer"
                className="control"
              >
                <Icon name="Github" size={14} />
                View verification runs
              </a>
            </div>
          </div>
        )}

        {visible < sites.length && (
          <div className="mt-8 flex flex-col items-center gap-2">
            <button type="button" className="control px-5" onClick={() => setVisible((value) => value + PAGE_SIZE)}>
              <Icon name="ArrowDownUp" size={14} />
              Show more websites
            </button>
            <p className="mono text-[0.62rem] text-[var(--faint)]">
              {Math.min(visible, sites.length)} / {sites.length} shown
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
