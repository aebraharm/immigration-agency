import { NextRequest, NextResponse } from 'next/server';
import { invalidatePublicContent } from '@/lib/cache';
import { deleteProgram, saveProgram } from '@/lib/store';
import { apiError, requireAdmin } from '@/lib/api';
import type { StudyProgram } from '@/lib/types';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: Context) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const program = await request.json() as StudyProgram;
    const saved = await saveProgram({ ...program, id: (await context.params).id });
    invalidatePublicContent();
    return NextResponse.json({ program: saved });
  } catch (error) { return apiError(error, 'Unable to update program.'); }
}

export async function DELETE(_: NextRequest, context: Context) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    await deleteProgram((await context.params).id);
    invalidatePublicContent();
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error, 'Unable to delete program.'); }
}
