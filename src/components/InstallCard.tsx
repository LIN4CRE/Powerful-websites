import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

/**
 * Dismissible install invitation. It waits until the page is ready, never opens
 * a browser dialog on its own, and stays hidden once the app is installed.
 */
export function InstallCard() {
  const { shouldShow, canPrompt, ios, promptInstall, dismiss } = useInstallPrompt();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!ready || !shouldShow) return null;

  const install = async () => {
    setBusy(true);
    try {
      const outcome = await promptInstall();
      if (outcome !== 'accepted') setBusy(false);
    } catch {
      setBusy(false);
    }
  };

  return (
    <aside
      className="install-card"
      aria-labelledby="install-title"
      role="complementary"
      data-testid="install-card"
    >
      <div className="flex items-start gap-3">
        <span className="install-card__icon" aria-hidden>
          <Icon name="Download" size={16} />
        </span>
        <div className="min-w-0">
          <h2 id="install-title" className="text-[0.95rem] font-medium text-[var(--text)]">
            Take POWERFUL WEBSITES with you.
          </h2>
          <p className="mt-1 text-[0.76rem] leading-relaxed text-[var(--muted)]">
            Install the application for quicker access, a dedicated app icon and an app-like
            experience.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="install-card__close"
          aria-label="Dismiss install invitation"
        >
          <Icon name="X" size={14} />
        </button>
      </div>

      {ios ? (
        <>
          <ol className="mt-3 space-y-1.5 text-[0.74rem] leading-relaxed text-[var(--text-soft)]">
            <li>
              <span className="text-[var(--faint)]">1.</span> Open the browser&apos;s{' '}
              <strong className="font-medium text-[var(--text)]">Share</strong> menu.
            </li>
            <li>
              <span className="text-[var(--faint)]">2.</span> Choose{' '}
              <strong className="font-medium text-[var(--text)]">Add to Home Screen</strong>.
            </li>
            <li>
              <span className="text-[var(--faint)]">3.</span> Confirm the installation.
            </li>
          </ol>
          <div className="mt-3 flex items-center gap-2">
            <button type="button" className="btn btn--primary" onClick={dismiss}>
              Got it
            </button>
            <span className="text-[0.7rem] text-[var(--faint)]">Safari and other iOS browsers</span>
          </div>
        </>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="btn btn--primary"
            onClick={install}
            disabled={!canPrompt || busy}
          >
            <Icon name="Download" size={14} />
            {busy ? 'Opening…' : 'Install app'}
          </button>
          <button type="button" className="btn" onClick={dismiss}>
            Not now
          </button>
        </div>
      )}
    </aside>
  );
}
