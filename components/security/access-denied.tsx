import { Mail, ShieldOff } from 'lucide-react';
import {
  ACCESS_DENIED_BRAND, ACCESS_DENIED_EMAIL, ACCESS_DENIED_HEADING,
  ACCESS_DENIED_HINT, ACCESS_DENIED_MESSAGE, ACCESS_DENIED_TITLE,
} from '@/lib/access-denied';

/**
 * Server-rendered fallback for a blocked visitor. The edge middleware normally
 * answers with this same message and a real 403 status; this component covers
 * direct server renders so the restriction never depends on a single layer.
 */
export function AccessDenied({ email = ACCESS_DENIED_EMAIL }: { email?: string }) {
  return <main className="flex min-h-dvh items-center justify-center bg-[#FCFBFB] px-5 py-12">
    <div className="w-full max-w-xl rounded-3xl border border-ink-900/10 bg-white px-6 py-11 text-center shadow-[0_24px_60px_-40px_rgba(34,22,25,.55)] sm:px-10 sm:py-12">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600" aria-hidden="true"><ShieldOff className="h-6 w-6" /></span>
      <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[.19em] text-red-600">{ACCESS_DENIED_TITLE} · 403</p>
      <h1 className="mt-3 font-serif text-[34px] leading-[1.1] tracking-[-0.02em] text-ink-950 sm:text-4xl">{ACCESS_DENIED_HEADING}</h1>
      <p className="mx-auto mt-4 max-w-md text-[13px] leading-7 text-ink-500">{ACCESS_DENIED_MESSAGE}</p>
      <p className="mx-auto mt-3 max-w-md text-[13px] leading-7 text-ink-500">{ACCESS_DENIED_HINT}</p>
      <p className="mt-6 inline-block rounded-full border border-ink-900/10 bg-cream px-3.5 py-2 font-mono text-[10px] font-bold tracking-[.08em] text-ink-500">Reference: RESTRICTED-NETWORK</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a href={`mailto:${email}`} className="btn-primary btn-md"><Mail className="h-4 w-4" />Contact our office</a>
        <a href="/" className="btn-secondary btn-md">Try again</a>
      </div>
      <p className="mt-7 text-[10px] text-ink-500/70">{ACCESS_DENIED_BRAND}</p>
    </div>
  </main>;
}
