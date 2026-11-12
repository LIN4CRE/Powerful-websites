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
import { InstallCard } from './components/InstallCard';
import { ConnectionBanner, DataFreshness } from './components/ConnectionBanner';
import { UpdateToast } from './components/UpdateToast';
import { BackToTop } from './components/BackToTop';
import { buildIndex, categoryCounts, filterSites, type SortKey } from './lib/search';
import { useTheme } from './hooks/useTheme';
import { useSavedSites } from './hooks/useSavedSites';
import { useDirectory } from './hooks/useDirectory';

const SITE_URL =
  typeof window === 'undefined' ? 'https://powerful-websites.vercel.app/' : window.location.origin + '/';

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
  const { directory, stats, origin, generatedAt, cachedAt, online } = useDirectory();
  const { sites: allSites, categories, metadata, sources, candidates } = directory;

  const index = useMemo(() => buildIndex(allSites), [allSites]);
  const counts = useMemo(() => categoryCounts(allSites), [allSites]);
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
      url: SITE_URL,
      description:
        'A continuously verified directory of websites that work without an account or login.',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: allSites.length,
        itemListElement: allSites.slice(0, 25).map((site, position) => ({
          '@type': 'ListItem',
          position: position + 1,
          name: site.name,
          url: site.url,
          description: site.description,
        })),
      },
    }),
    [allSites],
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
        metadata={metadata}
        isStale={stats.isStale}
      />

      <ConnectionBanner online={online} generatedAt={generatedAt} cachedAt={cachedAt} />

      <main id="main">
        <Hero
          query={query}
          onQueryChange={setQuery}
          onQuickFilter={selectCategory}
          total={allSites.length}
          inputRef={heroInputRef}
        />

        <LiveStrip
          metadata={metadata}
          isStale={stats.isStale}
          verifiedCount={stats.verifiedSites}
          pendingCount={stats.pendingCandidates}
        />

        <div className="shell -mt-2">
          <DataFreshness origin={origin} generatedAt={generatedAt} />
        </div>

        <Stats
          stats={stats}
          metadata={metadata}
          sourceCount={sources.filter((s) => s.enabled).length}
        />

        <Robots metadata={metadata} pendingCount={stats.pendingCandidates} candidates={candidates} />

        <Directory
          sites={sites}
          totalSites={allSites.length}
          categories={categories}
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
          totalVerified={allSites.length}
        />

        <Method />
      </main>

      <Footer metadata={metadata} siteCount={allSites.length} categoryCount={stats.categoriesInUse} />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        sites={allSites}
        categories={categories}
        onSelectCategory={selectCategory}
      />

      <InstallCard />
      <UpdateToast />
      <BackToTop />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </div>
  );
}
