'use client';

import { useEffect, useState } from 'react';
import { CMS_UPDATE_EVENT, createCmsChannel } from '@/lib/live-content';
import type { PublicData } from '@/lib/types';

const BACKGROUND_REFRESH_MS = 10_000;
const STORAGE_KEY = 'redpath-cms-content-updated';

/**
 * Keeps the initial server-rendered payload live without a manual page reload.
 * Admin saves notify other tabs immediately. Lightweight revision checks avoid
 * downloading images, videos and all CMS rows again unless content has changed.
 */
export function useLivePublicData(initialData: PublicData) {
  const [data, setData] = useState(initialData);

  useEffect(() => { setData(initialData); }, [initialData]);

  useEffect(() => {
    let active = true;
    let fetching = false;
    let revision: string | null = null;
    let controller: AbortController | null = null;

    async function sync(versionOnly = false) {
      if (!active || fetching || document.visibilityState === 'hidden') return;
      if (versionOnly && !revision) versionOnly = false;
      fetching = true;
      controller = new AbortController();
      let shouldFetchContent = false;

      try {
        const endpoint = versionOnly ? '/api/site/version' : '/api/site';
        const response = await fetch(`${endpoint}?ts=${Date.now()}`, {
          cache: 'no-store',
          credentials: 'same-origin',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });
        if (!response.ok) return;

        if (versionOnly) {
          const result = await response.json() as { revision: string };
          shouldFetchContent = result.revision !== revision;
        } else {
          const fresh = await response.json() as PublicData;
          revision = response.headers.get('X-CMS-Revision');
          if (active) {
            setData((current) => JSON.stringify(current) === JSON.stringify(fresh) ? current : fresh);
          }
        }
      } catch {
        // Keep the last good content during temporary network failures or aborts.
      } finally {
        fetching = false;
        controller = null;
      }

      if (shouldFetchContent) await sync(false);
    }

    const channel = createCmsChannel();
    const onSave = () => { void sync(false); };
    const onReconcile = () => { void sync(true); };
    const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY) onSave(); };
    const onVisibility = () => { if (document.visibilityState === 'visible') onReconcile(); };

    channel?.addEventListener('message', onSave);
    window.addEventListener(CMS_UPDATE_EVENT, onSave);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onReconcile);
    window.addEventListener('pageshow', onReconcile);
    document.addEventListener('visibilitychange', onVisibility);
    const interval = window.setInterval(onReconcile, BACKGROUND_REFRESH_MS);

    // Reconcile any edit that happened between the server render and hydration.
    void sync(true);

    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(interval);
      channel?.removeEventListener('message', onSave);
      channel?.close();
      window.removeEventListener(CMS_UPDATE_EVENT, onSave);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onReconcile);
      window.removeEventListener('pageshow', onReconcile);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return data;
}
