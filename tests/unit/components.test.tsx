import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteCard } from '../../src/components/SiteCard';
import { Directory } from '../../src/components/Directory';
import { makeSite, sampleSites } from './fixtures';
import { categoryCounts } from '../../src/lib/search';
import type { Site } from '../../src/lib/types';

describe('SiteCard', () => {
  it('links directly to the official site with safe external attributes', () => {
    render(<SiteCard site={sampleSites[0]!} saved={false} onToggleSave={() => undefined} />);
    const link = screen.getByRole('link', { name: /squoosh — opens the official website/i });
    expect(link).toHaveAttribute('href', 'https://squoosh.app');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.getAttribute('rel')).toContain('noreferrer');
  });

  it('shows the required trust badges', () => {
    render(<SiteCard site={sampleSites[0]!} saved={false} onToggleSave={() => undefined} />);
    expect(screen.getByText('No login required')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.queryByText('Open source')).not.toBeInTheDocument();
  });

  it('shows the open-source badge only when confirmed', () => {
    render(<SiteCard site={sampleSites[1]!} saved={false} onToggleSave={() => undefined} />);
    expect(screen.getByText('Open source')).toBeInTheDocument();
  });

  it('falls back to a monogram when no logo is available', () => {
    render(<SiteCard site={sampleSites[0]!} saved={false} onToggleSave={() => undefined} />);
    expect(screen.getByText('SQ')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('uses a stored local logo when one exists', () => {
    const site = makeSite({ id: 'logo-site', name: 'Logo Site', icon: 'logos/logo-site.png' });
    render(<SiteCard site={site} saved={false} onToggleSave={() => undefined} />);
    const image = document.querySelector('.card-logo img');
    expect(image).toHaveAttribute('src', '/logos/logo-site.png');
    expect(image).toHaveAttribute('alt', '');
  });

  it('toggles the local bookmark without navigating', async () => {
    const user = userEvent.setup();
    const onToggleSave = vi.fn();
    render(<SiteCard site={sampleSites[0]!} saved={false} onToggleSave={onToggleSave} />);
    const button = screen.getByRole('button', { name: /save squoosh for later/i });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await user.click(button);
    expect(onToggleSave).toHaveBeenCalledWith('squoosh');
  });

  it('marks a saved card as pressed', () => {
    render(<SiteCard site={sampleSites[0]!} saved onToggleSave={() => undefined} />);
    expect(screen.getByRole('button', { name: /remove squoosh from saved sites/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('renders a category label and tags', () => {
    render(
      <SiteCard
        site={sampleSites[0]!}
        category={{ id: 'image', name: 'Image & Photography', icon: 'Image', description: 'Image tools' }}
        saved={false}
        onToggleSave={() => undefined}
      />,
    );
    expect(screen.getByText('Image')).toBeInTheDocument();
    expect(screen.getByText('images')).toBeInTheDocument();
  });
});

function renderDirectory(overrides: Partial<React.ComponentProps<typeof Directory>> = {}) {
  const sites = (overrides.sites ?? sampleSites) as Site[];
  const props = {
    sites,
    totalSites: sites.length,
    categories: [
      { id: 'developer', name: 'Developer Tools', icon: 'Terminal', description: 'Developer utilities' },
      { id: 'image', name: 'Image & Photography', icon: 'Image', description: 'Image tools' },
      { id: 'productivity', name: 'Productivity', icon: 'ListChecks', description: 'Productivity tools' },
      { id: 'data', name: 'Data & Analytics', icon: 'BarChart3', description: 'Data tools' },
      { id: 'maps', name: 'Maps & Geography', icon: 'Map', description: 'Map tools' },
    ],
    counts: categoryCounts(sites),
    query: '',
    onQueryChange: vi.fn(),
    category: null,
    onCategoryChange: vi.fn(),
    sort: 'featured' as const,
    onSortChange: vi.fn(),
    openSourceOnly: false,
    onToggleOpenSource: vi.fn(),
    savedOnly: false,
    onToggleSavedOnly: vi.fn(),
    savedCount: 0,
    saved: new Set<string>(),
    onToggleSave: vi.fn(),
    onResetFilters: vi.fn(),
    totalVerified: sites.length,
    ...overrides,
  };
  render(<Directory {...props} />);
  return props;
}

describe('Directory', () => {
  it('renders a card per site with the result count', () => {
    renderDirectory();
    expect(screen.getByText('4 websites worth your time.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /squoosh/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /excalidraw/i })).toBeInTheDocument();
  });

  it('reports the active category and clears it on the All websites chip', async () => {
    const user = userEvent.setup();
    const props = renderDirectory({ category: 'image' });
    expect(screen.getByText(/Image & Photography/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /all websites/i }));
    expect(props.onCategoryChange).toHaveBeenCalledWith(null);
  });

  it('filters through the category chips', async () => {
    const user = userEvent.setup();
    const props = renderDirectory();
    await user.click(screen.getByRole('button', { name: /image & photography — 1 websites/i }));
    expect(props.onCategoryChange).toHaveBeenCalledWith('image');
  });

  it('changes sort order', async () => {
    const user = userEvent.setup();
    const props = renderDirectory();
    await user.selectOptions(screen.getByLabelText('Sort websites'), 'name');
    expect(props.onSortChange).toHaveBeenCalledWith('name');
  });

  it('toggles the open-source filter', async () => {
    const user = userEvent.setup();
    const props = renderDirectory();
    await user.click(screen.getByRole('button', { name: /open source/i }));
    expect(props.onToggleOpenSource).toHaveBeenCalled();
  });

  it('shows an honest empty state when filters match nothing', () => {
    renderDirectory({ sites: [], totalSites: 4, totalVerified: 4, query: 'zzz' });
    expect(screen.getByText(/nothing matches those filters yet/i)).toBeInTheDocument();
    expect(screen.queryAllByRole('link', { name: /opens the official website/i })).toHaveLength(0);
  });

  it('explains the first-run state when the directory is empty', () => {
    renderDirectory({ sites: [], totalSites: 0, totalVerified: 0 });
    expect(screen.getByText(/the first verification pass is running/i)).toBeInTheDocument();
  });

  it('paginates large result sets', async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 45 }, (_, position) =>
      makeSite({ id: `site-${position}`, name: `Site ${position}`, domain: `site-${position}.example` }),
    );
    renderDirectory({ sites: many });
    expect(screen.getAllByRole('link', { name: /opens the official website/i })).toHaveLength(36);
    await user.click(screen.getByRole('button', { name: /show more websites/i }));
    expect(screen.getAllByRole('link', { name: /opens the official website/i })).toHaveLength(45);
    expect(screen.queryByRole('button', { name: /show more websites/i })).not.toBeInTheDocument();
  });

  it('keeps the card grid keyboard reachable', () => {
    renderDirectory();
    const cards = screen.getAllByRole('link', { name: /opens the official website/i });
    for (const card of cards) expect(card).toHaveAttribute('href');
  });
});

describe('category counts', () => {
  it('are derived from the published sites', () => {
    const counts = categoryCounts(sampleSites);
    const total = [...counts.values()].reduce((sum, value) => sum + value, 0);
    expect(total).toBe(sampleSites.length);
  });
});

describe('SiteCard metadata', () => {
  it('exposes the verification timestamp', () => {
    render(<SiteCard site={sampleSites[0]!} saved={false} onToggleSave={() => undefined} />);
    const time = document.querySelector('time');
    expect(time).not.toBeNull();
    expect(time?.getAttribute('datetime')).toBe(sampleSites[0]!.lastVerifiedAt);
    expect(within(time!).getByText(/verified/i)).toBeInTheDocument();
  });
});
