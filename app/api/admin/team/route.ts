import { NextRequest, NextResponse } from 'next/server';
import { invalidatePublicContent } from '@/lib/cache';
import { saveTeamMember } from '@/lib/store';
import { apiError, requireAdmin } from '@/lib/api';
import type { TeamMember } from '@/lib/types';

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const member = await request.json() as TeamMember;
    if (!member.name || !member.role || !member.photoUrl) {
      return NextResponse.json({ error: 'Name, role and portrait are required.' }, { status: 400 });
    }
    const saved = await saveTeamMember(member);
    invalidatePublicContent();
    return NextResponse.json({ member: saved }, { status: 201 });
  } catch (error) { return apiError(error, 'Unable to save team member.'); }
}
