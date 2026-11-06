'use client';

import { ArrowUpRight, Clock3, Edit3, Globe2, Plus, Route, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { adminFetch } from './api';
import { ConfirmDialog, EmptyState, LinesField, ManagerHeader } from './shared';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Input, Textarea } from '@/components/ui/form-controls';
import { Modal } from '@/components/ui/modal';
import type { Country } from '@/lib/types';
import { cn } from '@/lib/utils';

type EditorTab = 'basics' | 'criteria' | 'process' | 'timeline';

export function CountriesManager({ countries, onChange, onToast }: { countries: Country[]; onChange: (countries: Country[]) => void; onToast: (message: string) => void }) {
  const [editing, setEditing] = useState<Country | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Country | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function saved(country: Country) {
    const exists = countries.some((item) => item.id === country.id);
    onChange((exists ? countries.map((item) => item.id === country.id ? country : item) : [...countries, country]).sort((a, b) => a.sortOrder - b.sortOrder));
    setEditing(null); onToast(`${country.name} is now live on the website.`);
  }

  async function remove() {
    if (!deleting) return; setDeleteBusy(true);
    try { await adminFetch(`/api/admin/countries/${deleting.id}`, { method: 'DELETE' }); onChange(countries.filter((item) => item.id !== deleting.id)); onToast(`${deleting.name} was deleted.`); setDeleting(null); }
    catch (error) { onToast(error instanceof Error ? error.message : 'Unable to delete country.'); }
    finally { setDeleteBusy(false); }
  }

  return <div>
    <ManagerHeader eyebrow="DESTINATION CMS" title="Countries & visa processes" description="Create destinations and maintain their pathways, eligibility criteria, immigration process and realistic step-by-step timelines." action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add destination</Button>} />
    {countries.length === 0 ? <EmptyState title="No destinations yet" description="Add your first destination to publish its immigration pathways on the website." action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add destination</Button>} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{countries.map((country) => <article key={country.id} className="admin-card group overflow-hidden">
      {country.image && <div className="h-32 overflow-hidden"><img src={country.image} alt="" className="h-full w-full object-cover" /></div>}
      <div className="p-5"><div className="flex items-start justify-between gap-4"><span className="text-4xl">{country.flag}</span><span className="rounded-full bg-cream px-2.5 py-1 font-mono text-[9px] font-bold text-ink-500">{country.code || country.slug.toUpperCase()}</span></div><h2 className="mt-4 text-base font-extrabold">{country.name}</h2><p className="mt-1 text-[11px] font-semibold text-red-600">{country.tagline}</p><p className="mt-3 line-clamp-2 text-[11px] leading-5 text-ink-500">{country.summary}</p>
        <div className="mt-5 grid grid-cols-3 gap-2 border-y border-ink-900/10 py-4 text-center"><Meta value={country.routes.length} label="Routes" /><Meta value={country.processes.length} label="Processes" /><Meta value={country.timeline.length} label="Timeline" /></div>
        <div className="mt-4 flex items-center justify-between"><span className="text-[9px] font-semibold text-ink-500">Display order: {country.sortOrder}</span><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setEditing(country)}><Edit3 className="h-3.5 w-3.5" />Edit</Button><Button variant="ghost" size="sm" onClick={() => setDeleting(country)}><Trash2 className="h-3.5 w-3.5" /><span className="sr-only">Delete {country.name}</span></Button></div></div>
      </div></article>)}</div>}
    {editing && <CountryEditor key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} nextOrder={countries.length + 1} onClose={() => setEditing(null)} onSaved={saved} />}
    <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => void remove()} busy={deleteBusy} title={`Delete ${deleting?.name || 'destination'}?`} description="This removes the destination and all its pathways, eligibility details and timelines from the public website. Existing assessment submissions are not affected." />
  </div>;
}

function Meta({ value, label }: { value: number; label: string }) { return <div><p className="text-lg font-extrabold text-red-600">{value}</p><p className="mt-0.5 text-[9px] font-semibold text-ink-500">{label}</p></div>; }

