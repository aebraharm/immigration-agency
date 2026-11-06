'use client';

import { BriefcaseBusiness, ChevronRight, Download, Eye, FileText, GraduationCap, Mail, RefreshCw, Search, Trash2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { adminFetch } from './api';
import { ConfirmDialog, EmptyState, ManagerHeader } from './shared';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import type { SiteContent, Submission, SubmissionStatus, SubmissionType } from '@/lib/types';
import { cn, downloadFile, escapeCsv, formatDate, humanize } from '@/lib/utils';

type TypeFilter = 'all' | SubmissionType;
type StatusFilter = 'all' | SubmissionStatus;
const statuses: SubmissionStatus[] = ['new', 'reviewed', 'contacted', 'archived'];

export function SubmissionsManager({ submissions, content, onChange, onToast }: { submissions: Submission[]; content: SiteContent; onChange: (submissions: Submission[]) => void; onToast: (message: string) => void }) {
  const [type, setType] = useState<TypeFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Submission | null>(null);
  const [deleting, setDeleting] = useState<Submission | null>(null);
  const [busyId, setBusyId] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const filtered = useMemo(() => submissions.filter((item) => {
    const text = `${item.fullName} ${item.email} ${item.reference}`.toLowerCase();
    return (type === 'all' || item.type === type) && (status === 'all' || item.status === status) && text.includes(query.toLowerCase().trim());
  }), [submissions, type, status, query]);

  async function updateStatus(item: Submission, nextStatus: SubmissionStatus) {
    setBusyId(item.id);
    try {
      const result = await adminFetch<{ submission: Submission }>(`/api/admin/submissions/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
      onChange(submissions.map((entry) => entry.id === item.id ? result.submission : entry));
      setSelected((current) => current?.id === item.id ? result.submission : current);
      onToast(`${item.reference} marked as ${nextStatus}.`);
    } catch (error) { onToast(error instanceof Error ? error.message : 'Unable to update status.'); }
    finally { setBusyId(''); }
  }

  async function refresh() {
    setRefreshing(true);
    try { const result = await adminFetch<{ submissions: Submission[] }>('/api/admin/submissions'); onChange(result.submissions); onToast('Assessment inbox refreshed.'); }
    catch (error) { onToast(error instanceof Error ? error.message : 'Unable to refresh.'); }
    finally { setRefreshing(false); }
  }

  async function remove() {
    if (!deleting) return; setBusyId(deleting.id);
    try { await adminFetch(`/api/admin/submissions/${deleting.id}`, { method: 'DELETE' }); onChange(submissions.filter((item) => item.id !== deleting.id)); if (selected?.id === deleting.id) setSelected(null); onToast(`${deleting.reference} was permanently deleted.`); setDeleting(null); }
    catch (error) { onToast(error instanceof Error ? error.message : 'Unable to delete submission.'); }
    finally { setBusyId(''); }
  }

  function exportCsv() {
    const keys = Array.from(new Set(filtered.flatMap((item) => Object.keys(item.data).filter((key) => key !== 'website'))));
    const headers = ['Reference', 'Type', 'Status', 'Submitted', 'Full name', 'Email', ...keys.map((key) => content.forms.labels[key] || humanize(key))];
    const rows = filtered.map((item) => [item.reference, item.type, item.status, item.createdAt, item.fullName, item.email, ...keys.map((key) => item.data[key])]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
    downloadFile(`redpath-assessments-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${csv}`);
    onToast(`${filtered.length} assessment${filtered.length === 1 ? '' : 's'} exported.`);
  }

  const counts = { all: submissions.length, job: submissions.filter((item) => item.type === 'job').length, student: submissions.filter((item) => item.type === 'student').length, new: submissions.filter((item) => item.status === 'new').length };
  return <div>
    <ManagerHeader eyebrow="PRIVATE ASSESSMENT INBOX" title="Consultation submissions" description="Review every job and student assessment, filter your pipeline, open complete answers and track follow-up status." action={<div className="flex gap-2"><Button variant="secondary" onClick={() => void refresh()} loading={refreshing}><RefreshCw className="h-4 w-4" />Refresh</Button><Button variant="secondary" onClick={exportCsv} disabled={!filtered.length}><Download className="h-4 w-4" />Export CSV</Button></div>} />
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat icon={Users} value={counts.all} label="Total assessments" /><Stat icon={FileText} value={counts.new} label="Awaiting review" accent /><Stat icon={BriefcaseBusiness} value={counts.job} label="Job applications" /><Stat icon={GraduationCap} value={counts.student} label="Student applications" /></div>
    <div className="admin-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-ink-900/10 p-4 xl:flex-row xl:items-center xl:justify-between"><div className="flex gap-1 rounded-xl bg-cream p-1">{(['all', 'job', 'student'] as TypeFilter[]).map((item) => <button key={item} onClick={() => setType(item)} className={cn('btn rounded-lg border border-transparent px-3 py-2 text-[10px] font-bold capitalize', type === item ? 'bg-white text-red-600 shadow-sm' : 'text-ink-500 hover:bg-white')}>{item === 'all' ? 'All types' : item === 'job' ? 'Job' : 'Student'}<span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[9px]">{counts[item]}</span></button>)}</div><div className="flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><span className="sr-only">Search assessments</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email or reference" className="field-input min-w-0 pl-9 sm:w-64" /></label><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="field-input sm:w-40"><option value="all">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}</select></div></div>
      {filtered.length === 0 ? <div className="p-5"><EmptyState title={submissions.length ? 'No matching assessments' : 'Your assessment inbox is ready'} description={submissions.length ? 'Try changing the type, status or search filters to find another submission.' : 'New job and student consultation forms will appear here with every answer submitted by the client.'} /></div> : <div className="overflow-x-auto"><table className="w-full min-w-[880px] border-collapse text-left"><thead><tr className="border-b border-ink-900/10 bg-cream/60 text-[9px] font-extrabold uppercase tracking-[.12em] text-ink-500"><th className="px-5 py-3.5">Applicant</th><th className="px-4 py-3.5">Assessment</th><th className="px-4 py-3.5">Reference</th><th className="px-4 py-3.5">Submitted</th><th className="px-4 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Details</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="border-b border-ink-900/[0.07] last:border-0 hover:bg-red-50/20"><td className="px-5 py-4"><p className="text-xs font-extrabold text-ink-950">{item.fullName}</p><a href={`mailto:${item.email}`} className="mt-1 block text-[10px] text-ink-500 hover:text-red-600">{item.email}</a></td><td className="px-4 py-4"><span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold', item.type === 'job' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700')}>{item.type === 'job' ? <BriefcaseBusiness className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}{item.type === 'job' ? 'Job application' : 'Student application'}</span></td><td className="px-4 py-4 font-mono text-[9px] font-bold text-ink-500">{item.reference}</td><td className="px-4 py-4 text-[10px] leading-4 text-ink-500">{formatDate(item.createdAt, true)}</td><td className="px-4 py-4"><select aria-label={`Status for ${item.reference}`} disabled={busyId === item.id} value={item.status} onChange={(event) => void updateStatus(item, event.target.value as SubmissionStatus)} className={cn('rounded-full border px-2.5 py-1.5 text-[9px] font-bold capitalize outline-none focus:ring-2 focus:ring-blue-600/20', statusStyle(item.status))}>{statuses.map((entry) => <option key={entry} value={entry}>{entry}</option>)}</select></td><td className="px-5 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => setSelected(item)}><Eye className="h-3.5 w-3.5" />View<ChevronRight className="h-3 w-3" /></Button></td></tr>)}</tbody></table></div>}
      <div className="border-t border-ink-900/10 bg-cream/40 px-5 py-3 text-[10px] text-ink-500">Showing {filtered.length} of {submissions.length} assessments</div>
    </div>
    {selected && <SubmissionDetail key={selected.id} submission={selected} content={content} busy={busyId === selected.id} onClose={() => setSelected(null)} onStatus={(next) => void updateStatus(selected, next)} onDelete={() => { setDeleting(selected); setSelected(null); }} />}
    <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => void remove()} busy={Boolean(deleting && busyId === deleting.id)} title={`Delete ${deleting?.reference || 'assessment'}?`} description="This permanently deletes the applicant's assessment and every answer in it. Consider exporting a copy first if your records policy requires one." />
  </div>;
}

function Stat({ icon: Icon, value, label, accent }: { icon: typeof Users; value: number; label: string; accent?: boolean }) { return <div className="admin-card p-4 sm:p-5"><div className="flex items-center justify-between"><span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', accent ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600')}><Icon className="h-4 w-4" /></span><span className="font-serif text-3xl sm:text-4xl">{value}</span></div><p className="mt-3 text-[10px] font-semibold text-ink-500">{label}</p></div>; }
function statusStyle(status: SubmissionStatus) { return status === 'new' ? 'border-red-100 bg-red-50 text-red-700' : status === 'contacted' ? 'border-green-100 bg-green-50 text-green-700' : status === 'reviewed' ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-ink-900/10 bg-cream text-ink-500'; }

const personalKeys = ['fullName', 'dateOfBirth', 'gender', 'nationality', 'maritalStatus', 'hasChildren', 'childrenCount', 'residenceCountry', 'streetAddress', 'city', 'state', 'postalCode', 'countryCode', 'mobile', 'alternativeCountryCode', 'alternativeMobile', 'email'];
const legacyCountryCodeKeys = new Set(['countryCode', 'alternativeCountryCode']);
const passportKeys = ['hasPassport', 'passportNumber', 'passportCity', 'passportIssueDate', 'passportExpiryDate'];
const disclosureKeys = ['medicalCondition', 'medicalDetails', 'criminalRecord', 'criminalDetails', 'travelHistory', 'travelCountries', 'familyOutside', 'familyCountry', 'licensedExams', 'examDetails'];

function SubmissionDetail({ submission, content, busy, onClose, onStatus, onDelete }: { submission: Submission; content: SiteContent; busy: boolean; onClose: () => void; onStatus: (status: SubmissionStatus) => void; onDelete: () => void }) {
  const visiblePersonalKeys = personalKeys.filter((key) => !legacyCountryCodeKeys.has(key) || submission.data[key] !== undefined);
  const groups: { title: string; keys: string[] }[] = [
    { title: content.forms.labels.personalDetails, keys: visiblePersonalKeys },
    { title: content.forms.labels.passportDetails, keys: passportKeys },
    ...(submission.type === 'job' ? [
      { title: content.forms.labels.education, keys: ['qualificationLevel', 'institution', 'institutionCountry', 'graduationYear'] },
      { title: content.forms.labels.employmentHistory, keys: ['hasCurrentEmployment', 'currentEmployer', 'currentPosition', 'currentEmploymentCountry', 'employmentStartDate', 'monthlySalary', 'hasPreviousEmployment', 'previousEmployer', 'previousPosition', 'previousEmploymentCountry', 'yearsWorked'] },
      { title: content.forms.labels.professionalSkills, keys: ['skills', 'languages'] },
      { title: content.forms.labels.preferredEmployment, keys: ['preferredCountry', 'preferredOccupation', 'expectedSalary'] },
    ] : [
      { title: content.forms.labels.educationHistory, keys: ['educationHistory'] },
      { title: content.forms.labels.programPreferences, keys: ['targetProgram', 'preferredDestination', 'intendedCourse', 'researchTopic', 'startIntake', 'fundingPlan', 'languages'] },
    ]),
    { title: content.forms.labels.disclosures, keys: disclosureKeys },
    { title: content.consultation.termsTitle, keys: ['terms'] },
  ];
  const known = new Set(groups.flatMap((group) => group.keys)); known.add('website');
  const extras = Object.keys(submission.data).filter((key) => !known.has(key));
  if (extras.length) groups.push({ title: 'Additional submitted answers', keys: extras });
  return <Modal open onClose={onClose} label={`Assessment ${submission.reference}`} className="max-w-5xl"><div className="bg-[#FCFBFB]">
    <div className="border-b border-ink-900/10 bg-white px-6 py-7 sm:px-8"><div className="pr-10"><div className="flex flex-wrap items-center gap-2"><span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold', submission.type === 'job' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700')}>{submission.type === 'job' ? <BriefcaseBusiness className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}{submission.type === 'job' ? content.consultation.jobTitle : content.consultation.studentTitle}</span><span className={cn('rounded-full border px-2.5 py-1 text-[9px] font-bold capitalize', statusStyle(submission.status))}>{submission.status}</span></div><h2 className="mt-4 font-serif text-4xl">{submission.fullName}</h2><p className="mt-2 font-mono text-[10px] font-bold text-red-600">{submission.reference}</p><div className="mt-4 flex flex-wrap gap-4 text-[10px] text-ink-500"><a href={`mailto:${submission.email}`} className="flex items-center gap-1.5 font-semibold hover:text-red-600"><Mail className="h-3.5 w-3.5" />{submission.email}</a><span>{formatDate(submission.createdAt, true)}</span></div></div></div>
    <div className="flex flex-col gap-3 border-b border-ink-900/10 bg-cream/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8"><label className="flex items-center gap-3 text-[10px] font-bold text-ink-500">Follow-up status<select value={submission.status} disabled={busy} onChange={(event) => onStatus(event.target.value as SubmissionStatus)} className="field-input w-40 py-2 text-xs capitalize">{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" />Delete assessment</Button></div>
    <div className="space-y-8 px-6 py-7 sm:px-8 sm:py-9">{groups.map((group) => <section key={group.title}><h3 className="border-l-2 border-red-600 pl-3 text-xs font-extrabold text-ink-950">{group.title}</h3><dl className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-ink-900/10 bg-ink-900/10 sm:grid-cols-2">{group.keys.map((key) => <div key={key} className={cn('bg-white p-4', ['medicalDetails', 'criminalDetails', 'travelCountries', 'examDetails', 'educationHistory', 'skills', 'languages'].includes(key) && 'sm:col-span-2')}><dt className="text-[9px] font-bold uppercase leading-4 tracking-[.08em] text-ink-500">{content.forms.labels[key] || humanize(key)}</dt><dd className="mt-2 text-[11px] font-semibold leading-5 text-ink-900"><Answer value={submission.data[key]} field={key} content={content} /></dd></div>)}</dl></section>)}</div>
  </div></Modal>;
}

function Answer({ value, field, content }: { value: unknown; field: string; content: SiteContent }) {
  if (value === true) return <>{content.forms.yes}</>;
  if (value === false) return <>{content.forms.no}</>;
  if (value === null || value === undefined || value === '') return <span className="font-normal text-ink-500">Not provided</span>;
  if (field === 'educationHistory' && Array.isArray(value)) return <div className="space-y-3">{value.map((entry, index) => <div key={index} className="rounded-xl bg-cream p-3"><p className="mb-2 text-[9px] font-extrabold text-red-600">QUALIFICATION {index + 1}</p>{typeof entry === 'object' && entry ? <dl className="grid gap-2 sm:grid-cols-2">{Object.entries(entry as Record<string, unknown>).map(([key, answer]) => <div key={key}><dt className="text-[8px] uppercase text-ink-500">{content.forms.labels[key] || humanize(key)}</dt><dd className="mt-0.5">{String(answer || 'Not provided')}</dd></div>)}</dl> : String(entry)}</div>)}</div>;
  if (field === 'languages' && typeof value === 'object' && !Array.isArray(value)) return <div className="grid gap-2 sm:grid-cols-2">{Object.entries(value as Record<string, unknown>).map(([language, level]) => <span key={language} className="rounded-lg bg-cream px-3 py-2"><b>{language}:</b> {String(level)}</span>)}</div>;
  if (Array.isArray(value)) return value.length ? <ul className="flex flex-wrap gap-1.5">{value.map((item, index) => <li key={index} className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] text-red-700">{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>)}</ul> : <span className="font-normal text-ink-500">Not provided</span>;
  if (typeof value === 'object') return <pre className="whitespace-pre-wrap break-words font-sans font-normal">{JSON.stringify(value, null, 2)}</pre>;
  return <span className="whitespace-pre-wrap break-words">{String(value)}</span>;
}
