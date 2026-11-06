import { NextResponse } from 'next/server';
import { getAdminData } from '@/lib/store';
import { apiError, requireAdmin } from '@/lib/api';
import { NO_STORE_HEADERS } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const data = await getAdminData();
    return NextResponse.json({ submissions: data.submissions }, { headers: NO_STORE_HEADERS });
  } catch (error) { return apiError(error, 'Unable to load submissions.'); }
}
