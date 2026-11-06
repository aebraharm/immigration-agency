import { revalidatePath, revalidateTag } from 'next/cache';

export const PUBLIC_CONTENT_CACHE_TAG = 'cms-public-content';

/**
 * Prevent browsers, shared CDNs and Netlify's edge from retaining CMS responses.
 * The extra CDN directives are intentional: Cache-Control alone is not the only
 * cache key consulted by every Netlify execution path.
 */
export const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'no-store, max-age=0',
  'Netlify-CDN-Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
} as const;

/** Invalidate every public representation after a successful database mutation. */
export function invalidatePublicContent() {
  revalidateTag(PUBLIC_CONTENT_CACHE_TAG, { expire: 0 });
  revalidatePath('/', 'page');
  revalidatePath('/api/site');
}
