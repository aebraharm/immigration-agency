import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { NO_STORE_HEADERS } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json({ authenticated: await isAuthenticated() }, { headers: NO_STORE_HEADERS });
}
