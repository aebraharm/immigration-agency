'use client';

export async function adminFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  const result = await response.json().catch(() => ({}));
  if (response.status === 401) window.dispatchEvent(new Event('admin:unauthorized'));
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
  return result as T;
}
