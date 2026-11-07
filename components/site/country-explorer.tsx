'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Check, CheckCircle2, Clock3, MapPin, Route } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { MobileScrollScene } from '@/components/ui/mobile-scroll-scene';
import { Reveal } from '@/components/ui/reveal';
import type { Country, SiteContent, SubmissionType } from '@/lib/types';

export function CountryExplorer({ countries, content, onConsultation }: { countries: Country[]; content: SiteContent; onConsultation: (type?: SubmissionType) => void }) {
  const [selected, setSelected] = useState<Country | null>(null);
  const c = content.countriesSection;
  return <section id="destinations" className="scroll-mt-24 bg-cream py-24 sm:py-28 lg:py-32">
    <MobileScrollScene name="destinations" className="container-site">
      <Reveal className="grid items-end gap-6 lg:grid-cols-[1fr_420px]">
        <div><span className="eyebrow"><MapPin className="h-3.5 w-3.5" />{c.eyebrow}</span>
          <h2 className="display-title mt-5 max-w-3xl">{c.title} <em className="text-red-600">{c.titleAccent}</em></h2>
        </div>
        <p className="max-w-md text-sm leading-7 text-ink-700 lg:justify-self-end">{c.description}</p>
      </Reveal>
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {countries.map((country, index) => <Reveal key={country.id} delay={index * 0.06}>
          <motion.button whileHover={{ y: -6 }} type="button" onClick={() => setSelected(country)} className="btn group relative flex h-full min-h-[330px] w-full flex-col items-start overflow-hidden rounded-[24px] border border-ink-900/10 bg-white p-5 text-left shadow-card hover:border-red-600/30 hover:shadow-lift lg:min-h-[360px]">
            {country.image ? <><img src={country.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-15 transition duration-500 group-hover:scale-105 group-hover:opacity-25" /><span className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/90 to-white" /></> : <span className="pointer-events-none absolute -right-4 top-16 font-serif text-[100px] leading-none text-ink-950/[0.035] transition group-hover:text-red-600/[0.06]">{country.code}</span>}
            <span className="relative flex w-full items-start justify-between"><span className="flex items-center gap-2"><span className="flex h-10 min-w-11 items-center justify-center rounded-xl bg-red-50 px-2 font-mono text-[10px] font-extrabold tracking-wider text-red-600">{country.code || country.name.slice(0, 3).toUpperCase()}</span><span className="text-2xl leading-none drop-shadow-sm">{country.flag}</span></span><span className="font-mono text-[10px] font-bold tracking-[.14em] text-ink-500">{String(index + 1).padStart(2, '0')} / {String(countries.length).padStart(2, '0')}</span></span>
            <span className="relative mt-8 text-[19px] font-extrabold tracking-[-0.035em] text-ink-950">{country.name}</span>
            <span className="relative mt-2 text-xs font-bold leading-5 text-red-600">{country.tagline}</span>
            <span className="relative mt-3 text-[11px] leading-5 text-ink-500">{country.summary}</span>
            <span className="relative mt-auto flex w-full items-center justify-between border-t border-ink-900/10 pt-4 text-[11px] font-extrabold text-ink-950"><span>{c.cardCta}</span><span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white"><ArrowUpRight className="h-4 w-4" /></span></span>
          </motion.button>
        </Reveal>)}
      </div>
    </MobileScrollScene>

    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} label={selected?.name || c.title} closeLabel={c.closeLabel} className="max-w-5xl">
      {selected && <div>
        <div className="relative overflow-hidden rounded-t-[28px] bg-ink-950 px-6 pb-8 pt-10 text-white sm:px-10 sm:pb-10">
          <span className="absolute -right-4 -top-10 font-serif text-[180px] leading-none text-white/[0.035]">{selected.code}</span>
          <div className="relative pr-8"><span className="text-5xl">{selected.flag}</span><p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-red-500">{selected.code} · {c.eyebrow}</p>
            <h2 className="mt-2 font-serif text-4xl sm:text-5xl">{selected.name}</h2><p className="mt-3 text-sm font-semibold text-red-100">{selected.tagline}</p>
            <p className="mt-4 max-w-2xl text-xs leading-6 text-white/60">{selected.summary}</p>
          </div>
        </div>
        <div className="space-y-10 px-6 py-8 sm:px-10 sm:py-10">
          <section><h3 className="flex items-center gap-2 text-sm font-extrabold"><Route className="h-4 w-4 text-red-600" />{c.routesTitle}</h3><div className="mt-4 grid gap-3 sm:grid-cols-3">{selected.routes.map((route, index) => <div key={route} className="rounded-2xl border border-red-100 bg-red-50/60 p-4"><span className="font-mono text-[10px] font-bold text-red-600">0{index + 1}</span><p className="mt-2 text-xs font-bold leading-5 text-ink-950">{route}</p></div>)}</div></section>
          <section><h3 className="text-sm font-extrabold">{c.processTitle}</h3><div className="mt-4 grid gap-5 md:grid-cols-3">{selected.processes.map((process, index) => <div key={process.title} className="relative border-t-2 border-ink-900/10 pt-4"><span className="absolute -top-[2px] left-0 h-[2px] w-10 bg-red-600" /><p className="text-xs font-extrabold">{process.title}</p><p className="mt-2 text-[11px] leading-5 text-ink-500">{process.description}</p></div>)}</div></section>
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
            <section><h3 className="text-sm font-extrabold">{c.eligibilityTitle}</h3><ul className="mt-4 space-y-3">{selected.eligibility.map((criterion) => <li key={criterion} className="flex items-start gap-2.5 text-[11px] leading-5 text-ink-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />{criterion}</li>)}</ul></section>
            <section><h3 className="flex items-center gap-2 text-sm font-extrabold"><Clock3 className="h-4 w-4 text-red-600" />{c.timelineTitle}</h3><div className="mt-4 space-y-0">{selected.timeline.map((item, index) => <div key={item.step} className="relative flex gap-4 pb-5 last:pb-0">{index < selected.timeline.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-20px)] w-px bg-red-100" />}<span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 font-mono text-[10px] font-bold text-red-600">{item.step}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-extrabold">{item.title}</p><span className="rounded-full bg-cream px-2.5 py-1 text-[9px] font-bold text-ink-500">{item.duration}</span></div><p className="mt-1 text-[11px] leading-5 text-ink-500">{item.description}</p></div></div>)}</div></section>
          </div>
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-cream p-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><Check className="h-5 w-5 text-red-600" /><p className="text-xs font-bold">{selected.tagline}</p></div><Button onClick={() => { setSelected(null); onConsultation('job'); }}>{c.modalCta}<ArrowRight className="h-4 w-4" /></Button></div>
        </div>
      </div>}
    </Modal>
  </section>;
}
