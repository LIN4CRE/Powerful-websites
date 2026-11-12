import { describe, expect, it } from 'vitest';
import {
  assertSafeHttpUrl,
  isBlockedHostname,
  isPrivateIpv4,
  isPrivateIpv6,
  UnsafeUrlError,
} from '../../scripts/lib/safety';

describe('URL safety', () => {
  it('blocks loopback, private, link-local and metadata hosts', () => {
    for (const host of [
      'localhost',
      '127.0.0.1',
      '10.1.2.3',
      '172.20.0.1',
      '192.168.1.1',
      '169.254.169.254',
      'metadata.google.internal',
      'kubernetes.default',
      '::1',
      'fd00::1',
      'fe80::1',
      '0.0.0.0',
      '2130706433',
    ]) {
      expect(isBlockedHostname(host), host).toBe(true);
    }
  });

  it('allows ordinary public hosts', () => {
    for (const host of ['example.com', 'excalidraw.com', '8.8.8.8', 'one.one.one.one']) {
      expect(isBlockedHostname(host), host).toBe(false);
    }
  });

  it('classifies IPv4 and IPv6 ranges', () => {
    expect(isPrivateIpv4('100.64.0.1')).toBe(true);
    expect(isPrivateIpv4('93.184.216.34')).toBe(false);
    expect(isPrivateIpv6('::ffff:127.0.0.1')).toBe(true);
    expect(isPrivateIpv6('2001:4860:4860::8888')).toBe(false);
  });

  it('rejects non-http schemes, credentials and odd ports', () => {
    expect(() => assertSafeHttpUrl('file:///etc/passwd')).toThrow(UnsafeUrlError);
    expect(() => assertSafeHttpUrl('javascript:alert(1)')).toThrow(UnsafeUrlError);
    expect(() => assertSafeHttpUrl('https://user:pass@example.com/')).toThrow(UnsafeUrlError);
    expect(() => assertSafeHttpUrl('https://example.com:8080/')).toThrow(UnsafeUrlError);
    expect(() => assertSafeHttpUrl('http://169.254.169.254/latest/meta-data')).toThrow(
      UnsafeUrlError,
    );
  });

  it('accepts normal https URLs', () => {
    expect(assertSafeHttpUrl('https://excalidraw.com/').hostname).toBe('excalidraw.com');
  });
});
