/**
 * Tiny observable store for service-worker state.
 *
 * The virtual `vite-plugin-pwa` module is only imported from `init.ts`, which is
 * loaded by `main.tsx`. Components subscribe here instead, so unit tests never
 * touch the virtual module or a real service worker.
 */
export interface PwaState {
  /** Shell and assets are cached; the app works offline. */
  offlineReady: boolean;
  /** A newer build is waiting and the visitor has not applied it yet. */
  needRefresh: boolean;
  /** Applies the waiting service worker and reloads. */
  applyUpdate: () => void;
}

let state: PwaState = {
  offlineReady: false,
  needRefresh: false,
  applyUpdate: () => {},
};

const listeners = new Set<(next: PwaState) => void>();

export function getPwaState(): PwaState {
  return state;
}

export function subscribePwa(listener: (next: PwaState) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setPwaState(patch: Partial<PwaState>): void {
  state = { ...state, ...patch };
  for (const listener of listeners) listener(state);
}

export function resetPwaState(): void {
  state = { offlineReady: false, needRefresh: false, applyUpdate: () => {} };
  for (const listener of listeners) listener(state);
}
