import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import {
  INSTALL_SNOOZE_MS,
  isIosDevice,
  shouldOfferInstall,
} from '../../src/hooks/useInstallPrompt';
import { InstallCard } from '../../src/components/InstallCard';
import { ConnectionBanner } from '../../src/components/ConnectionBanner';
import { UpdateToast } from '../../src/components/UpdateToast';
import { setPwaState, resetPwaState } from '../../src/pwa/state';

const base = {
  installed: false,
  standalone: false,
  canPrompt: true,
  ios: false,
  dismissedAt: null as number | null,
  now: 1_700_000_000_000,
};

describe('install prompt decisions', () => {
  it('offers installation when the browser can prompt', () => {
    expect(shouldOfferInstall(base)).toBe(true);
  });

  it('stays hidden once installed or running standalone', () => {
    expect(shouldOfferInstall({ ...base, installed: true })).toBe(false);
    expect(shouldOfferInstall({ ...base, standalone: true })).toBe(false);
  });

  it('offers iOS instructions even without beforeinstallprompt', () => {
    expect(shouldOfferInstall({ ...base, canPrompt: false, ios: true })).toBe(true);
    expect(shouldOfferInstall({ ...base, canPrompt: false, ios: false })).toBe(false);
  });

  it('respects a dismissal for two weeks, then reconsiders', () => {
    expect(shouldOfferInstall({ ...base, dismissedAt: base.now - 1000 })).toBe(false);
    expect(
      shouldOfferInstall({ ...base, dismissedAt: base.now - INSTALL_SNOOZE_MS - 1 }),
    ).toBe(true);
  });

  it('detects iPadOS desktop user agents', () => {
    expect(isIosDevice('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)', 5)).toBe(true);
    expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(true);
    expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(false);
    expect(isIosDevice('Mozilla/5.0 (X11; Linux x86_64)', 0)).toBe(false);
  });
});

describe('PWA surfaces', () => {
  beforeEach(() => {
    resetPwaState();
    localStorage.clear();
  });

  it('does not show the install card before the page is ready', () => {
    render(<InstallCard />);
    expect(screen.queryByTestId('install-card')).not.toBeInTheDocument();
  });

  it('explains offline mode without promising external links work', () => {
    render(<ConnectionBanner online={false} generatedAt={null} cachedAt={null} />);
    expect(screen.getByRole('status')).toHaveTextContent(/offline/i);
    expect(screen.getByRole('status')).toHaveTextContent(/need a connection/i);
  });

  it('hides the connection banner while online', () => {
    const { container } = render(
      <ConnectionBanner online generatedAt={null} cachedAt={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('announces an update only when a new version is waiting', () => {
    const { rerender } = render(<UpdateToast />);
    expect(screen.queryByText(/new version is available/i)).not.toBeInTheDocument();

    const apply = vi.fn();
    act(() => setPwaState({ needRefresh: true, applyUpdate: apply }));
    rerender(<UpdateToast />);
    expect(screen.getByText(/new version is available/i)).toBeInTheDocument();

    screen.getByRole('button', { name: /refresh/i }).click();
    expect(apply).toHaveBeenCalled();
  });
});
