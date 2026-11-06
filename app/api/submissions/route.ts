import { NextRequest, NextResponse } from 'next/server';
import { createSubmission } from '@/lib/store';
import { submissionEnvelopeSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { apiError } from '@/lib/api';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'preview';
  const limit = rateLimit(`submission:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 });
  try {
    const parsed = submissionEnvelopeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please review your assessment.', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const submission = await createSubmission(parsed.data.type, parsed.data.data);
    return NextResponse.json({ reference: submission.reference, id: submission.id, createdAt: submission.createdAt }, { status: 201 });
  } catch (error) { return apiError(error, 'We could not submit your assessment. Please try again.'); }
}
