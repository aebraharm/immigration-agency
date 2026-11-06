import { NextResponse } from 'next/server';
import { getPublicData } from '@/lib/store';
import { apiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getPublicData();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error, 'Unable to load website content.'); }
}
