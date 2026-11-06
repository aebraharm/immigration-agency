import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, credentialsMatch, createSessionToken, sessionCookieOptions } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'preview';
  const limit = rateLimit(`login:${ip}`, 8);
  if (!limit.allowed) return NextResponse.json({ error: `Too many sign-in attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} minutes.` }, { status: 429 });
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success || !credentialsMatch(parsed.data.email, parsed.data.password)) {
      return NextResponse.json({ error: 'The email or password is incorrect.' }, { status: 401 });
    }
    const response = NextResponse.json({ authenticated: true, email: parsed.data.email.toLowerCase() });
    response.cookies.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions);
    return response;
  } catch {
    return NextResponse.json({ error: 'Unable to sign in. Please try again.' }, { status: 400 });
  }
}