function CountryEditor({ initial, nextOrder, onClose, onSaved }: { initial?: Country; nextOrder: number; onClose: () => void; onSaved: (country: Country) => void }) {
  const [draft, setDraft] = useState<Country>(() => initial ? structuredClone(initial) : { id: '', slug: '', name: '', code: '', flag: '', tagline: '', summary: '', image: '', routes: [], eligibility: [], processes: [], timeline: [], sortOrder: nextOrder });
  const [tab, setTab] = useState<EditorTab>('basics');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = <K extends keyof Country>(key: K, value: Country[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const tabs: { id: EditorTab; label: string; icon: typeof Globe2 }[] = [{ id: 'basics', label: 'Country profile', icon: Globe2 }, { id: 'criteria', label: 'Routes & eligibility', icon: Route }, { id: 'process', label: 'Immigration process', icon: ArrowUpRight }, { id: 'timeline', label: 'Timeline', icon: Clock3 }];

  async function save() {
    setError('');
    if (!draft.name.trim() || !draft.slug.trim()) { setError('Country name and URL slug are required.'); setTab('basics'); return; }
    setSaving(true);
    try {
      const payload = { ...draft, routes: draft.routes.filter((item) => item.trim()), eligibility: draft.eligibility.filter((item) => item.trim()), processes: draft.processes.filter((item) => item.title.trim()), timeline: draft.timeline.filter((item) => item.title.trim()) };
      const result = await adminFetch<{ country: Country }>(initial ? `/api/admin/countries/${initial.id}` : '/api/admin/countries', { method: initial ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      onSaved(result.country);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save destination.'); }
    finally { setSaving(false); }
  }

  return <Modal open onClose={onClose} label={initial ? `Edit ${initial.name}` : 'Add destination'} className="max-w-4xl"><div className="p-6 sm:p-8">
    <div className="pr-10"><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-red-600">DESTINATION EDITOR</p><h2 className="mt-2 font-serif text-4xl">{initial ? `Edit ${initial.name}` : 'Add a new destination'}</h2></div>
    <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto border-b border-ink-900/10 pb-3">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={cn('btn shrink-0 rounded-full border px-3.5 py-2 text-[10px] font-bold', tab === item.id ? 'border-red-600 bg-red-600 text-white' : 'border-ink-900/10 bg-white text-ink-500')}><item.icon className="h-3.5 w-3.5" />{item.label}</button>)}</div>
    {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}
    <div className="mt-6">
      {tab === 'basics' && <div className="space-y-5"><div className="grid gap-5 sm:grid-cols-2"><Input label="Country name" required value={draft.name} onChange={(event) => { update('name', event.target.value); if (!initial) update('slug', event.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')); }} /><Input label="URL slug" required value={draft.slug} onChange={(event) => update('slug', event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} /><Input label="Country code" value={draft.code} onChange={(event) => update('code', event.target.value.toUpperCase().slice(0, 4))} /><Input label="Flag emoji" value={draft.flag} onChange={(event) => update('flag', event.target.value)} /><Input label="Display order" type="number" min="1" value={draft.sortOrder} onChange={(event) => update('sortOrder', Number(event.target.value))} /></div><Input label="Card tagline" value={draft.tagline} onChange={(event) => update('tagline', event.target.value)} /><Textarea label="Country summary" value={draft.summary} onChange={(event) => update('summary', event.target.value)} /><div><p className="field-label">Optional country image</p><FileUpload value={draft.image} onChange={(value) => update('image', value)} maxSizeMb={3} label="Upload destination image" compact /></div></div>}
      {tab === 'criteria' && <div className="grid gap-6 md:grid-cols-2"><LinesField label="Popular immigration pathways" value={draft.routes} onChange={(value) => update('routes', value)} hint="One visa, work or study route per line." /><LinesField label="Core eligibility criteria" value={draft.eligibility} onChange={(value) => update('eligibility', value)} hint="One complete eligibility criterion per line." /></div>}
      {tab === 'process' && <div><div className="space-y-4">{draft.processes.map((process, index) => <div key={index} className="rounded-2xl border border-ink-900/10 bg-cream p-4"><div className="flex items-center justify-between"><span className="text-[10px] font-extrabold text-red-600">PROCESS {String(index + 1).padStart(2, '0')}</span><Button variant="ghost" size="sm" onClick={() => update('processes', draft.processes.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-3.5 w-3.5" />Remove</Button></div><div className="mt-3"><Input label="Process title" value={process.title} onChange={(event) => update('processes', draft.processes.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} /></div><div className="mt-3"><Textarea label="Process description" value={process.description} onChange={(event) => update('processes', draft.processes.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))} /></div></div>)}</div><Button variant="secondary" size="sm" className="mt-4" onClick={() => update('processes', [...draft.processes, { title: '', description: '' }])}><Plus className="h-4 w-4" />Add process step</Button></div>}
      {tab === 'timeline' && <div><div className="space-y-4">{draft.timeline.map((item, index) => <div key={index} className="rounded-2xl border border-ink-900/10 bg-cream p-4"><div className="flex items-center justify-between"><span className="text-[10px] font-extrabold text-red-600">TIMELINE {String(index + 1).padStart(2, '0')}</span><Button variant="ghost" size="sm" onClick={() => update('timeline', draft.timeline.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-3.5 w-3.5" />Remove</Button></div><div className="mt-3 grid gap-4 sm:grid-cols-3"><Input label="Step number" value={item.step} onChange={(event) => update('timeline', draft.timeline.map((entry, entryIndex) => entryIndex === index ? { ...entry, step: event.target.value } : entry))} /><Input label="Title" value={item.title} onChange={(event) => update('timeline', draft.timeline.map((entry, entryIndex) => entryIndex === index ? { ...entry, title: event.target.value } : entry))} /><Input label="Typical duration" value={item.duration} onChange={(event) => update('timeline', draft.timeline.map((entry, entryIndex) => entryIndex === index ? { ...entry, duration: event.target.value } : entry))} /></div><div className="mt-3"><Textarea label="Timeline description" value={item.description} onChange={(event) => update('timeline', draft.timeline.map((entry, entryIndex) => entryIndex === index ? { ...entry, description: event.target.value } : entry))} /></div></div>)}</div><Button variant="secondary" size="sm" className="mt-4" onClick={() => update('timeline', [...draft.timeline, { step: String(draft.timeline.length + 1).padStart(2, '0'), title: '', duration: '', description: '' }])}><Plus className="h-4 w-4" />Add timeline step</Button></div>}
    </div>
    <div className="mt-8 flex items-center justify-between border-t border-ink-900/10 pt-5"><p className="hidden text-[10px] text-ink-500 sm:block">Review all tabs before publishing.</p><div className="flex gap-3"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => void save()} loading={saving}>{initial ? 'Save destination' : 'Create destination'}</Button></div></div>
  </div></Modal>;
}
