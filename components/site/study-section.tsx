'use client';

import { ArrowRight, BookOpen, CalendarDays, Check, GraduationCap, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileCarousel } from '@/components/ui/mobile-carousel';
import { Reveal } from '@/components/ui/reveal';
import type { SiteContent, StudyProgram, SubmissionType } from '@/lib/types';

type StudyContent = SiteContent['studySection'];

export function StudySection({ programs, content, onConsultation }: { programs: StudyProgram[]; content: SiteContent; onConsultation: (type?: SubmissionType) => void }) {
  const c = content.studySection;
  return <section id="study" className="relative scroll-mt-24 overflow-hidden bg-ink-950 py-24 text-white sm:py-28 lg:py-32">
    <div className="pointer-events-none absolute -right-40 top-0 h-[600px] w-[600px] rounded-full bg-red-600/15 blur-[120px]" />
    <div className="pointer-events-none absolute inset-0 opacity-[0.045]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)', backgroundSize: '70px 70px' }} />
    <div className="container-site relative">
      <Reveal className="grid items-end gap-8 lg:grid-cols-[1fr_430px]">
        <div><span className="eyebrow text-red-500"><GraduationCap className="h-4 w-4" />{c.eyebrow}</span><h2 className="display-title mt-5 max-w-2xl text-white">{c.title} <em className="text-red-500">{c.titleAccent}</em></h2></div>
        <p className="text-sm leading-7 text-white/60">{c.description}</p>
      </Reveal>
      <div className="mt-12 grid gap-6 lg:grid-cols-[.82fr_1.18fr]">
        <Reveal className="relative min-h-[460px] overflow-hidden rounded-[28px] border border-white/10 lg:min-h-full">
          <img src={c.image} alt={c.imageAlt} className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/10 to-transparent" />
          <div className="glass absolute bottom-5 left-5 right-5 rounded-2xl p-5 text-ink-950"><span className="text-[9px] font-extrabold uppercase tracking-[.18em] text-red-600">{c.partnershipEyebrow}</span><p className="mt-2 font-serif text-2xl leading-tight">{c.imageCaption}</p><p className="mt-3 text-[11px] leading-5 text-ink-700">{c.partnershipText}</p></div>
        </Reveal>
        <div className="min-w-0">
          <Reveal className="min-w-0 lg:hidden"><MobileCarousel
            tone="dark"
            label={`${c.title} ${c.titleAccent}`}
            itemLabels={programs.map((program) => program.title)}
            itemKeys={programs.map((program) => program.id)}
            items={programs.map((program) => <StudyProgramCard key={program.id} program={program} content={c} onConsultation={onConsultation} />)}
          /></Reveal>
          <div className="hidden gap-5 lg:grid">
            {programs.map((program, index) => <Reveal key={program.id} delay={index * 0.08}><StudyProgramCard program={program} content={c} onConsultation={onConsultation} /></Reveal>)}
          </div>
        </div>
      </div>
    </div>
  </section>;
}

function StudyProgramCard({ program, content: c, onConsultation }: { program: StudyProgram; content: StudyContent; onConsultation: (type?: SubmissionType) => void }) {
  return <article className="group h-full rounded-[28px] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-xl transition duration-300 hover:border-red-500/40 hover:bg-white/[0.075] sm:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><span className="inline-flex items-center gap-2 rounded-full bg-red-600/15 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.14em] text-red-400"><BookOpen className="h-3.5 w-3.5" />{program.degree}</span><h3 className="mt-4 font-serif text-3xl sm:text-4xl">{program.title}</h3></div><span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold text-white/60">{program.duration}</span></div>
    <p className="mt-4 text-xs leading-6 text-white/60">{program.description}</p>
    <p className="mt-4 text-[10px] font-bold uppercase tracking-[.1em] text-white/40">{program.destination}</p>
    <div className="mt-6 grid gap-6 border-t border-white/10 pt-6 sm:grid-cols-2">
      <div><h4 className="text-[11px] font-extrabold text-white">{c.highlightsTitle}</h4><ul className="mt-3 space-y-2.5">{program.highlights.map((item) => <li key={item} className="flex items-start gap-2 text-[11px] leading-5 text-white/60"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />{item}</li>)}</ul></div>
      <div><h4 className="text-[11px] font-extrabold text-white">{c.requirementsTitle}</h4><ul className="mt-3 space-y-2.5">{program.requirements.map((item) => <li key={item} className="flex items-start gap-2 text-[11px] leading-5 text-white/60"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-red-500" />{item}</li>)}</ul></div>
    </div>
    <div className="mt-7 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-5"><span className="flex items-center gap-2 text-[10px] text-white/60"><CalendarDays className="h-4 w-4 text-red-500" /><span><b className="block text-white/90">{c.intakeLabel}</b>{program.intake}</span></span><span className="flex items-center gap-2 text-[10px] text-white/60"><WalletCards className="h-4 w-4 text-red-500" /><span><b className="block text-white/90">{c.investmentLabel}</b>{program.investment}</span></span></div><Button variant="secondary" size="sm" onClick={() => onConsultation('student')} className="shrink-0 border-white/15 bg-white text-ink-950 hover:bg-red-50">{c.cardCta}<ArrowRight className="h-3.5 w-3.5" /></Button></div>
  </article>;
}
