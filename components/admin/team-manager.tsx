'use client';

import { Edit3, Plus, Trash2, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminFetch } from './api';
import { ConfirmDialog, EmptyState, LinesField, ManagerHeader, SaveBar } from './shared';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Input, Textarea } from '@/components/ui/form-controls';
import { Modal } from '@/components/ui/modal';
import type { SiteContent, TeamMember } from '@/lib/types';
import { humanize } from '@/lib/utils';

interface Props {
  members: TeamMember[]; content: SiteContent;
  onChange: (members: TeamMember[]) => void;
  onContentSaved: (content: SiteContent) => void;
  onToast: (message: string) => void;
}

export function TeamManager({ members, content, onChange, onContentSaved, onToast }: Props) {
  const [draftContent, setDraftContent] = useState(content);
  const [contentDirty, setContentDirty] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  const [contentSaved, setContentSaved] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<TeamMember | 'new' | null>(null);
  const [deleting, setDeleting] = useState<TeamMember | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  useEffect(() => { setDraftContent(content); setContentDirty(false); }, [content]);

  function updateSection(key: string, value: string) {
    setDraftContent((current) => ({ ...current, teamSection: { ...current.teamSection, [key]: value } }));
    setContentDirty(true); setContentSaved(false);
  }

  async function saveSection() {
    setContentSaving(true); setError('');
    try {
      const result = await adminFetch<{ content: SiteContent }>('/api/admin/content', { method: 'PUT', body: JSON.stringify(draftContent) });
      setContentDirty(false); setContentSaved(true); onContentSaved(result.content); onToast('Team section copy is now live.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save team section.'); }
    finally { setContentSaving(false); }
  }

  function saved(member: TeamMember) {
    const exists = members.some((item) => item.id === member.id);
    onChange((exists ? members.map((item) => item.id === member.id ? member : item) : [...members, member]).sort((a, b) => a.sortOrder - b.sortOrder));
    setEditing(null); onToast(`${member.name}'s consultant profile is now live.`);
  }

  async function remove() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await adminFetch(`/api/admin/team/${deleting.id}`, { method: 'DELETE' });
      onChange(members.filter((item) => item.id !== deleting.id)); onToast(`${deleting.name}'s profile was deleted.`); setDeleting(null);
    } catch (err) { onToast(err instanceof Error ? err.message : 'Unable to delete team member.'); }
    finally { setDeleteBusy(false); }
  }

  const nextOrder = Math.max(0, ...members.map((item) => item.sortOrder)) + 1;
  return <div>
    <ManagerHeader eyebrow="CONSULTANT DIRECTORY CMS" title="Team Members Manager" description="Publish consultant portraits, biographies, roles and credentials in a professional public team grid. Every edit synchronizes with the live website." action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add team member</Button>} />
    {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700">{error}</p>}
    <section className="admin-card p-5 sm:p-7"><div className="mb-6"><h2 className="text-sm font-extrabold">Team section introduction</h2><p className="mt-1.5 text-[11px] leading-5 text-ink-500">Edit the heading and credentials label displayed above the public consultant grid.</p></div>
      <div className="grid gap-5 sm:grid-cols-2">{Object.entries(draftContent.teamSection).map(([key, value]) => {
        const props = { label: humanize(key), value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateSection(key, event.target.value) };
        return key === 'description' ? <Textarea key={key} {...props} className="sm:col-span-2" /> : <Input key={key} {...props} />;
      })}</div><SaveBar saving={contentSaving} saved={contentSaved} dirty={contentDirty} onSave={() => void saveSection()} label="Save section copy" />
    </section>

    <div className="mb-5 mt-10 flex items-end justify-between gap-4"><div><h2 className="font-serif text-3xl">Consultant profiles</h2><p className="mt-1 text-[11px] text-ink-500">Use display order to control the public grid.</p></div><span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-ink-500">{members.length} published</span></div>
    {members.length === 0 ? <EmptyState title="No team members yet" description="Add your first consultant with a professional portrait, biography and credentials. The public team section stays hidden while empty." action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add team member</Button>} /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{members.map((member) => <article key={member.id} className="admin-card overflow-hidden">
      <div className="aspect-[4/4.1] overflow-hidden bg-cream"><img src={member.photoUrl} alt={member.name} className="h-full w-full object-cover object-top" /></div>
      <div className="p-5"><p className="text-[9px] font-extrabold uppercase tracking-wider text-red-600">{member.role}</p><h3 className="mt-2 font-serif text-2xl">{member.name}</h3><p className="mt-3 line-clamp-3 text-[10px] leading-5 text-ink-500">{member.bio}</p><p className="mt-4 text-[9px] font-semibold leading-5 text-ink-500">{member.credentials.filter(Boolean).join(' · ')}</p>
        <div className="mt-5 flex items-center justify-between border-t border-ink-900/10 pt-4"><span className="text-[9px] text-ink-500">Order {member.sortOrder}</span><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setEditing(member)}><Edit3 className="h-3.5 w-3.5" />Edit</Button><Button variant="ghost" size="sm" onClick={() => setDeleting(member)}><Trash2 className="h-3.5 w-3.5" /><span className="sr-only">Delete {member.name}</span></Button></div></div>
      </div>
    </article>)}</div>}
    {editing && <TeamMemberEditor key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} nextOrder={nextOrder} onClose={() => setEditing(null)} onSaved={saved} />}
    <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => void remove()} busy={deleteBusy} title={`Delete ${deleting?.name || 'team member'}?`} description="This permanently removes the consultant profile and its stored portrait from the public team grid." />
  </div>;
}

