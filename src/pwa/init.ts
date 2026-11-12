/**
 * Registers the generated service worker and forwards its lifecycle events into
 * the UI store. Called once from `main.tsx`.
 */
import { registerSW } from 'virtual:pwa-register';
import { setPwaState } from './state';

let started = false;

export function initPwa(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      setPwaState({ needRefresh: true });
    },
    onOfflineReady() {
      setPwaState({ offlineReady: true });
    },
    onRegisteredSW(_url, registration) {
      // Nudge the browser to look for a new deployment when the tab regains focus.
      if (!registration) return;
      setInterval(() => void registration.update(), 60 * 60 * 1000);
    },
    onRegisterError(error) {
      console.warn('[pwa] service worker registration failed', error);
    },
  });

  setPwaState({
    applyUpdate: () => {
      void updateSW(true);
    },
  });
}
