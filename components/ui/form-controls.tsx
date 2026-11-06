'use client';

import { Check, ChevronDown } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Field({ label, error, hint, required, optional, children, className }: { label: string; error?: string; hint?: string; required?: boolean; optional?: string; children: ReactNode; className?: string }) {
  return <label className={cn('block', className)}>
    <span className="field-label">{label}{required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}{optional && <span className="ml-2 font-medium text-ink-500">({optional})</span>}</span>
    {children}
    {hint && !error && <span className="mt-1.5 block text-[11px] leading-relaxed text-ink-500">{hint}</span>}
    {error && <span className="mt-1.5 block text-[11px] font-semibold text-red-600" role="alert">{error}</span>}
  </label>;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label: string; error?: string; hint?: string; optional?: string; }
export function Input({ label, error, hint, optional, required, className, ...props }: InputProps) {
  return <Field label={label} error={error} hint={hint} optional={optional} required={required} className={className}>
    <input {...props} required={required} className={cn('field-input', error && 'border-red-500 bg-red-50/30')} aria-invalid={Boolean(error)} />
  </Field>;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label: string; error?: string; hint?: string; optional?: string; placeholder: string; options: string[]; }
export function Select({ label, error, hint, optional, placeholder, options, required, className, ...props }: SelectProps) {
  return <Field label={label} error={error} hint={hint} optional={optional} required={required} className={className}>
    <span className="relative block">
      <select {...props} required={required} className={cn('field-input appearance-none pr-10', error && 'border-red-500 bg-red-50/30')} aria-invalid={Boolean(error)}>
        <option value="">{placeholder}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
    </span>
  </Field>;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label: string; error?: string; hint?: string; optional?: string; }
export function Textarea({ label, error, hint, optional, required, className, ...props }: TextareaProps) {
  return <Field label={label} error={error} hint={hint} optional={optional} required={required} className={className}>
    <textarea {...props} required={required} className={cn('field-input min-h-[110px] resize-y', error && 'border-red-500 bg-red-50/30')} aria-invalid={Boolean(error)} />
  </Field>;
}

export function YesNo({ label, value, onChange, yes, no, error, required = true }: { label: string; value: boolean | null; onChange: (value: boolean) => void; yes: string; no: string; error?: string; required?: boolean }) {
  return <div>
    <span className="field-label">{label}{required && <span className="ml-1 text-red-600">*</span>}</span>
    <div className="grid grid-cols-2 gap-2" role="group" aria-label={label}>
      {[true, false].map((option) => <button key={String(option)} type="button" aria-pressed={value === option} onClick={() => onChange(option)} className={cn('btn min-h-11 rounded-xl border px-4 text-xs font-bold', value === option ? 'border-red-600 bg-red-50 text-red-700 ring-1 ring-red-600' : 'border-ink-900/15 bg-white text-ink-700 hover:border-red-600/40 hover:bg-red-50/40')}>
        {value === option && <Check className="h-3.5 w-3.5" />}{option ? yes : no}
      </button>)}
    </div>
    {error && <p className="mt-1.5 text-[11px] font-semibold text-red-600" role="alert">{error}</p>}
  </div>;
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="border-t border-ink-900/10 pt-7 first:border-0 first:pt-0">
    <h3 className="text-base font-extrabold tracking-[-0.02em] text-ink-950">{title}</h3>
    {description && <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{description}</p>}
    <div className="mt-5 space-y-5">{children}</div>
  </section>;
}
