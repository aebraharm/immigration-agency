import { NextResponse } from 'next/server';
import { getAdminData } from '@/lib/store';
import { apiError, requireAdmin } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const data = await getAdminData();
    return NextResponse.json({ submissions: data.submissions }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error, 'Unable to load submissions.'); }
}
