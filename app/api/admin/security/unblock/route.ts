import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAdmin } from '@/lib/api';
import { NO_STORE_HEADERS } from '@/lib/cache';
import { unblockIp } from '@/lib/store';
import { unblockIpSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const parsed = unblockIpSchema.safeParse(await request.json());
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Enter a valid IPv4 or IPv6 address.';
      return NextResponse.json({ error: message }, { status: 400, headers: NO_STORE_HEADERS });
    }
    const result = await unblockIp(parsed.data.ip);
    if (!result.removed) {
      return NextResponse.json({ error: `${parsed.data.ip} is not on the blocked list.` }, { status: 404, headers: NO_STORE_HEADERS });
    }
    return NextResponse.json({ ip: result.ip, removed: true }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return apiError(error, 'Unable to unblock that address.');
  }
}
