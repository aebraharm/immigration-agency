'use client';

import { Award, Edit3, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminFetch } from './api';
import { ConfirmDialog, EmptyState, ManagerHeader, SaveBar } from './shared';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Input, Textarea } from '@/components/ui/form-controls';
import { Modal } from '@/components/ui/modal';
import type { Accreditation, SiteContent } from '@/lib/types';
import { humanize } from '@/lib/utils';

interface Props {
  items: Accreditation[]; content: SiteContent;
  onChange: (items: Accreditation[]) => void;
  onContentSaved: (content: SiteContent) => void;
  onToast: (message: string) => void;
}

export function AccreditationsManager({ items, content, onChange, onContentSaved, onToast }: Props) {
  const [draftContent, setDraftContent] = useState(content);
  const [contentDirty, setContentDirty] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  const [contentSaved, setContentSaved] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Accreditation | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Accreditation | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  useEffect(() => { setDraftContent(content); setContentDirty(false); }, [content]);

  function updateSection(key: string, value: string) {
    setDraftContent((current) => ({ ...current, accreditationsSection: { ...current.accreditationsSection, [key]: value } }));
    setContentDirty(true); setContentSaved(false);
  }

  async function saveSection() {
    setContentSaving(true); setError('');
    try {
      const result = await adminFetch<{ content: SiteContent }>('/api/admin/content', { method: 'PUT', body: JSON.stringify(draftContent) });
      setContentDirty(false); setContentSaved(true); onContentSaved(result.content); onToast('Accreditation section copy is now live.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save accreditation section.'); }
    finally { setContentSaving(false); }
  }

  function saved(item: Accreditation) {
    const exists = items.some((entry) => entry.id === item.id);
    onChange((exists ? items.map((entry) => entry.id === item.id ? item : entry) : [...items, item]).sort((a, b) => a.sortOrder - b.sortOrder));
    setEditing(null); onToast(`${item.title} is now live in the trust banner.`);
  }

  async function remove() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await adminFetch(`/api/admin/accreditations/${deleting.id}`, { method: 'DELETE' });
      onChange(items.filter((item) => item.id !== deleting.id)); onToast(`${deleting.title} was deleted.`); setDeleting(null);
    } catch (err) { onToast(err instanceof Error ? err.message : 'Unable to delete accreditation.'); }
    finally { setDeleteBusy(false); }
  }

  const nextOrder = Math.max(0, ...items.map((item) => item.sortOrder)) + 1;
  return <div>
    <ManagerHeader eyebrow="PROFESSIONAL TRUST CMS" title="Licenses & Accreditations" description="Manage the professional badge banner immediately above the public footer. Upload crisp badge artwork and edit each title and supporting label." action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add accreditation</Button>} />
    {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700">{error}</p>}
    <section className="admin-card p-5 sm:p-7"><div className="mb-6"><h2 className="text-sm font-extrabold">Trust banner introduction</h2><p className="mt-1.5 text-[11px] leading-5 text-ink-500">Edit the public heading and explanatory copy for the pre-footer accreditation banner.</p></div>
      <div className="grid gap-5 sm:grid-cols-2">{Object.entries(draftContent.accreditationsSection).map(([key, value]) => {
        const props = { label: humanize(key), value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateSection(key, event.target.value) };
        return key === 'description' || key === 'title' ? <Textarea key={key} {...props} className="sm:col-span-2" /> : <Input key={key} {...props} />;
      })}</div><SaveBar saving={contentSaving} saved={contentSaved} dirty={contentDirty} onSave={() => void saveSection()} label="Save banner copy" />
    </section>

    <div className="mb-5 mt-10 flex items-end justify-between gap-4"><div><h2 className="font-serif text-3xl">Professional badges</h2><p className="mt-1 text-[11px] text-ink-500">SVG, PNG and WebP artwork can be uploaded from your device.</p></div><span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-ink-500">{items.length} published</span></div>
    {items.length === 0 ? <EmptyState title="No accreditations yet" description="Add a license, professional standard or partner accreditation. The public trust banner stays hidden while empty." action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add accreditation</Button>} /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{items.map((item) => <article key={item.id} className="admin-card p-5">
      <div className="flex h-24 items-center justify-center rounded-xl border border-ink-900/[0.08] bg-white p-3"><img src={item.imageUrl} alt={item.title} className="h-full w-full object-contain" /></div><h3 className="mt-4 text-xs font-extrabold leading-5">{item.title}</h3><p className="mt-1 text-[10px] leading-5 text-ink-500">{item.subtitle}</p>
      <div className="mt-5 flex items-center justify-between border-t border-ink-900/10 pt-4"><span className="text-[9px] text-ink-500">Order {item.sortOrder}</span><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setEditing(item)}><Edit3 className="h-3.5 w-3.5" />Edit</Button><Button variant="ghost" size="sm" onClick={() => setDeleting(item)}><Trash2 className="h-3.5 w-3.5" /><span className="sr-only">Delete {item.title}</span></Button></div></div>
    </article>)}</div>}
    {editing && <AccreditationEditor key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} nextOrder={nextOrder} onClose={() => setEditing(null)} onSaved={saved} />}
    <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => void remove()} busy={deleteBusy} title={`Delete ${deleting?.title || 'accreditation'}?`} description="This permanently removes the badge and its uploaded artwork from the public trust banner." />
  </div>;
}

