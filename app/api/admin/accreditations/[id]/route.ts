import { NextRequest, NextResponse } from 'next/server';
import { invalidatePublicContent } from '@/lib/cache';
import { deleteAccreditation, saveAccreditation } from '@/lib/store';
import { apiError, requireAdmin } from '@/lib/api';
import type { Accreditation } from '@/lib/types';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: Context) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const accreditation = await request.json() as Accreditation;
    if (!accreditation.title || !accreditation.imageUrl) {
      return NextResponse.json({ error: 'Accreditation title and badge image are required.' }, { status: 400 });
    }
    const saved = await saveAccreditation({ ...accreditation, id: (await context.params).id });
    invalidatePublicContent();
    return NextResponse.json({ accreditation: saved });
  } catch (error) { return apiError(error, 'Unable to update accreditation.'); }
}

export async function DELETE(_: NextRequest, context: Context) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    await deleteAccreditation((await context.params).id);
    invalidatePublicContent();
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error, 'Unable to delete accreditation.'); }
}