function TeamMemberEditor({ initial, nextOrder, onClose, onSaved }: { initial?: TeamMember; nextOrder: number; onClose: () => void; onSaved: (member: TeamMember) => void }) {
  const [draft, setDraft] = useState<TeamMember>(() => initial ? structuredClone(initial) : { id: '', name: '', role: '', bio: '', credentials: [], photoUrl: '', sortOrder: nextOrder });
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const update = <K extends keyof TeamMember>(key: K, value: TeamMember[K]) => setDraft((current) => ({ ...current, [key]: value }));
  async function save() {
    if (!draft.name.trim() || !draft.role.trim() || !draft.photoUrl) { setError('Name, role and a professional portrait are required.'); return; }
    setSaving(true); setError('');
    try {
      const result = await adminFetch<{ member: TeamMember }>(initial ? `/api/admin/team/${initial.id}` : '/api/admin/team', { method: initial ? 'PUT' : 'POST', body: JSON.stringify({ ...draft, credentials: draft.credentials.filter((item) => item.trim()) }) });
      onSaved(result.member);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save team member.'); }
    finally { setSaving(false); }
  }
  return <Modal open onClose={onClose} label={initial ? `Edit ${initial.name}` : 'Add team member'} className="max-w-3xl"><div className="p-6 sm:p-8"><div className="pr-10"><span className="eyebrow"><UsersRound className="h-3.5 w-3.5" />CONSULTANT PROFILE EDITOR</span><h2 className="mt-2 font-serif text-4xl">{initial ? `Edit ${initial.name}` : 'Add a team member'}</h2></div>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}
    <div className="mt-7 space-y-5"><div className="grid gap-5 sm:grid-cols-2"><Input label="Full name" required value={draft.name} onChange={(event) => update('name', event.target.value)} /><Input label="Professional role" required value={draft.role} onChange={(event) => update('role', event.target.value)} /></div><Textarea label="Short professional biography" value={draft.bio} onChange={(event) => update('bio', event.target.value)} className="[&_textarea]:min-h-[140px]" /><div className="grid gap-5 md:grid-cols-2"><LinesField label="Credentials & expertise" value={draft.credentials} onChange={(value) => update('credentials', value)} hint="One qualification, certification or area of expertise per line." /><Input label="Display order" type="number" min="1" value={draft.sortOrder} onChange={(event) => update('sortOrder', Number(event.target.value))} /></div>
      <div className="rounded-2xl border border-ink-900/10 bg-cream p-4 sm:p-5"><p className="field-label">Professional portrait <span className="text-red-600">*</span></p><FileUpload value={draft.photoUrl} onChange={(value) => update('photoUrl', value)} maxSizeMb={3} label="Upload team member photo" /><p className="mt-3 text-[10px] leading-5 text-ink-500">Use a clear vertical portrait. Uploads are stored as Base64 with this CMS record and preview immediately.</p>{!draft.photoUrl.startsWith('data:') && <div className="mt-4"><Input label="Portrait URL (or use upload)" value={draft.photoUrl} onChange={(event) => update('photoUrl', event.target.value)} /></div>}</div>
    </div><div className="mt-8 flex justify-end gap-3 border-t border-ink-900/10 pt-5"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => void save()} loading={saving}>{initial ? 'Save team member' : 'Publish team member'}</Button></div>
  </div></Modal>;
}
