'use client';

export const CMS_UPDATE_CHANNEL = 'redpath-cms-content';
export const CMS_UPDATE_EVENT = 'redpath:cms-content-updated';
const CMS_STORAGE_KEY = 'redpath-cms-content-updated';

export function createCmsChannel() {
  try { return 'BroadcastChannel' in window ? new BroadcastChannel(CMS_UPDATE_CHANNEL) : null; }
  catch { return null; }
}

/** Notify every open public tab after a public CMS record has been committed. */
export function broadcastCmsUpdate() {
  window.dispatchEvent(new Event(CMS_UPDATE_EVENT));

  const channel = createCmsChannel();
  channel?.postMessage({ type: 'content-updated', at: Date.now() });
  channel?.close();

  // Storage events also reach older browsers and tabs where BroadcastChannel is unavailable.
  try { window.localStorage.setItem(CMS_STORAGE_KEY, String(Date.now())); } catch { /* Storage can be disabled without breaking live polling. */ }
}
