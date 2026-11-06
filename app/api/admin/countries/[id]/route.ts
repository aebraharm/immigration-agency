import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { deleteCountry, saveCountry } from '@/lib/store';
import { apiError, requireAdmin } from '@/lib/api';
import type { Country } from '@/lib/types';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: Context) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const { id } = await context.params;
    const country = await request.json() as Country;
    const saved = await saveCountry({ ...country, id });
    revalidatePath('/', 'page');
    return NextResponse.json({ country: saved });
  } catch (error) { return apiError(error, 'Unable to update country.'); }
}

export async function DELETE(_: NextRequest, context: Context) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    await deleteCountry((await context.params).id);
    revalidatePath('/', 'page');
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error, 'Unable to delete country.'); }
}
