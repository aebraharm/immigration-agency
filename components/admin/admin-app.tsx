'use client';

import { Award, BookOpen, Database, ExternalLink, FileText, Globe2, LayoutDashboard, LoaderCircle, LogOut, MessageSquareQuote, Settings2, Users, UsersRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AccreditationsManager } from './accreditations-manager';
import { ContentManager } from './content-manager';
import { CountriesManager } from './countries-manager';
import { LoginScreen } from './login-screen';
import { StudyManager } from './study-manager';
import { SubmissionsManager } from './submissions-manager';
import { TeamManager } from './team-manager';
import { TestimonialsManager } from './testimonials-manager';
import { Toast } from './shared';
import { adminFetch } from './api';
import { Button, ButtonLink } from '@/components/ui/button';
import type { AdminData } from '@/lib/types';
import { cn } from '@/lib/utils';

type Tab = 'content' | 'countries' | 'study' | 'team' | 'testimonials' | 'accreditations' | 'submissions';
const tabs: { id: Tab; label: string; description: string; icon: typeof LayoutDashboard }[] = [
  { id: 'content', label: 'Branding & content', description: 'Website copy and settings', icon: Settings2 },
  { id: 'countries', label: 'Countries & processes', description: 'Destinations and pathways', icon: Globe2 },
  { id: 'study', label: 'Study abroad', description: "BSc, Master's and PhD programs", icon: BookOpen },
  { id: 'team', label: 'Team Members Manager', description: 'Consultants, photos and credentials', icon: UsersRound },
  { id: 'testimonials', label: 'Testimonials', description: 'Client photos and videos', icon: MessageSquareQuote },
  { id: 'accreditations', label: 'Licenses & Accreditations', description: 'Professional badges and trust copy', icon: Award },
  { id: 'submissions', label: 'Consultations', description: 'Assessment submissions', icon: Users },
];

