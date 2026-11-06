import { NextResponse } from 'next/server';
import { isAuthenticated } from './auth';

export async function requireAdmin() {
  if (await isAuthenticated()) return null;
  return NextResponse.json({ error: 'Your admin session has expired. Please sign in again.' }, { status: 401 });
}

export function apiError(error: unknown, fallback = 'Something went wrong. Please try again.') {
  console.error(error);
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message || fallback }, { status: 500 });
}
