import { NextResponse } from 'next/server';
import { isAuthenticated } from './auth';
import { NO_STORE_HEADERS } from './cache';

export async function requireAdmin() {
  if (await isAuthenticated()) return null;
  return NextResponse.json({ error: 'Your admin session has expired. Please sign in again.' }, { status: 401, headers: NO_STORE_HEADERS });
}

export function apiError(error: unknown, fallback = 'Something went wrong. Please try again.') {
  console.error(error);
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message || fallback }, { status: 500, headers: NO_STORE_HEADERS });
}
