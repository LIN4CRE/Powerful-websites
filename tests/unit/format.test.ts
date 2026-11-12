import { describe, expect, it } from 'vitest';
import {
  displayDomain,
  formatClock,
  formatRelativeTime,
  pluralize,
  timezoneLabel,
} from '../../src/lib/format';

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-11-12T12:00:00.000Z');

  it('handles missing values', () => {
    expect(formatRelativeTime(null, now)).toBe('never');
    expect(formatRelativeTime(undefined, now)).toBe('never');
    expect(formatRelativeTime('not-a-date', now)).toBe('unknown');
  });

  it('describes recent timestamps precisely', () => {
    expect(formatRelativeTime(new Date(now - 10_000).toISOString(), now)).toBe('just now');
    expect(formatRelativeTime(new Date(now - 60_000).toISOString(), now)).toBe('1 minute ago');
    expect(formatRelativeTime(new Date(now - 5 * 60_000).toISOString(), now)).toBe('5 minutes ago');
    expect(formatRelativeTime(new Date(now - 3 * 3_600_000).toISOString(), now)).toBe('3 hours ago');
    expect(formatRelativeTime(new Date(now - 2 * 86_400_000).toISOString(), now)).toBe('2 days ago');
  });

  it('never reports negative time for a future timestamp', () => {
    expect(formatRelativeTime(new Date(now + 60_000).toISOString(), now)).toBe('just now');
  });
});

describe('formatting helpers', () => {
  it('formats a 24-hour clock with seconds', () => {
    expect(formatClock(new Date('2026-11-12T09:05:07Z'))).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('returns a timezone label', () => {
    expect(typeof timezoneLabel(new Date())).toBe('string');
  });

  it('pluralises correctly', () => {
    expect(pluralize(1, 'site')).toBe('1 site');
    expect(pluralize(2, 'site')).toBe('2 sites');
    expect(pluralize(1200, 'site')).toBe('1,200 sites');
  });

  it('extracts a clean domain', () => {
    expect(displayDomain('https://www.example.com/path?q=1')).toBe('example.com');
    expect(displayDomain('not a url')).toBe('not a url');
  });
});
