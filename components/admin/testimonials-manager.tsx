'use client';

import { Edit3, Image as ImageIcon, MessageSquareQuote, Plus, Star, Trash2, Video } from 'lucide-react';
import { useState } from 'react';
import { adminFetch } from './api';
import { ConfirmDialog, EmptyState, ManagerHeader } from './shared';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Input, Select, Textarea } from '@/components/ui/form-controls';
import { Modal } from '@/components/ui/modal';
import type { Testimonial } from '@/lib/types';

export function TestimonialsManager({ testimonials, onChange, onToast }: { testimonials: Testimonial[]; onChange: (testimonials: Testimonial[]) => void; onToast: (message: string) => void }) {
  const [editing, setEditing] = useState<Testimonial | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Testimonial | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  function saved(testimonial: Testimonial) {
    const exists = testimonials.some((item) => item.id === testimonial.id);
    onChange((exists ? testimonials.map((item) => item.id === testimonial.id ? testimonial : item) : [...testimonials, testimonial]).sort((a, b) => a.sortOrder - b.sortOrder));
    setEditing(null); onToast(`${testimonial.name}'s story is now live.`);
  }
  async function remove() {
    if (!deleting) return; setDeleteBusy(true);
    try { await adminFetch(`/api/admin/testimonials/${deleting.id}`, { method: 'DELETE' }); onChange(testimonials.filter((item) => item.id !== deleting.id)); onToast(`${deleting.name}'s testimonial was deleted.`); setDeleting(null); }
    catch (error) { onToast(error instanceof Error ? error.message : 'Unable to delete testimonial.'); }
    finally { setDeleteBusy(false); }
  }
  return <div>
    <ManagerHeader eyebrow="CLIENT STORY CMS" title="Testimonials manager" description="Publish authentic client journeys with photos or playable video clips uploaded directly from your device." action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add testimonial</Button>} />
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-[11px] leading-5 text-blue-900"><Video className="mt-0.5 h-4 w-4 shrink-0" /><p>Uploads are stored as Base64 with the testimonial, so no external media service is required. For Netlify compatibility, keep images under 3 MB and video clips under 4 MB; larger videos should be compressed before upload.</p></div>
    {testimonials.length === 0 ? <EmptyState title="No client stories yet" description="Add your first client testimonial with a photo or video to build trust on the public website." action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add testimonial</Button>} /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{testimonials.map((testimonial) => <article key={testimonial.id} className="admin-card overflow-hidden"><div className="relative aspect-[1.6] bg-cream">{testimonial.mediaUrl ? testimonial.mediaType === 'video' ? <video src={testimonial.mediaUrl} poster={testimonial.posterUrl || undefined} className="h-full w-full object-cover" muted /> : <img src={testimonial.mediaUrl} alt={testimonial.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center font-serif text-5xl text-red-600">{testimonial.name.charAt(0)}</div>}<span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-[9px] font-bold text-ink-700 backdrop-blur-xl">{testimonial.mediaType === 'video' ? <Video className="h-3 w-3 text-red-600" /> : <ImageIcon className="h-3 w-3 text-red-600" />}{testimonial.mediaType}</span></div><div className="p-5"><div className="flex gap-0.5">{Array.from({ length: testimonial.rating }).map((_, index) => <Star key={index} className="h-3 w-3 fill-red-600 text-red-600" />)}</div><h2 className="mt-3 text-sm font-extrabold">{testimonial.name}</h2><p className="mt-1 text-[10px] text-ink-500">{testimonial.role}</p><blockquote className="mt-4 line-clamp-3 font-serif text-lg leading-6 text-ink-700">“{testimonial.quote}”</blockquote><p className="mt-3 text-[9px] font-semibold text-red-600">{testimonial.location}</p><div className="mt-5 flex items-center justify-between border-t border-ink-900/10 pt-4"><span className="text-[9px] text-ink-500">Display order: {testimonial.sortOrder}</span><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setEditing(testimonial)}><Edit3 className="h-3.5 w-3.5" />Edit</Button><Button variant="ghost" size="sm" onClick={() => setDeleting(testimonial)}><Trash2 className="h-3.5 w-3.5" /><span className="sr-only">Delete {testimonial.name}</span></Button></div></div></div></article>)}</div>}
    {editing && <TestimonialEditor key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} nextOrder={testimonials.length + 1} onClose={() => setEditing(null)} onSaved={saved} />}
    <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => void remove()} busy={deleteBusy} title={`Delete ${deleting?.name || 'client'}'s story?`} description="This removes the testimonial and its stored photo or video from the website. This action cannot be undone." />
  </div>;
}

