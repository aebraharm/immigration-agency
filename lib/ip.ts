/**
 * Edge-safe visitor IP helpers.
 *
 * This module must stay free of Node-only APIs and database imports so the
 * middleware firewall, server components and route handlers can all share the
 * exact same normalisation rules.
 */

const IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6_CHARS = /^[0-9a-f:.]+$/;

function isValidIpv4(value: string) {
  if (!IPV4_PATTERN.test(value)) return false;
  return value.split('.').every((part) => {
    if (part.length > 1 && part.startsWith('0')) return false;
    return Number(part) <= 255;
  });
}

function isValidIpv6(value: string) {
  if (!IPV6_CHARS.test(value) || !value.includes(':')) return false;
  const compressed = value.split('::').length - 1;
  if (compressed > 1) return false;
  const groups = value.split(':').filter(Boolean);
  if (groups.some((group) => group.length > 4 || !/^[0-9a-f]+$/.test(group))) return false;
  return compressed === 1 ? groups.length <= 7 : groups.length === 8;
}

/**
 * Normalises a raw proxy header value into a canonical IP address, or returns
 * `null` when the value is missing or not a real address. Handles bracketed and
 * port-suffixed values plus IPv4-mapped IPv6 (for example `::ffff:203.0.113.9`).
 */
export function normalizeIp(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let value = raw.trim();
  if (!value) return null;

  if (value.startsWith('[')) {
    const closing = value.indexOf(']');
    if (closing < 0) return null;
    value = value.slice(1, closing);
  } else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(value)) {
    value = value.slice(0, value.lastIndexOf(':'));
  }

  const zone = value.indexOf('%');
  if (zone > 0) value = value.slice(0, zone);
  value = value.replace(/^::ffff:/i, '').toLowerCase();

  if (isValidIpv4(value)) return value;
  if (isValidIpv6(value)) return value;
  return null;
}

/**
 * Loopback and unspecified addresses are internal (server self-requests, health
 * checks, direct localhost browsing) and are never attributed to a visitor.
 */
export function isLoopbackIp(ip: string): boolean {
  if (ip === '::1' || ip === '::0' || ip === '::') return true;
  if (ip === '0.0.0.0') return true;
  if (ip.startsWith('127.')) return true;
  return /^(?:0:){7}1$/.test(ip) || /^(?:0:){7}0$/.test(ip);
}

/**
 * Reads the visitor address from the proxy headers Netlify and other edge
 * providers forward. Netlify's own `x-nf-client-connection-ip` is preferred,
 * then the standard `x-forwarded-for` / `x-real-ip` pair.
 */
export function getClientIp(headers: Headers): string | null {
  const candidates: Array<string | null | undefined> = [
    headers.get('x-nf-client-connection-ip'),
    ...(headers.get('x-forwarded-for')?.split(',') ?? []),
    headers.get('x-real-ip'),
    headers.get('cf-connecting-ip'),
    headers.get('true-client-ip'),
  ];

  for (const candidate of candidates) {
    const ip = normalizeIp(candidate);
    if (ip) return ip;
  }
  return null;
}
