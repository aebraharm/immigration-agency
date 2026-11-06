import { NextRequest, NextResponse } from 'next/server';
import { invalidatePublicContent } from '@/lib/cache';
import { saveAccreditation } from '@/lib/store';
import { apiError, requireAdmin } from '@/lib/api';
import type { Accreditation } from '@/lib/types';

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const accreditation = await request.json() as Accreditation;
    if (!accreditation.title || !accreditation.imageUrl) {
      return NextResponse.json({ error: 'Accreditation title and badge image are required.' }, { status: 400 });
    }
    const saved = await saveAccreditation(accreditation);
    invalidatePublicContent();
    return NextResponse.json({ accreditation: saved }, { status: 201 });
  } catch (error) { return apiError(error, 'Unable to save accreditation.'); }
}
