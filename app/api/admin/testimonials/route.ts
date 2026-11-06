import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { saveTestimonial } from '@/lib/store';
import { apiError, requireAdmin } from '@/lib/api';
import type { Testimonial } from '@/lib/types';

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const testimonial = await request.json() as Testimonial;
    if (!testimonial.name || !testimonial.quote) return NextResponse.json({ error: 'Client name and testimonial are required.' }, { status: 400 });
    const saved = await saveTestimonial(testimonial);
    revalidatePath('/', 'page');
    return NextResponse.json({ testimonial: saved }, { status: 201 });
  } catch (error) { return apiError(error, 'Unable to save testimonial.'); }
}