function TestimonialEditor({ initial, nextOrder, onClose, onSaved }: { initial?: Testimonial; nextOrder: number; onClose: () => void; onSaved: (testimonial: Testimonial) => void }) {
  const [draft, setDraft] = useState<Testimonial>(() => initial ? structuredClone(initial) : { id: '', name: '', role: '', location: '', quote: '', rating: 5, mediaType: 'image', mediaUrl: '', posterUrl: '', sortOrder: nextOrder });
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const update = <K extends keyof Testimonial>(key: K, value: Testimonial[K]) => setDraft((current) => ({ ...current, [key]: value }));
  async function save() {
    if (!draft.name.trim() || !draft.quote.trim()) { setError('Client name and testimonial quote are required.'); return; }
    setSaving(true); setError('');
    try { const result = await adminFetch<{ testimonial: Testimonial }>(initial ? `/api/admin/testimonials/${initial.id}` : '/api/admin/testimonials', { method: initial ? 'PUT' : 'POST', body: JSON.stringify(draft) }); onSaved(result.testimonial); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to save testimonial.'); }
    finally { setSaving(false); }
  }
  return <Modal open onClose={onClose} label={initial ? `Edit ${initial.name}` : 'Add testimonial'} className="max-w-3xl"><div className="p-6 sm:p-8"><div className="pr-10"><span className="eyebrow"><MessageSquareQuote className="h-3.5 w-3.5" />CLIENT STORY EDITOR</span><h2 className="mt-2 font-serif text-4xl">{initial ? `Edit ${initial.name}'s story` : 'Add a client story'}</h2></div>{error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}<div className="mt-7 space-y-5"><div className="grid gap-5 sm:grid-cols-2"><Input label="Client full name" required value={draft.name} onChange={(event) => update('name', event.target.value)} /><Input label="Role / pathway" value={draft.role} onChange={(event) => update('role', event.target.value)} /><Input label="Journey / location" value={draft.location} onChange={(event) => update('location', event.target.value)} /><div className="grid grid-cols-2 gap-3"><Input label="Rating" type="number" min="1" max="5" value={draft.rating} onChange={(event) => update('rating', Number(event.target.value))} /><Input label="Display order" type="number" min="1" value={draft.sortOrder} onChange={(event) => update('sortOrder', Number(event.target.value))} /></div></div><Textarea label="Client testimonial" required value={draft.quote} onChange={(event) => update('quote', event.target.value)} className="[&_textarea]:min-h-[150px]" />
      <div className="rounded-2xl border border-ink-900/10 bg-cream p-4 sm:p-5"><div className="grid gap-5 sm:grid-cols-2"><Select label="Media type" value={draft.mediaType} onChange={(event) => { update('mediaType', event.target.value as 'image' | 'video'); update('mediaUrl', ''); }} placeholder="Choose media type" options={['image', 'video']} />{!draft.mediaUrl.startsWith('data:') && <Input label="Media URL (or use upload)" value={draft.mediaUrl} onChange={(event) => update('mediaUrl', event.target.value)} />}</div><div className="mt-5"><p className="field-label">{draft.mediaType === 'video' ? 'Testimonial video' : 'Client photo'}</p><FileUpload key={draft.mediaType} value={draft.mediaUrl} onChange={(value) => update('mediaUrl', value)} kind={draft.mediaType} accept={draft.mediaType === 'video' ? 'video/*' : 'image/*'} maxSizeMb={draft.mediaType === 'video' ? 4 : 3} label={draft.mediaType === 'video' ? 'Upload video from device' : 'Upload photo from device'} /></div>{draft.mediaType === 'video' && <div className="mt-5"><p className="field-label">Optional video poster image</p><FileUpload value={draft.posterUrl} onChange={(value) => update('posterUrl', value)} maxSizeMb={2} label="Upload video cover image" compact /></div>}</div>
    </div><div className="mt-8 flex justify-end gap-3 border-t border-ink-900/10 pt-5"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => void save()} loading={saving}>{initial ? 'Save testimonial' : 'Publish testimonial'}</Button></div></div></Modal>;
}
