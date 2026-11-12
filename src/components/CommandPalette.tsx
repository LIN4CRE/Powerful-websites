import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';
import { buildIndex, filterSites } from '../lib/search';
import type { Category, Site } from '../lib/types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  sites: Site[];
  categories: Category[];
  onSelectCategory: (id: string | null) => void;
}

export function CommandPalette({ open, onClose, sites, categories, onSelectCategory }: CommandPaletteProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const index = useMemo(() => buildIndex(sites), [sites]);
  const categoryById = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);

  const results = useMemo(() => {
    const filtered = filterSites(index, { query, sort: query ? 'featured' : 'verified' });
    return filtered.slice(0, 8);
  }, [index, query]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setQuery('');
      setActive(0);
      dialog.showModal();
      window.setTimeout(() => inputRef.current?.focus(), 30);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  return (
    <dialog
      ref={dialogRef}
      className="palette"
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      aria-label="Search the directory"
    >
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
        <Icon name="Search" size={17} className="text-[var(--accent)]" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActive((value) => Math.min(value + 1, results.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((value) => Math.max(value - 1, 0));
            } else if (event.key === 'Enter') {
              const target = results[active];
              if (target) {
                event.preventDefault();
                window.open(target.url, '_blank', 'noopener,noreferrer');
                onClose();
              }
            }
          }}
          placeholder="Search websites, categories, tags…"
          className="h-14 w-full bg-transparent text-[0.95rem] text-[var(--text)] outline-none placeholder:text-[var(--faint)]"
          aria-label="Search query"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-[var(--muted)] transition-colors hover:text-[var(--text)]"
          aria-label="Close search"
        >
          <Icon name="X" size={16} />
        </button>
      </div>

      <div className="max-h-[52vh] overflow-y-auto p-2">
        {results.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[0.86rem] text-[var(--text-soft)]">No websites match “{query}”.</p>
            <p className="mt-1 text-[0.74rem] text-[var(--muted)]">
              Try a category such as “design”, “maps” or “privacy”.
            </p>
          </div>
        ) : (
          <ul className="space-y-1" aria-label="Search results">
            {results.map((site, position) => {
              const category = categoryById.get(site.category);
              return (
                <li key={site.id}>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setActive(position)}
                    onClick={onClose}
                    className="palette-result flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors"
                    data-active={position === active}
                  >
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-[var(--border)] bg-white/[0.03] text-[var(--accent)]">
                      <Icon name={category?.icon ?? 'Globe'} size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.86rem] font-medium">{site.name}</span>
                      <span className="mono block truncate text-[0.62rem] text-[var(--faint)]">
                        {site.domain}
                        {category ? ` · ${category.name}` : ''}
                      </span>
                    </span>
                    <Icon name="ExternalLink" size={13} className="text-[var(--faint)]" />
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] px-4 py-2.5 text-[0.62rem] text-[var(--faint)]">
        <span className="inline-flex items-center gap-1"><span className="kbd">↑</span><span className="kbd">↓</span> navigate</span>
        <span className="inline-flex items-center gap-1"><span className="kbd">↵</span> open</span>
        <span className="inline-flex items-center gap-1"><span className="kbd">esc</span> close</span>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-1 transition-colors hover:text-[var(--text-soft)]"
          onClick={() => {
            onSelectCategory('privacy');
            onClose();
          }}
        >
          <Icon name="ShieldCheck" size={11} /> privacy picks
        </button>
      </div>
    </dialog>
  );
}
