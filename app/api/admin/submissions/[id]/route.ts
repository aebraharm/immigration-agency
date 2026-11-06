import { NextRequest, NextResponse } from 'next/server';
import { deleteSubmission, updateSubmissionStatus } from '@/lib/store';
import { apiError, requireAdmin } from '@/lib/api';
import type { SubmissionStatus } from '@/lib/types';

type Context = { params: Promise<{ id: string }> };
const statuses: SubmissionStatus[] = ['new', 'reviewed', 'contacted', 'archived'];

export async function PATCH(request: NextRequest, context: Context) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const { status } = await request.json() as { status: SubmissionStatus };
    if (!statuses.includes(status)) return NextResponse.json({ error: 'Invalid submission status.' }, { status: 400 });
    const submission = await updateSubmissionStatus((await context.params).id, status);
    return NextResponse.json({ submission });
  } catch (error) { return apiError(error, 'Unable to update submission.'); }
}

export async function DELETE(_: NextRequest, context: Context) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    await deleteSubmission((await context.params).id);
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error, 'Unable to delete submission.'); }
}
