import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';
import { data } from '../../src/lib/data';

describe('application shell', () => {
  it('renders the hero headline and supporting copy', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/discover websites you/i);
    expect(screen.getByText(/no accounts\. no unnecessary barriers/i)).toBeInTheDocument();
  });

  it('shows the visitor clock and the live status strip', () => {
    render(<App />);
    expect(screen.getByText(/current date & time/i)).toBeInTheDocument();
    expect(screen.getByText(/last searched/i)).toBeInTheDocument();
    expect(screen.getByText(/scan frequency/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^\d{2}:\d{2}:\d{2}$/).length).toBeGreaterThan(0);
  });

  it('renders the three automation robots with real metadata', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'SCOUT' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'VERIFIER' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'CURATOR' })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(data.metadata.schedule.replace(/[*,]/g, '\\$&')))).toBeInTheDocument();
  });

  it('exposes the directory and starts with the real published count', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: new RegExp(`${data.sites.length} websites worth your time`) })).toBeInTheDocument();
  });

  it('links to the public workflow history', () => {
    render(<App />);
    const links = screen.getAllByRole('link', { name: /workflow history/i });
    expect(links[0]).toHaveAttribute('href', data.metadata.workflow.historyUrl);
    expect(links[0]).toHaveAttribute('target', '_blank');
  });

  it('documents that no trackers or accounts are used', () => {
    render(<App />);
    expect(screen.getByText(/no accounts · no trackers · no cookies/i)).toBeInTheDocument();
  });
});

describe('keyboard and search', () => {
  it('opens the command palette with Ctrl+K and closes on Escape', async () => {
    const user = userEvent.setup();
    render(<App />);
    const dialog = screen.getByRole('dialog', { hidden: true }) as HTMLDialogElement;
    expect(dialog.open).toBe(false);

    await user.keyboard('{Control>}k{/Control}');
    await waitFor(() => expect(dialog.open).toBe(true));
    const searchInput = screen.getByLabelText('Search query');
    await waitFor(() => expect(searchInput).toHaveFocus());

    await user.keyboard('{Escape}');
    await waitFor(() => expect(dialog.open).toBe(false));
  });

  it('shows a helpful empty state in the palette when nothing matches', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard('{Control>}k{/Control}');
    await user.type(screen.getByLabelText('Search query'), 'zzzzzz');
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(within(dialog).getByText(/no websites match/i)).toBeInTheDocument();
  });

  it('filters the directory as the visitor types', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText('Filter the directory');
    await user.type(input, 'zzzzzz');
    expect(await screen.findByText(/no websites match these filters|nothing matches those filters/i)).toBeInTheDocument();
  });
});

describe('theme', () => {
  it('switches between dark and light and persists the choice', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('dark');

    await user.click(screen.getByRole('button', { name: /switch to light theme/i }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem('pw:theme')).toBe('light');

    await user.click(screen.getByRole('button', { name: /switch to dark theme/i }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
