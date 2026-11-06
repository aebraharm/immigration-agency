import { NextResponse } from 'next/server';
import { getPublicContentVersion, getPublicData, storageMode } from '@/lib/store';
import { apiError } from '@/lib/api';
import { NO_STORE_HEADERS } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    // This repository function executes fresh Turso queries on every invocation.
    const [data, revision] = await Promise.all([getPublicData(), getPublicContentVersion()]);
    return NextResponse.json(data, {
      headers: { ...NO_STORE_HEADERS, 'X-CMS-Revision': revision, 'X-CMS-Storage': storageMode },
    });
  } catch (error) { return apiError(error, 'Unable to load website content.'); }
}
