import { NextRequest, NextResponse } from 'next/server';
import { NO_STORE_HEADERS } from '@/lib/cache';
import { getClientIp, normalizeIp } from '@/lib/ip';
import { isIpBlocked } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const CACHE_MS = 5_000;
const CACHE_LIMIT = 1_000;
const recent = new Map<string, { blocked: boolean; expires: number }>();

/**
 * Internal lookup used by the edge firewall. Only the boolean block decision is
 * returned, and any database problem fails open so the public site stays up.
 */
export async function GET(request: NextRequest) {
  const ip = normalizeIp(request.headers.get('x-visitor-ip-check')) ?? getClientIp(request.headers);
  if (!ip) return NextResponse.json({ blocked: false }, { headers: NO_STORE_HEADERS });

  const cached = recent.get(ip);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ blocked: cached.blocked }, { headers: NO_STORE_HEADERS });
  }

  try {
    const blocked = await isIpBlocked(ip);
    if (recent.size >= CACHE_LIMIT) recent.clear();
    recent.set(ip, { blocked, expires: Date.now() + CACHE_MS });
    return NextResponse.json({ blocked }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('IP status lookup failed', error);
    return NextResponse.json({ blocked: false }, { headers: NO_STORE_HEADERS });
  }
}