function AccreditationEditor({ initial, nextOrder, onClose, onSaved }: { initial?: Accreditation; nextOrder: number; onClose: () => void; onSaved: (item: Accreditation) => void }) {
  const [draft, setDraft] = useState<Accreditation>(() => initial ? structuredClone(initial) : { id: '', title: '', subtitle: '', imageUrl: '', sortOrder: nextOrder });
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const update = <K extends keyof Accreditation>(key: K, value: Accreditation[K]) => setDraft((current) => ({ ...current, [key]: value }));
  async function save() {
    if (!draft.title.trim() || !draft.imageUrl) { setError('Accreditation title and badge artwork are required.'); return; }
    setSaving(true); setError('');
    try {
      const result = await adminFetch<{ accreditation: Accreditation }>(initial ? `/api/admin/accreditations/${initial.id}` : '/api/admin/accreditations', { method: initial ? 'PUT' : 'POST', body: JSON.stringify(draft) });
      onSaved(result.accreditation);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save accreditation.'); }
    finally { setSaving(false); }
  }
  return <Modal open onClose={onClose} label={initial ? `Edit ${initial.title}` : 'Add accreditation'} className="max-w-2xl"><div className="p-6 sm:p-8"><div className="pr-10"><span className="eyebrow"><Award className="h-3.5 w-3.5" />PROFESSIONAL BADGE EDITOR</span><h2 className="mt-2 font-serif text-4xl">{initial ? `Edit ${initial.title}` : 'Add an accreditation'}</h2></div>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}
    <div className="mt-7 space-y-5"><Input label="Accreditation title" required value={draft.title} onChange={(event) => update('title', event.target.value)} /><Input label="Supporting label / subtitle" value={draft.subtitle} onChange={(event) => update('subtitle', event.target.value)} /><Input label="Display order" type="number" min="1" value={draft.sortOrder} onChange={(event) => update('sortOrder', Number(event.target.value))} />
      <div className="rounded-2xl border border-ink-900/10 bg-cream p-4 sm:p-5"><p className="field-label"><ShieldCheck className="mr-1.5 inline h-3.5 w-3.5 text-red-600" />Badge artwork <span className="text-red-600">*</span></p><FileUpload value={draft.imageUrl} onChange={(value) => update('imageUrl', value)} maxSizeMb={2} label="Upload accreditation badge" accept="image/*,.svg" compact /><p className="mt-3 text-[10px] leading-5 text-ink-500">For the sharpest result, use SVG or a transparent high-resolution PNG. The upload is stored as Base64 with this record.</p>{!draft.imageUrl.startsWith('data:') && <div className="mt-4"><Input label="Badge image URL (or use upload)" value={draft.imageUrl} onChange={(event) => update('imageUrl', event.target.value)} /></div>}</div>
    </div><div className="mt-8 flex justify-end gap-3 border-t border-ink-900/10 pt-5"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => void save()} loading={saving}>{initial ? 'Save accreditation' : 'Publish accreditation'}</Button></div>
  </div></Modal>;
}
