import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'pw:saved';

function readSaved(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

/**
 * Favourites live only in localStorage — no account, no cookies, no server.
 */
export function useSavedSites(): {
  saved: Set<string>;
  toggle: (id: string) => void;
  isSaved: (id: string) => boolean;
  count: number;
} {
  const [saved, setSaved] = useState<Set<string>>(readSaved);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...saved]));
    } catch {
      /* ignore storage errors */
    }
  }, [saved]);

  const toggle = useCallback((id: string) => {
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => saved.has(id), [saved]);

  return { saved, toggle, isSaved, count: saved.size };
}
