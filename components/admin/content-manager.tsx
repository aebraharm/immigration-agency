'use client';

import { Braces, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminFetch } from './api';
import { LinesField, ManagerHeader, SaveBar } from './shared';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Input, Textarea } from '@/components/ui/form-controls';
import type { SiteContent } from '@/lib/types';
import { cn, humanize } from '@/lib/utils';

type Section = 'brand' | 'hero' | 'sections' | 'journey' | 'forms' | 'advanced';
const sections: { id: Section; label: string }[] = [
  { id: 'brand', label: 'Brand & contact' }, { id: 'hero', label: 'Hero & navigation' },
  { id: 'sections', label: 'Section copy' }, { id: 'journey', label: 'Journey & FAQs' },
  { id: 'forms', label: 'Forms & legal' }, { id: 'advanced', label: 'Advanced JSON' },
];

export function ContentManager({ content, onSaved }: { content: SiteContent; onSaved: (content: SiteContent) => void }) {
  const [draft, setDraft] = useState(content);
  const [section, setSection] = useState<Section>('brand');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [json, setJson] = useState(JSON.stringify(content, null, 2));

  useEffect(() => { setDraft(content); setJson(JSON.stringify(content, null, 2)); setDirty(false); }, [content]);

  function update(path: string, value: unknown) {
    const next = structuredClone(draft) as any;
    const keys = path.split('.'); let cursor = next;
    for (const key of keys.slice(0, -1)) cursor = cursor[key];
    cursor[keys[keys.length - 1]] = value;
    setDraft(next); setDirty(true); setSaved(false); setError('');
  }


  async function save() {
    setSaving(true); setError('');
    try {
      const payload = section === 'advanced' ? JSON.parse(json) as SiteContent : draft;
      if (!payload.brand?.name || !payload.hero?.title || !payload.consultation?.termsText) throw new Error('Brand name, hero title and terms text are required.');
      const result = await adminFetch<{ content: SiteContent }>('/api/admin/content', { method: 'PUT', body: JSON.stringify(payload) });
      setDraft(result.content); setDirty(false); setSaved(true); onSaved(result.content);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save content.'); }
    finally { setSaving(false); }
  }

  return <div>
    <ManagerHeader eyebrow="WEBSITE CMS" title="Branding & general content" description="Publish your identity, website copy, navigation, forms and legal content. Changes update the public website immediately after saving." />
    <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto border-b border-ink-900/10 pb-3">{sections.map((item) => <button key={item.id} onClick={() => { setSection(item.id); if (item.id === 'advanced') setJson(JSON.stringify(draft, null, 2)); }} className={cn('btn shrink-0 rounded-full border px-4 py-2.5 text-[10px] font-bold', section === item.id ? 'border-red-600 bg-red-600 text-white' : 'border-ink-900/10 bg-white text-ink-500 hover:border-red-600/30 hover:text-red-600')}>{item.id === 'advanced' && <Braces className="h-3.5 w-3.5" />}{item.label}</button>)}</div>
    {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">{error}</p>}

    {section === 'brand' && <div className="space-y-5">
      <EditorCard title="Agency identity" description="This logo is shared by the website navigation, consultation forms and admin workspace."><div className="grid gap-6 lg:grid-cols-[300px_1fr]"><FileUpload value={draft.brand.logo} onChange={(value) => update('brand.logo', value)} label="Upload agency logo" maxSizeMb={2} /><ObjectFields update={update} object={draft.brand as unknown as Record<string, unknown>} path="brand" exclude={['logo', 'email', 'phone', 'whatsapp', 'address', 'officeHours']} /></div></EditorCard>
      <EditorCard title="Contact & office" description="Used throughout the footer and contact links."><ObjectFields update={update} object={Object.fromEntries(Object.entries(draft.brand).filter(([key]) => ['email', 'phone', 'whatsapp', 'address', 'officeHours'].includes(key)))} path="brand" /></EditorCard>
      <EditorCard title="Search & sharing" description="The default search-engine title and description for the public website."><ObjectFields update={update} object={draft.seo as unknown as Record<string, unknown>} path="seo" /></EditorCard>
    </div>}

    {section === 'hero' && <div className="space-y-5">
      <EditorCard title="Hero content" description="The first message visitors see, including both consultation entry points."><ObjectFields update={update} object={draft.hero as unknown as Record<string, unknown>} path="hero" exclude={['image', 'stats']} /></EditorCard>
      <EditorCard title="Hero image" description="Upload a vertical editorial image for the main hero composition."><FileUpload value={draft.hero.image} onChange={(value) => update('hero.image', value)} label="Upload hero image" maxSizeMb={4} /></EditorCard>
      <EditorCard title="Glass statistics" description="Edit the three trust metrics shown in the hero."><div className="grid gap-4 md:grid-cols-3">{draft.hero.stats.map((stat, index) => <div key={index} className="rounded-xl border border-ink-900/10 bg-cream p-4"><Input label={`Statistic ${index + 1} value`} value={stat.value} onChange={(event) => update(`hero.stats.${index}.value`, event.target.value)} /><div className="mt-3"><Input label="Label" value={stat.label} onChange={(event) => update(`hero.stats.${index}.label`, event.target.value)} /></div><Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => update('hero.stats', draft.hero.stats.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-3.5 w-3.5" />Remove</Button></div>)}</div><Button variant="secondary" size="sm" className="mt-4" onClick={() => update('hero.stats', [...draft.hero.stats, { value: '', label: '' }])}><Plus className="h-4 w-4" />Add statistic</Button></EditorCard>
      <EditorCard title="Navigation links" description="Edit anchor labels and destinations, or add a new section link."><div className="space-y-3">{draft.navigation.map((item, index) => <div key={item.id} className="grid items-end gap-3 rounded-xl border border-ink-900/10 p-4 sm:grid-cols-[1fr_1fr_auto]"><Input label="Link label" value={item.label} onChange={(event) => update(`navigation.${index}.label`, event.target.value)} /><Input label="URL / section anchor" value={item.href} onChange={(event) => update(`navigation.${index}.href`, event.target.value)} /><Button variant="ghost" size="sm" onClick={() => update('navigation', draft.navigation.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /><span className="sr-only">Remove link</span></Button></div>)}</div><Button variant="secondary" size="sm" className="mt-4" onClick={() => update('navigation', [...draft.navigation, { id: `nav-${Date.now()}`, label: '', href: '#' }])}><Plus className="h-4 w-4" />Add navigation link</Button></EditorCard>
    </div>}

    {section === 'sections' && <div className="space-y-5">
      <EditorCard title="Destinations introduction & labels" description="All headings, card actions and detail-view labels for country pathways."><ObjectFields update={update} object={draft.countriesSection as unknown as Record<string, unknown>} path="countriesSection" /></EditorCard>
      <EditorCard title="Testimonials introduction" description="The section heading, labels and video accessibility copy."><ObjectFields update={update} object={draft.testimonialsSection as unknown as Record<string, unknown>} path="testimonialsSection" /></EditorCard>
      <EditorCard title="Final call to action" description="The closing consultation banner."><ObjectFields update={update} object={draft.finalCta as unknown as Record<string, unknown>} path="finalCta" /></EditorCard>
      <EditorCard title="Footer & legal introduction" description="Footer copy and publicly available privacy information."><ObjectFields update={update} object={draft.footer as unknown as Record<string, unknown>} path="footer" /></EditorCard>
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-[11px] leading-5 text-blue-900">Study Abroad introduction and imagery are managed directly in the <b>Study abroad</b> tab. Individual destinations, programs and testimonials have their own structured editors.</div>
    </div>}

    {section === 'journey' && <div className="space-y-5">
      <EditorCard title="Our approach" description="Edit the four-step client journey and its introduction."><ObjectFields update={update} object={Object.fromEntries(Object.entries(draft.journey).filter(([key]) => key !== 'steps'))} path="journey" /><div className="mt-6 space-y-4">{draft.journey.steps.map((step, index) => <div key={index} className="grid gap-4 rounded-xl border border-ink-900/10 bg-cream p-4 sm:grid-cols-[90px_180px_1fr_auto] sm:items-end"><Input label="Number" value={step.number} onChange={(event) => update(`journey.steps.${index}.number`, event.target.value)} /><Input label="Title" value={step.title} onChange={(event) => update(`journey.steps.${index}.title`, event.target.value)} /><Input label="Description" value={step.description} onChange={(event) => update(`journey.steps.${index}.description`, event.target.value)} /><Button variant="ghost" size="sm" onClick={() => update('journey.steps', draft.journey.steps.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button></div>)}</div><Button variant="secondary" size="sm" className="mt-4" onClick={() => update('journey.steps', [...draft.journey.steps, { number: String(draft.journey.steps.length + 1).padStart(2, '0'), title: '', description: '' }])}><Plus className="h-4 w-4" />Add journey step</Button></EditorCard>
      <EditorCard title="Frequently asked questions" description="Every question and answer in the public accordion is editable."><ObjectFields update={update} object={Object.fromEntries(Object.entries(draft.faqSection).filter(([key]) => key !== 'items'))} path="faqSection" /><div className="mt-6 space-y-4">{draft.faqSection.items.map((item, index) => <div key={index} className="rounded-xl border border-ink-900/10 p-4"><div className="flex items-start gap-3"><div className="flex-1"><Input label={`Question ${index + 1}`} value={item.question} onChange={(event) => update(`faqSection.items.${index}.question`, event.target.value)} /></div><Button variant="ghost" size="sm" onClick={() => update('faqSection.items', draft.faqSection.items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button></div><div className="mt-3"><Textarea label="Answer" value={item.answer} onChange={(event) => update(`faqSection.items.${index}.answer`, event.target.value)} /></div></div>)}</div><Button variant="secondary" size="sm" className="mt-4" onClick={() => update('faqSection.items', [...draft.faqSection.items, { question: '', answer: '' }])}><Plus className="h-4 w-4" />Add question</Button></EditorCard>
    </div>}

    {section === 'forms' && <div className="space-y-5">
      <EditorCard title="Consultation introduction & success" description="Application-type cards, privacy note, review copy and submission confirmation."><ObjectFields update={update} object={Object.fromEntries(Object.entries(draft.consultation).filter(([key]) => !['termsText', 'stepLabels'].includes(key)))} path="consultation" /></EditorCard>
      <EditorCard title="Terms & conditions" description="Mandatory legal copy shown before every assessment submission."><Textarea label="Terms and conditions text" value={draft.consultation.termsText} onChange={(event) => update('consultation.termsText', event.target.value)} className="[&_textarea]:min-h-[280px]" /></EditorCard>
      <EditorCard title="Shared form controls" description="Button labels, validation copy and common choices."><ObjectFields update={update} object={Object.fromEntries(Object.entries(draft.forms).filter(([key]) => !['labels', 'options'].includes(key)))} path="forms" /><div className="mt-6 grid gap-5 md:grid-cols-2">{Object.entries(draft.forms.options).map(([key, values]) => <LinesField key={key} label={humanize(key)} value={values} onChange={(next) => update(`forms.options.${key}`, next)} />)}</div></EditorCard>
      <EditorCard title="Assessment field labels" description="Every public form heading, question and field label can be changed here."><div className="grid gap-4 md:grid-cols-2">{Object.entries(draft.forms.labels).map(([key, label]) => <Input key={key} label={humanize(key)} value={label} onChange={(event) => update(`forms.labels.${key}`, event.target.value)} />)}</div></EditorCard>
    </div>}

    {section === 'advanced' && <EditorCard title="Complete content document" description="Advanced editing for the entire public content model. Valid JSON is required; structured database records are managed in their own tabs."><textarea aria-label="Complete website content JSON" className="field-input min-h-[650px] resize-y bg-ink-950 font-mono text-[11px] leading-6 text-green-300 focus:border-blue-600 focus:ring-blue-600/20" spellCheck={false} value={json} onChange={(event) => { setJson(event.target.value); setDirty(true); setSaved(false); }} /><p className="mt-3 text-[10px] leading-5 text-ink-500">Use this for bulk copy changes or to edit nested content not exposed in a structured field. Keep all required objects, arrays and media values intact.</p></EditorCard>}
    <SaveBar saving={saving} saved={saved} dirty={dirty} onSave={() => void save()} label="Save & publish content" />
  </div>;
}


function ObjectFields({ object, path, update, exclude = [] }: { object: Record<string, unknown>; path: string; update: (path: string, value: unknown) => void; exclude?: string[] }) {
  const entries = Object.entries(object).filter(([key, value]) => typeof value === 'string' && !exclude.includes(key));
  return <div className="grid gap-5 sm:grid-cols-2">{entries.map(([key, value]) => {
    const stringValue = String(value); const long = stringValue.length > 90 || /description|text|note|terms/i.test(key);
    const props = { label: humanize(key), value: stringValue, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(`${path}.${key}`, event.target.value) };
    return long ? <Textarea key={key} {...props} className="sm:col-span-2" /> : <Input key={key} {...props} />;
  })}</div>;
}

function EditorCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="admin-card p-5 sm:p-7"><div className="mb-6"><h2 className="text-sm font-extrabold tracking-tight text-ink-950">{title}</h2><p className="mt-1.5 text-[11px] leading-5 text-ink-500">{description}</p></div>{children}</section>;
}
