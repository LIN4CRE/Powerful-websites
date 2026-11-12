import { useCallback, useEffect, useMemo, useState } from 'react';

const DISMISS_KEY = 'pw:install-dismissed';
export const INSTALL_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>;
}

export function isIosDevice(userAgent: string, maxTouchPoints = 0): boolean {
  if (/iPad|iPhone|iPod/i.test(userAgent)) return true;
  // iPadOS 13+ reports a desktop Safari user agent but keeps multi-touch.
  return /Macintosh/i.test(userAgent) && maxTouchPoints > 1;
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || iosStandalone;
}

export interface OfferInput {
  installed: boolean;
  standalone: boolean;
  canPrompt: boolean;
  ios: boolean;
  dismissedAt: number | null;
  now: number;
  snoozeMs?: number;
}

/** Pure decision used by the hook and covered by unit tests. */
export function shouldOfferInstall(input: OfferInput): boolean {
  const { installed, standalone, canPrompt, ios, dismissedAt, now } = input;
  if (installed || standalone) return false;
  if (!canPrompt && !ios) return false;
  if (dismissedAt === null) return true;
  return now - dismissedAt >= (input.snoozeMs ?? INSTALL_SNOOZE_MS);
}

function readDismissedAt(): number | null {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return null;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export interface InstallPromptApi {
  /** The browser can open its own install dialog. */
  canPrompt: boolean;
  /** Apple mobile browser: show Add to Home Screen instructions instead. */
  ios: boolean;
  installed: boolean;
  shouldShow: boolean;
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  dismiss: () => void;
}

export function useInstallPrompt(): InstallPromptApi {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent ?? '';
    const touchPoints = navigator.maxTouchPoints ?? 0;
    setIos(isIosDevice(ua, touchPoints));
    setStandalone(isStandaloneDisplay());
    setDismissedAt(readDismissedAt());

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    const media = window.matchMedia?.('(display-mode: standalone)');
    const onDisplayMode = () => setStandalone(isStandaloneDisplay());

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    media?.addEventListener?.('change', onDisplayMode);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      media?.removeEventListener?.('change', onDisplayMode);
    };
  }, []);

  const dismiss = useCallback(() => {
    const now = Date.now();
    setDismissedAt(now);
    try {
      localStorage.setItem(DISMISS_KEY, String(now));
    } catch {
      /* storage disabled — the card simply returns next session */
    }
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferred) return 'unavailable';
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') {
      setInstalled(true);
      setDeferred(null);
    }
    // A dismissed native dialog is not stored as a snooze: the browser already
    // throttles `beforeinstallprompt`, and the visitor may change their mind.
    return choice.outcome;
  }, [deferred]);

  const shouldShow = useMemo(
    () =>
      shouldOfferInstall({
        installed,
        standalone,
        canPrompt: deferred !== null,
        ios,
        dismissedAt,
        now: Date.now(),
      }),
    [installed, standalone, deferred, ios, dismissedAt],
  );

  return { canPrompt: deferred !== null, ios, installed, shouldShow, promptInstall, dismiss };
}
