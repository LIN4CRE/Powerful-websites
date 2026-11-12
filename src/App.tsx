import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { LiveStrip } from './components/LiveStrip';
import { Stats } from './components/Stats';
import { Robots } from './components/Robots';
import { Directory } from './components/Directory';
import { Method } from './components/Method';
import { Footer } from './components/Footer';
import { CommandPalette } from './components/CommandPalette';
import { data, stats } from './lib/data';
import { buildIndex, categoryCounts, filterSites, type SortKey } from './lib/search';
import { useTheme } from './hooks/useTheme';
import { useSavedSites } from './hooks/useSavedSites';

export default function App() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('featured');
  const [openSourceOnly, setOpenSourceOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const deferredQuery = useDeferredValue(query);
  const { theme, toggle: toggleTheme } = useTheme();
  const { saved, toggle: toggleSave, count: savedCount } = useSavedSites();

  const index = useMemo(() => buildIndex(data.sites), []);
  const counts = useMemo(() => categoryCounts(data.sites), []);
  const sites = useMemo(
    () =>
      filterSites(index, {
        query: deferredQuery,
        category,
        sort,
        openSourceOnly,
        savedOnly,
        savedIds: saved,
      }),
    [index, deferredQuery, category, sort, openSourceOnly, savedOnly, saved],
  );

  const resetFilters = useCallback(() => {
    setQuery('');
    setCategory(null);
    setOpenSourceOnly(false);
    setSavedOnly(false);
    setSort('featured');
  }, []);

  const scrollToDirectory = useCallback(() => {
    document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const selectCategory = useCallback(
    (id: string | null) => {
      setCategory(id);
      scrollToDirectory();
    },
    [scrollToDirectory],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable === true;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (event.key === '/' && !typing && !paletteOpen) {
        event.preventDefault();
        heroInputRef.current?.focus();
        heroInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (event.key === 'Escape' && paletteOpen) setPaletteOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paletteOpen]);

  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Powerful Websites',
      url: 'https://lin4cre.github.io/Powerful-websites/',
      description:
        'A continuously verified directory of websites that work without an account or login.',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: data.sites.length,
        itemListElement: data.sites.slice(0, 25).map((site, position) => ({
          '@type': 'ListItem',
          position: position + 1,
          name: site.name,
          url: site.url,
          description: site.description,
        })),
      },
    }),
    [],
  );

  return (
    <div className="relative min-h-screen">
      <a className="skip-link" href="#directory">
        Skip to the directory
      </a>

      <Header
        onOpenSearch={() => setPaletteOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        metadata={data.metadata}
        isStale={stats.isStale}
      />

      <main id="main">
        <Hero
          query={query}
          onQueryChange={setQuery}
          onQuickFilter={selectCategory}
          total={data.sites.length}
          inputRef={heroInputRef}
        />

        <LiveStrip
          metadata={data.metadata}
          isStale={stats.isStale}
          verifiedCount={stats.verifiedSites}
          pendingCount={stats.pendingCandidates}
        />

        <Stats stats={stats} metadata={data.metadata} sourceCount={data.sources.filter((s) => s.enabled).length} />

        <Robots metadata={data.metadata} />

        <Directory
          sites={sites}
          totalSites={data.sites.length}
          categories={data.categories}
          counts={counts}
          query={query}
          onQueryChange={setQuery}
          category={category}
          onCategoryChange={setCategory}
          sort={sort}
          onSortChange={setSort}
          openSourceOnly={openSourceOnly}
          onToggleOpenSource={() => setOpenSourceOnly((value) => !value)}
          savedOnly={savedOnly}
          onToggleSavedOnly={() => setSavedOnly((value) => !value)}
          savedCount={savedCount}
          saved={saved}
          onToggleSave={toggleSave}
          onResetFilters={resetFilters}
          totalVerified={data.sites.length}
        />

        <Method />
      </main>

      <Footer metadata={data.metadata} siteCount={data.sites.length} categoryCount={stats.categoriesInUse} />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        sites={data.sites}
        categories={data.categories}
        onSelectCategory={selectCategory}
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </div>
  );
}
