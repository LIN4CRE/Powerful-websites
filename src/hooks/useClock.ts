import { useEffect, useState } from 'react';

/**
 * Returns the visitor's real local time, refreshed every second. Time always
 * comes from the browser clock, so it is correct in every timezone.
 */
export function useClock(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}
