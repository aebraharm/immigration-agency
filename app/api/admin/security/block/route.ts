import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAdmin } from '@/lib/api';
import { NO_STORE_HEADERS } from '@/lib/cache';
import { blockIp } from '@/lib/store';
import { blockIpSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const parsed = blockIpSchema.safeParse(await request.json());
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Enter a valid IPv4 or IPv6 address.';
      return NextResponse.json({ error: message }, { status: 400, headers: NO_STORE_HEADERS });
    }
    const blocked = await blockIp(parsed.data.ip, parsed.data.reason);
    return NextResponse.json({ blocked }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return apiError(error, 'Unable to block that address.');
  }
}