export function AdminApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [data, setData] = useState<AdminData | null>(null);
  const [tab, setTab] = useState<Tab>('content');
  const [toast, setToast] = useState('');
  const [loadError, setLoadError] = useState('');

  const loadData = useCallback(async () => {
    setLoadError('');
    try { const result = await adminFetch<AdminData>('/api/admin/content'); setData(result); }
    catch (error) { setLoadError(error instanceof Error ? error.message : 'Unable to load workspace.'); }
  }, []);

  useEffect(() => {
    fetch('/api/admin/session').then((response) => response.json()).then(async (result) => {
      setAuthenticated(Boolean(result.authenticated));
      if (result.authenticated) await loadData();
    }).catch(() => setAuthenticated(false));
  }, [loadData]);

  useEffect(() => {
    const expired = () => { setAuthenticated(false); setData(null); };
    window.addEventListener('admin:unauthorized', expired);
    return () => window.removeEventListener('admin:unauthorized', expired);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timeout);
  }, [toast]);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthenticated(false); setData(null); setTab('content');
  }

  if (authenticated === null) return <div className="flex min-h-dvh items-center justify-center bg-cream"><div className="text-center"><LoaderCircle className="mx-auto h-7 w-7 animate-spin text-red-600" /><p className="mt-3 text-xs font-semibold text-ink-500">Opening secure workspace…</p></div></div>;
  if (!authenticated) return <LoginScreen onSuccess={() => { setAuthenticated(true); void loadData(); }} />;
  if (!data) return <div className="flex min-h-dvh items-center justify-center bg-cream px-5"><div className="admin-card max-w-md p-8 text-center">{loadError ? <><p className="text-sm font-bold text-red-600">{loadError}</p><Button className="mt-5" onClick={() => void loadData()}>Try again</Button></> : <><LoaderCircle className="mx-auto h-7 w-7 animate-spin text-red-600" /><p className="mt-3 text-xs font-semibold text-ink-500">Loading your content and submissions…</p></>}</div></div>;

  const newCount = data.submissions.filter((item) => item.status === 'new').length;
  return <div className="min-h-dvh bg-[#F7F5F5] text-ink-950">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-white/10 bg-ink-950 p-5 text-white lg:flex">
      <a href="/" target="_blank" className="rounded-xl bg-white p-2.5"><img src={data.content.brand.logo} alt={data.content.brand.logoAlt} className="h-10 w-full object-contain object-left" /></a>
      <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[10px] font-semibold text-white/60"><Database className="h-3.5 w-3.5 text-red-500" />{data.storageMode === 'turso' ? 'Turso database connected' : 'Preview datastore active'}<span className={cn('ml-auto h-1.5 w-1.5 rounded-full', data.storageMode === 'turso' ? 'bg-green-400' : 'bg-amber-400')} /></div>
      <p className="mb-3 mt-7 px-3 text-[9px] font-extrabold uppercase tracking-[.18em] text-white/30">Workspace</p>
      <nav className="no-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={cn('btn group w-full justify-start rounded-xl border border-transparent px-3 py-3 text-left', tab === item.id ? 'bg-red-600 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white')}><item.icon className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1"><span className="block text-[11px] font-bold">{item.label}</span><span className={cn('mt-0.5 block truncate text-[9px] font-medium', tab === item.id ? 'text-red-100' : 'text-white/30')}>{item.description}</span></span>{item.id === 'submissions' && newCount > 0 && <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold text-white group-[.bg-red-600]:bg-white group-[.bg-red-600]:text-red-600">{newCount}</span>}</button>)}</nav>
      <div className="mt-auto space-y-2 border-t border-white/10 pt-5"><ButtonLink href="/" target="_blank" variant="ghost" size="sm" className="w-full justify-start text-white/60 hover:bg-white/5 hover:text-white"><ExternalLink className="h-4 w-4" />View live website</ButtonLink><Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-white/60 hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4" />Sign out</Button><p className="truncate px-3 pt-2 text-[9px] text-white/25">portal11@gmail.com · Administrator</p></div>
    </aside>

    <div className="lg:pl-[260px]">
      <header className="sticky top-0 z-30 border-b border-ink-900/[0.07] bg-white/85 backdrop-blur-xl">
        <div className="flex h-[70px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10"><div className="flex items-center gap-3"><LayoutDashboard className="h-4 w-4 text-red-600" /><span className="text-xs font-extrabold">Admin Portal</span><span className="hidden rounded-full bg-cream px-2.5 py-1 text-[9px] font-semibold text-ink-500 sm:inline">Live content management</span></div><div className="flex items-center gap-2"><ButtonLink href="/" target="_blank" variant="ghost" size="sm" className="hidden sm:inline-flex">View website<ExternalLink className="h-3.5 w-3.5" /></ButtonLink><Button variant="ghost" size="sm" onClick={logout} className="lg:hidden"><LogOut className="h-4 w-4" /><span className="sr-only sm:not-sr-only">Sign out</span></Button></div></div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={cn('btn shrink-0 rounded-full border px-3 py-2 text-[10px] font-bold', tab === item.id ? 'border-red-600 bg-red-600 text-white' : 'border-ink-900/10 bg-white text-ink-500')}><item.icon className="h-3.5 w-3.5" />{item.label}{item.id === 'submissions' && newCount > 0 && <span className="rounded-full bg-white/20 px-1.5">{newCount}</span>}</button>)}</nav>
      </header>
      <main className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        {data.storageMode === 'preview' && <div className="mb-7 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[11px] leading-5 text-amber-900"><Database className="mt-0.5 h-4 w-4 shrink-0" /><p><b>Preview storage is active.</b> All edits, uploads and submissions work now and persist in this workspace. Add <code>TURSO_DATABASE_URL</code> and <code>TURSO_AUTH_TOKEN</code> in Netlify for durable production storage.</p></div>}
        {tab === 'content' && <ContentManager content={data.content} onSaved={(content) => { setData({ ...data, content }); setToast('Website content saved and published.'); }} />}
        {tab === 'countries' && <CountriesManager countries={data.countries} onChange={(countries) => setData({ ...data, countries })} onToast={setToast} />}
        {tab === 'study' && <StudyManager programs={data.programs} content={data.content} onProgramsChange={(programs) => setData({ ...data, programs })} onContentSaved={(content) => { setData({ ...data, content }); setToast('Study abroad section published.'); }} onToast={setToast} />}
        {tab === 'team' && <TeamManager members={data.teamMembers} content={data.content} onChange={(teamMembers) => setData({ ...data, teamMembers })} onContentSaved={(content) => setData({ ...data, content })} onToast={setToast} />}
        {tab === 'testimonials' && <TestimonialsManager testimonials={data.testimonials} onChange={(testimonials) => setData({ ...data, testimonials })} onToast={setToast} />}
        {tab === 'accreditations' && <AccreditationsManager items={data.accreditations} content={data.content} onChange={(accreditations) => setData({ ...data, accreditations })} onContentSaved={(content) => setData({ ...data, content })} onToast={setToast} />}
        {tab === 'submissions' && <SubmissionsManager submissions={data.submissions} content={data.content} onChange={(submissions) => setData({ ...data, submissions })} onToast={setToast} />}
      </main>
    </div>
    <Toast message={toast} onClose={() => setToast('')} />
  </div>;
}
