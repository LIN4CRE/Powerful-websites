import { useSyncExternalStore } from 'react';
import { getPwaState, subscribePwa, type PwaState } from '../pwa/state';

export function usePwaState(): PwaState {
  return useSyncExternalStore(subscribePwa, getPwaState, getPwaState);
}
