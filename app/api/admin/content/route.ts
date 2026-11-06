import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminData, saveContent } from '@/lib/store';
import { apiError, requireAdmin } from '@/lib/api';
import type { SiteContent } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const denied = await requireAdmin(); if (denied) return denied;
  try { return NextResponse.json(await getAdminData(), { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) { return apiError(error, 'Unable to load CMS data.'); }
}

export async function PUT(request: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const content = await request.json() as SiteContent;
    if (!content?.brand?.name || !content?.hero?.title || !content?.consultation?.termsText || !content?.forms?.labels) {
      return NextResponse.json({ error: 'Required brand, hero, terms and form content must be present.' }, { status: 400 });
    }
    const saved = await saveContent(content);
    revalidatePath('/', 'page');
    return NextResponse.json({ content: saved });
  } catch (error) { return apiError(error, 'Unable to save site content.'); }
}
