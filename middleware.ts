import { NextResponse, type NextRequest } from 'next/server';
import { renderAccessDeniedHtml } from '@/lib/access-denied';
import { getClientIp } from '@/lib/ip';

/**
 * IP firewall for the public site.
 *
 * The edge runtime cannot open the Turso/libSQL connection, so the blocked list
 * is checked through the internal `/api/security/ip-status` route that runs in
 * the Node.js runtime against the same database. Results are cached briefly per
 * edge instance to keep the check off the hot path.
 *
 * Failure is always open: if the database, network or route is unavailable the
 * request continues, and the server components still perform an authoritative
 * database check before rendering the public site.
 */

const CACHE_TTL_MS = 10_000;
const CHECK_TIMEOUT_MS = 1_500;
const CACHE_LIMIT = 2_000;

const blockCache = new Map<string, { blocked: boolean; expires: number }>();

function cachedStatus(ip: string) {
  const entry = blockCache.get(ip);
  if (!entry) return undefined;
  if (entry.expires <= Date.now()) {
    blockCache.delete(ip);
    return undefined;
  }
  return entry.blocked;
}

function remember(ip: string, blocked: boolean) {
  if (blockCache.size >= CACHE_LIMIT) {
    for (const [key, entry] of blockCache) {
      if (entry.expires <= Date.now()) blockCache.delete(key);
    }
    if (blockCache.size >= CACHE_LIMIT) blockCache.clear();
  }
  blockCache.set(ip, { blocked, expires: Date.now() + CACHE_TTL_MS });
}

/**
 * Netlify exposes the deployed site URL at build time. Using it avoids relying
 * on host forwarding for the internal lookup, with request headers as fallback.
 */
const buildOrigin = (() => {
  if (typeof process === 'undefined') return '';
  const configured = process.env.URL || process.env.DEPLOY_PRIME_URL || '';
  return configured.trim().replace(/\/$/, '');
})();

function requestOrigin(request: NextRequest) {
  if (buildOrigin) return buildOrigin;
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host') || request.nextUrl.host;
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProto || request.nextUrl.protocol.replace(':', '') || 'https';
  return `${protocol}://${host}`;
}

async function isBlocked(ip: string, request: NextRequest) {
  const cached = cachedStatus(ip);
  if (cached !== undefined) return cached;

  try {
    const response = await fetch(new URL('/api/security/ip-status', requestOrigin(request)), {
      method: 'GET',
      headers: { 'x-visitor-ip-check': ip, accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { blocked?: boolean };
    const blocked = result.blocked === true;
    remember(ip, blocked);
    return blocked;
  } catch {
    // Fail open: a temporary database or routing failure must never take the
    // public website offline.
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const ip = getClientIp(request.headers);
  if (!ip) return NextResponse.next();

  if (await isBlocked(ip, request)) {
    return new NextResponse(renderAccessDeniedHtml(), {
      status: 403,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'private, no-store, no-cache, max-age=0, must-revalidate',
        'CDN-Cache-Control': 'no-store, max-age=0',
        'x-robots-tag': 'noindex, nofollow',
        'x-blocked-by': 'redpath-ip-firewall',
      },
    });
  }

  const headers = new Headers(request.headers);
  headers.set('x-visitor-path', request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  /**
   * Every public path is firewalled. The admin portal and its API stay reachable
   * so an administrator can always sign in and lift a restriction, and the
   * internal status endpoint is excluded to avoid a recursive lookup. Static
   * assets (any final path segment containing a dot) are skipped as well.
   */
  matcher: ['/((?!_next/|api/admin|api/security|admin(?:/|$)|.*\\.[^/]*$).*)'],
};
