import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAdmin } from '@/lib/api';
import { NO_STORE_HEADERS } from '@/lib/cache';
import { getClientIp } from '@/lib/ip';
import { getSecurityOverview } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const overview = await getSecurityOverview(getClientIp(request.headers));
    return NextResponse.json(overview, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return apiError(error, 'Unable to load visitor logs and blocked addresses.');
  }
}
