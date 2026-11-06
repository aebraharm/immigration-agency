'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Inbox, Save, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';

export function ManagerHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-red-600">{eyebrow}</p><h1 className="mt-2 font-serif text-4xl tracking-tight text-ink-950">{title}</h1><p className="mt-2 max-w-2xl text-xs leading-6 text-ink-500">{description}</p></div>{action}</div>;
}

export function SaveBar({ saving, saved, onSave, label = 'Save changes', dirty = true }: { saving: boolean; saved?: boolean; onSave: () => void; label?: string; dirty?: boolean }) {
  return <div className="sticky bottom-4 z-20 mt-7 flex items-center justify-between gap-4 rounded-2xl border border-white/50 bg-white/85 p-3 pl-4 shadow-glass backdrop-blur-xl"><div className="flex items-center gap-2 text-[11px] font-semibold text-ink-500">{saved && !dirty ? <><CheckCircle2 className="h-4 w-4 text-green-600" />All changes saved</> : <><span className={cn('h-2 w-2 rounded-full', dirty ? 'bg-amber-500' : 'bg-green-500')} />{dirty ? 'Unsaved changes' : 'Up to date'}</>}</div><Button onClick={onSave} loading={saving} disabled={!dirty}><Save className="h-4 w-4" />{label}</Button></div>;
}

export function ConfirmDialog({ open, title, description, onConfirm, onClose, busy }: { open: boolean; title: string; description: string; onConfirm: () => void; onClose: () => void; busy?: boolean }) {
  return <Modal open={open} onClose={onClose} label={title} className="max-w-md"><div className="p-7"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5" /></div><h2 className="mt-5 font-serif text-3xl text-ink-950">{title}</h2><p className="mt-3 text-xs leading-6 text-ink-500">{description}</p><div className="mt-7 flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={onConfirm} loading={busy}>Delete permanently</Button></div></div></Modal>;
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return <AnimatePresence>{message && <motion.div initial={{ opacity: 0, y: 20, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-5 left-1/2 z-[150] flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/20 bg-ink-950 px-4 py-3.5 text-xs font-semibold text-white shadow-2xl"><CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" /><span className="flex-1">{message}</span><button onClick={onClose} className="btn -mr-2 rounded-full border-0 p-2 text-white/60" aria-label="Dismiss notification"><X className="h-4 w-4" /></button></motion.div>}</AnimatePresence>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="admin-card flex flex-col items-center px-6 py-16 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600"><Inbox className="h-5 w-5" /></span><h3 className="mt-4 text-sm font-extrabold">{title}</h3><p className="mt-2 max-w-sm text-xs leading-6 text-ink-500">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function LinesField({ label, value, onChange, hint }: { label: string; value: string[]; onChange: (value: string[]) => void; hint?: string }) {
  return <label className="block"><span className="field-label">{label}</span><textarea className="field-input min-h-[120px] resize-y font-mono text-xs leading-6" value={value.join('\n')} onChange={(event) => onChange(event.target.value.split('\n'))} /><span className="mt-1.5 block text-[10px] text-ink-500">{hint || 'Enter one item per line. Empty lines are removed when displayed.'}</span></label>;
}

export function updateAt<T>(items: T[], index: number, value: T) { return items.map((item, itemIndex) => itemIndex === index ? value : item); }
