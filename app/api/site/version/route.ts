import { NextResponse } from 'next/server';
import { getPublicContentVersion, storageMode } from '@/lib/store';
import { apiError } from '@/lib/api';
import { NO_STORE_HEADERS } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const revision = await getPublicContentVersion();
    return NextResponse.json({ revision }, {
      headers: { ...NO_STORE_HEADERS, 'X-CMS-Revision': revision, 'X-CMS-Storage': storageMode },
    });
  } catch (error) { return apiError(error, 'Unable to check content version.'); }
}
