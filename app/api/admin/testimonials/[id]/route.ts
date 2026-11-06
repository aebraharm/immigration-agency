import { NextRequest, NextResponse } from 'next/server';
import { invalidatePublicContent } from '@/lib/cache';
import { deleteTestimonial, saveTestimonial } from '@/lib/store';
import { apiError, requireAdmin } from '@/lib/api';
import type { Testimonial } from '@/lib/types';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: Context) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    const testimonial = await request.json() as Testimonial;
    const saved = await saveTestimonial({ ...testimonial, id: (await context.params).id });
    invalidatePublicContent();
    return NextResponse.json({ testimonial: saved });
  } catch (error) { return apiError(error, 'Unable to update testimonial.'); }
}

export async function DELETE(_: NextRequest, context: Context) {
  const denied = await requireAdmin(); if (denied) return denied;
  try {
    await deleteTestimonial((await context.params).id);
    invalidatePublicContent();
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error, 'Unable to delete testimonial.'); }
}
