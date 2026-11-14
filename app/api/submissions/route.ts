import { NextRequest, NextResponse } from 'next/server';
import { createSubmission, isIpBlocked, recordVisit } from '@/lib/store';
import { submissionEnvelopeSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { apiError } from '@/lib/api';
import { getClientIp } from '@/lib/ip';
import { NO_STORE_HEADERS } from '@/lib/cache';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);

  // A blocked address can never create an assessment, even if it reaches the
  // API route directly instead of the public page.
  if (ip) {
    try {
      if (await isIpBlocked(ip)) {
        return NextResponse.json({ error: 'Your network address has been restricted. Please contact our office.' }, { status: 403, headers: NO_STORE_HEADERS });
      }
    } catch (error) {
      console.error('Submission firewall check failed', error);
    }
  }

  const limit = rateLimit(`submission:${ip ?? 'preview'}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 });
  try {
    const parsed = submissionEnvelopeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please review your assessment.', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const submission = await createSubmission(parsed.data.type, parsed.data.data, ip ?? '');
    if (ip) {
      // Link this activity to the visitor record as a distinct submission event.
      await recordVisit({
        ip, path: '/assessment', kind: 'submission',
        userAgent: request.headers.get('user-agent') || '',
        referrer: request.headers.get('referer') || '',
      }).catch((error) => console.error('Submission visit tracking failed', error));
    }
    return NextResponse.json({ reference: submission.reference, id: submission.id, createdAt: submission.createdAt }, { status: 201 });
  } catch (error) { return apiError(error, 'We could not submit your assessment. Please try again.'); }
}
