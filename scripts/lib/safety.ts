/**
 * URL safety shared by the scanner, the Vercel functions and the tests.
 *
 * The directory accepts URLs discovered on the open web, so every outbound
 * request has to be checked: only http(s), no credentials in the URL, no
 * loopback / private / link-local / multicast destinations, no cloud metadata
 * endpoints, and no DNS answer that points at a private address.
 */
import { promises as dns } from 'node:dns';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'metadata',
  'metadata.google.internal',
  'metadata.goog',
  'instance-data',
  'kubernetes.default',
  'kubernetes.default.svc',
]);

const BLOCKED_SUFFIXES = ['.localhost', '.local', '.internal', '.home.arpa', '.onion'];

export function normaliseHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
}

export function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part) || part < 0 || part > 255)) {
    return true;
  }
  const [a = 0, b = 0] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 + 192.0.2.0/24
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast + reserved
  return false;
}

export function isPrivateIpv6(ip: string): boolean {
  const value = normaliseHostname(ip);
  if (value === '::' || value === '::1') return true;
  // IPv4-mapped addresses (::ffff:127.0.0.1) are checked as IPv4.
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1]) return isPrivateIpv4(mapped[1]);
  if (/^f[cd][0-9a-f]{2}:/.test(value)) return true; // unique local fc00::/7
  if (/^fe[89ab][0-9a-f]:/.test(value)) return true; // link-local fe80::/10
  if (/^ff[0-9a-f]{2}:/.test(value)) return true; // multicast
  return false;
}

export function isBlockedHostname(hostname: string): boolean {
  const host = normaliseHostname(hostname);
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return isPrivateIpv4(host);
  if (host.includes(':')) return isPrivateIpv6(host);
  // Decimal / octal / hex IPv4 shorthands ("2130706433", "0x7f.1") must not slip through.
  if (/^(0x[0-9a-f]+|\d+)$/i.test(host)) return true;
  return false;
}

export class UnsafeUrlError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'UnsafeUrlError';
  }
}

/** Throws unless the URL is a plain public http(s) URL. */
export function assertSafeHttpUrl(raw: string | URL): URL {
  let url: URL;
  try {
    url = raw instanceof URL ? raw : new URL(raw);
  } catch {
    throw new UnsafeUrlError('Not a valid absolute URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError(`Blocked protocol: ${url.protocol}`);
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError('URLs with embedded credentials are not allowed.');
  }
  if (url.port && !['', '80', '443'].includes(url.port)) {
    throw new UnsafeUrlError(`Blocked non-standard port: ${url.port}`);
  }
  if (isBlockedHostname(url.hostname)) {
    throw new UnsafeUrlError(`Blocked private or local hostname: ${url.hostname}`);
  }
  return url;
}

/**
 * Resolves the hostname and rejects answers that point inside the network.
 * A resolution failure is surfaced so callers can treat it as "unreachable".
 */
export async function assertPublicResolution(url: URL): Promise<void> {
  const host = normaliseHostname(url.hostname);
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(':')) {
    if (isBlockedHostname(host)) throw new UnsafeUrlError(`Blocked address: ${host}`);
    return;
  }

  const records = await dns.lookup(host, { all: true, verbatim: true });
  if (records.length === 0) throw new UnsafeUrlError(`No DNS records for ${host}`);
  for (const record of records) {
    const blocked = record.family === 6 ? isPrivateIpv6(record.address) : isPrivateIpv4(record.address);
    if (blocked) throw new UnsafeUrlError(`DNS points at a private address: ${record.address}`);
  }
}
