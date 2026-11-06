'use client';

import { BookOpen, CalendarDays, Edit3, GraduationCap, Plus, Trash2, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminFetch } from './api';
import { ConfirmDialog, EmptyState, LinesField, ManagerHeader, SaveBar } from './shared';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Input, Textarea } from '@/components/ui/form-controls';
import { Modal } from '@/components/ui/modal';
import type { SiteContent, StudyProgram } from '@/lib/types';
import { humanize } from '@/lib/utils';

export function StudyManager({ programs, content, onProgramsChange, onContentSaved, onToast }: { programs: StudyProgram[]; content: SiteContent; onProgramsChange: (programs: StudyProgram[]) => void; onContentSaved: (content: SiteContent) => void; onToast: (message: string) => void }) {
  const [draftContent, setDraftContent] = useState(content);
  const [contentDirty, setContentDirty] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  const [contentSaved, setContentSaved] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<StudyProgram | 'new' | null>(null);
  const [deleting, setDeleting] = useState<StudyProgram | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  useEffect(() => { setDraftContent(content); setContentDirty(false); }, [content]);

  function updateSection(key: string, value: string) {
    setDraftContent((current) => ({ ...current, studySection: { ...current.studySection, [key]: value } }));
    setContentDirty(true); setContentSaved(false);
  }

  async function saveSection() {
    setContentSaving(true); setError('');
    try { const result = await adminFetch<{ content: SiteContent }>('/api/admin/content', { method: 'PUT', body: JSON.stringify(draftContent) }); setContentDirty(false); setContentSaved(true); onContentSaved(result.content); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to save study section.'); }
    finally { setContentSaving(false); }
  }

  function saved(program: StudyProgram) {
    const exists = programs.some((item) => item.id === program.id);
    onProgramsChange((exists ? programs.map((item) => item.id === program.id ? program : item) : [...programs, program]).sort((a, b) => a.sortOrder - b.sortOrder));
    setEditing(null); onToast(`${program.title} is now live.`);
  }

  async function remove() {
    if (!deleting) return; setDeleteBusy(true);
    try { await adminFetch(`/api/admin/programs/${deleting.id}`, { method: 'DELETE' }); onProgramsChange(programs.filter((item) => item.id !== deleting.id)); onToast(`${deleting.title} was deleted.`); setDeleting(null); }
    catch (err) { onToast(err instanceof Error ? err.message : 'Unable to delete program.'); }
    finally { setDeleteBusy(false); }
  }

  return <div>
    <ManagerHeader eyebrow="UNIVERSITY STUDY CMS" title="Study abroad manager" description="Manage Bachelor's (BSc), Master's and PhD programs, including section copy, highlights, destinations, intakes, tuition guidance and requirements." action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add program</Button>} />
    {error && <p className="mb-5 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700">{error}</p>}
    <section className="admin-card p-5 sm:p-7"><div className="mb-6"><h2 className="text-sm font-extrabold">Study section introduction</h2><p className="mt-1.5 text-[11px] leading-5 text-ink-500">Every text label in the dark undergraduate and postgraduate section and its editorial image.</p></div>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]"><div><p className="field-label">Study abroad image</p><FileUpload value={draftContent.studySection.image} onChange={(value) => updateSection('image', value)} maxSizeMb={4} label="Upload study section image" /></div><div className="grid gap-5 sm:grid-cols-2">{Object.entries(draftContent.studySection).filter(([key, value]) => key !== 'image' && typeof value === 'string').map(([key, value]) => {
        const text = String(value); const props = { label: humanize(key), value: text, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateSection(key, event.target.value) };
        return text.length > 90 || key === 'description' || key === 'partnershipText' ? <Textarea key={key} {...props} className="sm:col-span-2" /> : <Input key={key} {...props} />;
      })}</div></div><SaveBar saving={contentSaving} saved={contentSaved} dirty={contentDirty} onSave={() => void saveSection()} label="Save section copy" />
    </section>

    <div className="mb-5 mt-10 flex items-end justify-between"><div><h2 className="font-serif text-3xl">Programs</h2><p className="mt-1 text-[11px] text-ink-500">Create any number of undergraduate and postgraduate opportunities.</p></div><span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-ink-500">{programs.length} published</span></div>
    {programs.length === 0 ? <EmptyState title="No study programs yet" description="Add a Bachelor's (BSc), Master's, PhD or other university opportunity to publish it in the study section." action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add program</Button>} /> : <div className="grid gap-5 xl:grid-cols-2">{programs.map((program) => <article key={program.id} className="admin-card p-6"><div className="flex items-start justify-between gap-4"><span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-[10px] font-extrabold text-red-600"><GraduationCap className="h-3.5 w-3.5" />{program.degree}</span><span className="text-[10px] font-semibold text-ink-500">Order {program.sortOrder}</span></div><h3 className="mt-4 font-serif text-3xl">{program.title}</h3><p className="mt-3 line-clamp-2 text-[11px] leading-5 text-ink-500">{program.description}</p><div className="mt-5 grid gap-3 border-y border-ink-900/10 py-4 text-[10px] text-ink-500 sm:grid-cols-2"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-red-600" />{program.intake}</span><span className="flex items-center gap-2"><WalletCards className="h-4 w-4 text-red-600" />{program.investment}</span></div><p className="mt-4 text-[10px] font-semibold leading-5 text-ink-500">{program.destination}</p><div className="mt-5 flex justify-end gap-2"><Button variant="secondary" size="sm" onClick={() => setEditing(program)}><Edit3 className="h-3.5 w-3.5" />Edit program</Button><Button variant="ghost" size="sm" onClick={() => setDeleting(program)}><Trash2 className="h-3.5 w-3.5" /><span className="sr-only">Delete {program.title}</span></Button></div></article>)}</div>}
    {editing && <ProgramEditor key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} nextOrder={programs.length + 1} degreeOptions={draftContent.forms.options.targetPrograms} onClose={() => setEditing(null)} onSaved={saved} />}
    <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => void remove()} busy={deleteBusy} title={`Delete ${deleting?.title || 'program'}?`} description="This removes the program and all its highlights, requirements, intake and tuition details from the public website." />
  </div>;
}

