import { NextRequest, NextResponse } from 'next/server';
import { invalidatePublicContent } from '@/lib/cache';
import { saveProgram } from '@/lib/store';
import { apiError, requireAdmin } from '@/lib/api';
import type { StudyProgram } from '@/lib/types';

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const program = await request.json() as StudyProgram;
    if (!program.title || !program.degree) return NextResponse.json({ error: 'Program title and degree are required.' }, { status: 400 });
    const saved = await saveProgram(program);
    invalidatePublicContent();
    return NextResponse.json({ program: saved }, { status: 201 });
  } catch (error) { return apiError(error, 'Unable to save program.'); }
}
