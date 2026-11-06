import { NextRequest, NextResponse } from 'next/server';
import { invalidatePublicContent } from '@/lib/cache';
import { deleteTeamMember, saveTeamMember } from '@/lib/store';
import { apiError, requireAdmin } from '@/lib/api';
import type { TeamMember } from '@/lib/types';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: Context) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const member = await request.json() as TeamMember;
    if (!member.name || !member.role || !member.photoUrl) {
      return NextResponse.json({ error: 'Name, role and portrait are required.' }, { status: 400 });
    }
    const saved = await saveTeamMember({ ...member, id: (await context.params).id });
    invalidatePublicContent();
    return NextResponse.json({ member: saved });
  } catch (error) { return apiError(error, 'Unable to update team member.'); }
}

export async function DELETE(_: NextRequest, context: Context) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    await deleteTeamMember((await context.params).id);
    invalidatePublicContent();
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error, 'Unable to delete team member.'); }
}
