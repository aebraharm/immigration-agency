'use client';

import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form-controls';

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('portal11@gmail.com');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to sign in.');
      onSuccess();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign in.'); }
    finally { setLoading(false); }
  }

  return <main className="grid min-h-dvh bg-white lg:grid-cols-[1.05fr_.95fr]">
    <section className="relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-red-600/20 blur-[100px]" /><div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full border-[70px] border-white/[0.035]" />
      <a href="/" className="relative w-fit rounded-lg bg-white p-2"><img src="/brand-mark.svg" alt="Redpath Immigration Advisory" className="h-11 w-auto" /></a>
      <div className="relative max-w-xl"><span className="eyebrow text-red-500"><ShieldCheck className="h-4 w-4" />SECURE CONTENT WORKSPACE</span><h1 className="mt-6 font-serif text-6xl leading-[1.04]">Your agency.<br /><em className="text-red-500">One clear view.</em></h1><p className="mt-6 max-w-md text-sm leading-7 text-white/55">Manage your website, destination guidance, study programs, client stories and private assessments from one considered workspace.</p><div className="mt-10 grid grid-cols-3 gap-3">{['Live CMS', 'Media uploads', 'Assessments'].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-[11px] font-bold text-white/70 backdrop-blur-xl">{item}</div>)}</div></div>
      <p className="relative text-[10px] text-white/35">Authorised personnel only · Sessions expire after 8 hours</p>
    </section>
    <section className="flex items-center justify-center bg-red-radial px-5 py-12 sm:px-10"><div className="w-full max-w-md">
      <a href="/" className="mb-12 inline-flex rounded-lg lg:hidden"><img src="/brand-mark.svg" alt="Redpath Immigration Advisory" className="h-11 w-auto" /></a>
      <div className="admin-card p-6 shadow-glass sm:p-9"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600"><LockKeyhole className="h-5 w-5" /></div><h2 className="mt-6 font-serif text-4xl text-ink-950">Welcome back.</h2><p className="mt-2 text-xs leading-6 text-ink-500">Sign in to access the Redpath Admin Portal.</p>
        <form onSubmit={submit} className="mt-8 space-y-5"><Input label="Admin email" type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} /><div className="relative"><Input label="Password" type={show ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="[&_input]:pr-12" /><button type="button" onClick={() => setShow(!show)} className="btn absolute bottom-1.5 right-1.5 rounded-lg border-0 p-2.5 text-ink-500" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
          {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700">{error}</p>}
          <Button type="submit" size="lg" loading={loading} className="w-full">{loading ? 'Signing in…' : 'Sign in securely'}<ArrowRight className="h-4 w-4" /></Button>
        </form><p className="mt-6 flex items-start gap-2 text-[10px] leading-5 text-ink-500"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />Your session is protected by an HTTP-only signed cookie. Never share your admin credentials.</p>
      </div><a href="/" className="btn-ghost btn-sm mx-auto mt-6 flex w-fit">← Return to website</a>
    </div></section>
  </main>;
}
