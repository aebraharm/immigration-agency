import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { saveCountry } from '@/lib/store';
import { apiError, requireAdmin } from '@/lib/api';
import type { Country } from '@/lib/types';

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const country = await request.json() as Country;
    if (!country.name || !country.slug) return NextResponse.json({ error: 'Country name and slug are required.' }, { status: 400 });
    const saved = await saveCountry(country);
    revalidatePath('/', 'page');
    return NextResponse.json({ country: saved }, { status: 201 });
  } catch (error) { return apiError(error, 'Unable to save country.'); }
}
