import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'redpath_admin';
const SESSION_LENGTH_SECONDS = 60 * 60 * 8;
const adminEmail = () => process.env.ADMIN_EMAIL || 'portal11@gmail.com';
const adminPassword = () => process.env.ADMIN_PASSWORD || 'Hankr8119$';
const secret = () => process.env.AUTH_SECRET || `redpath-preview-session:${adminPassword()}`;

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function signature(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function credentialsMatch(email: string, password: string) {
  return safeEqual(email.trim().toLowerCase(), adminEmail().toLowerCase()) && safeEqual(password, adminPassword());
}

export function createSessionToken() {
  const payload = Buffer.from(JSON.stringify({
    sub: adminEmail().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_LENGTH_SECONDS,
  })).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function verifySessionToken(token?: string) {
  if (!token) return false;
  const [payload, suppliedSignature] = token.split('.');
  if (!payload || !suppliedSignature || !safeEqual(signature(payload), suppliedSignature)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub: string; exp: number };
    return data.sub === adminEmail().toLowerCase() && data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function isAuthenticated() {
  const jar = await cookies();
  return verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_LENGTH_SECONDS,
};