function ProgramEditor({ initial, nextOrder, degreeOptions, onClose, onSaved }: { initial?: StudyProgram; nextOrder: number; degreeOptions: string[]; onClose: () => void; onSaved: (program: StudyProgram) => void }) {
  const [draft, setDraft] = useState<StudyProgram>(() => initial ? structuredClone(initial) : { id: '', degree: degreeOptions[0] || "Bachelor's (BSc)", title: '', destination: '', duration: '', description: '', highlights: [], requirements: [], intake: '', investment: '', sortOrder: nextOrder });
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const update = <K extends keyof StudyProgram>(key: K, value: StudyProgram[K]) => setDraft((current) => ({ ...current, [key]: value }));
  async function save() {
    if (!draft.title.trim() || !draft.degree.trim()) { setError('Program title and degree are required.'); return; }
    setSaving(true); setError('');
    try { const result = await adminFetch<{ program: StudyProgram }>(initial ? `/api/admin/programs/${initial.id}` : '/api/admin/programs', { method: initial ? 'PUT' : 'POST', body: JSON.stringify({ ...draft, highlights: draft.highlights.filter((item) => item.trim()), requirements: draft.requirements.filter((item) => item.trim()) }) }); onSaved(result.program); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to save program.'); }
    finally { setSaving(false); }
  }
  return <Modal open onClose={onClose} label={initial ? `Edit ${initial.title}` : 'Add study program'} className="max-w-3xl"><div className="p-6 sm:p-8"><div className="pr-10"><span className="eyebrow"><BookOpen className="h-3.5 w-3.5" />PROGRAM EDITOR</span><h2 className="mt-2 font-serif text-4xl">{initial ? `Edit ${initial.title}` : 'Add a study program'}</h2></div>{error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}<div className="mt-7 space-y-5"><div className="grid gap-5 sm:grid-cols-2"><div><Input label="Degree / category" required value={draft.degree} onChange={(event) => update('degree', event.target.value)} list="study-degree-options" hint="Choose a CMS degree option or enter a custom label." /><datalist id="study-degree-options">{degreeOptions.map((degree) => <option key={degree} value={degree} />)}</datalist></div><Input label="Program title" required value={draft.title} onChange={(event) => update('title', event.target.value)} /><Input label="Duration" value={draft.duration} onChange={(event) => update('duration', event.target.value)} /><Input label="Display order" type="number" min="1" value={draft.sortOrder} onChange={(event) => update('sortOrder', Number(event.target.value))} /></div><Textarea label="Program description" value={draft.description} onChange={(event) => update('description', event.target.value)} /><Input label="Partner countries / destinations" value={draft.destination} onChange={(event) => update('destination', event.target.value)} /><div className="grid gap-5 sm:grid-cols-2"><Input label="Next intakes" value={draft.intake} onChange={(event) => update('intake', event.target.value)} /><Input label="Tuition / investment guidance" value={draft.investment} onChange={(event) => update('investment', event.target.value)} /></div><div className="grid gap-5 md:grid-cols-2"><LinesField label="Program highlights" value={draft.highlights} onChange={(value) => update('highlights', value)} /><LinesField label="Typical requirements" value={draft.requirements} onChange={(value) => update('requirements', value)} /></div></div><div className="mt-8 flex justify-end gap-3 border-t border-ink-900/10 pt-5"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => void save()} loading={saving}>{initial ? 'Save program' : 'Create program'}</Button></div></div></Modal>;
}
