'use client';

import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { ArrowRight, ArrowUp, ArrowUpRight, Check, ChevronDown, LockKeyhole, Mail, MapPin, Menu, Phone, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AssessmentModal } from './assessment-modal';
import { CountryExplorer } from './country-explorer';
import { StudySection } from './study-section';
import { Testimonials } from './testimonials';
import { useLivePublicData } from './use-live-public-data';
import { Button, ButtonLink } from '@/components/ui/button';
import { MobileCarousel } from '@/components/ui/mobile-carousel';
import { Modal } from '@/components/ui/modal';
import { Reveal } from '@/components/ui/reveal';
import type { PublicData, SubmissionType } from '@/lib/types';
import { cn } from '@/lib/utils';

export function PublicSite({ data: initialData }: { data: PublicData }) {
  const data = useLivePublicData(initialData);
  const { content, countries, programs, testimonials, teamMembers, accreditations } = data;
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [assessmentType, setAssessmentType] = useState<SubmissionType | null>(null);
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null);
  const openConsultation = useCallback((type?: SubmissionType) => { setAssessmentType(type || null); setConsultationOpen(true); }, []);

  return <MotionConfig reducedMotion="user"><div className="overflow-x-clip bg-white">
    <Header content={content} onConsultation={() => openConsultation()} />
    <main>
      <Hero content={content} onConsultation={() => openConsultation()} />
      <Journey content={content} />
      <CountryExplorer countries={countries} content={content} onConsultation={openConsultation} />
      <StudySection programs={programs} content={content} onConsultation={openConsultation} />
      <TeamSection members={teamMembers} content={content} />
      <Testimonials testimonials={testimonials} content={content} />
      <Faq content={content} />
      <FinalCta content={content} onConsultation={() => openConsultation()} />
      <AccreditationsBanner items={accreditations} content={content} />
    </main>
    <Footer content={content} onLegal={setLegal} />
    <AssessmentModal open={consultationOpen} onClose={() => setConsultationOpen(false)} content={content} countries={countries} initialType={assessmentType} />
    <Modal open={Boolean(legal)} onClose={() => setLegal(null)} label={legal === 'privacy' ? content.footer.privacyLabel : content.consultation.termsTitle} className="max-w-2xl">
      <div className="p-7 sm:p-10"><img src={content.brand.logo} alt={content.brand.logoAlt} className="h-10 w-auto object-contain object-left" /><h2 className="mt-8 pr-8 font-serif text-4xl">{legal === 'privacy' ? content.footer.privacyLabel : content.consultation.termsTitle}</h2><div className="mt-6 whitespace-pre-line text-xs leading-7 text-ink-700">{legal === 'privacy' ? content.footer.privacyText : content.consultation.termsText}</div><Button variant="secondary" className="mt-8" onClick={() => setLegal(null)}>{content.forms.close}<X className="h-4 w-4" /></Button></div>
    </Modal>
  </div></MotionConfig>;
}

type Content = PublicData['content'];

function Header({ content, onConsultation }: { content: Content; onConsultation: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 16);
    scroll(); window.addEventListener('scroll', scroll, { passive: true });
    return () => window.removeEventListener('scroll', scroll);
  }, []);
  return <header className={cn('fixed inset-x-0 top-0 z-50 transition-all duration-300', scrolled ? 'border-b border-ink-900/[0.07] bg-white/85 shadow-[0_8px_30px_-24px_rgba(34,22,25,.5)] backdrop-blur-xl' : 'bg-transparent')}>
    <div className="container-site flex h-[82px] items-center justify-between gap-5">
      <a href="#" aria-label={content.brand.logoAlt} className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20"><img src={content.brand.logo} alt={content.brand.logoAlt} className="h-10 w-auto max-w-[150px] object-contain object-left sm:h-11 sm:max-w-[175px]" /></a>
      <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">{content.navigation.map((item) => <a key={item.id} href={item.href} className="rounded-md text-[12px] font-bold text-ink-700 transition hover:text-red-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20">{item.label}</a>)}</nav>
      <div className="flex items-center gap-2.5">
        <ButtonLink href="/admin" variant="ghost" size="sm" className="hidden lg:inline-flex"><LockKeyhole className="h-3.5 w-3.5" />Admin Portal</ButtonLink>
        <Button size="sm" onClick={onConsultation} className="hidden md:inline-flex">{content.hero.primaryCta}<ArrowUpRight className="h-3.5 w-3.5" /></Button>
        <button type="button" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Toggle navigation" className="icon-btn lg:hidden">{menu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
      </div>
    </div>
    <AnimatePresence>{menu && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-ink-900/10 bg-white/95 backdrop-blur-xl lg:hidden"><nav className="container-site flex flex-col gap-1 py-5">{content.navigation.map((item) => <a key={item.id} href={item.href} onClick={() => setMenu(false)} className="rounded-xl px-4 py-3 text-sm font-bold text-ink-900 hover:bg-red-50 hover:text-red-600">{item.label}</a>)}<Button className="mt-3 md:hidden" onClick={() => { setMenu(false); onConsultation(); }}>{content.hero.primaryCta}<ArrowRight className="h-4 w-4" /></Button></nav></motion.div>}</AnimatePresence>
  </header>;
}

function Hero({ content, onConsultation }: { content: Content; onConsultation: () => void }) {
  const c = content.hero;
  return <section className="relative overflow-hidden bg-red-radial pb-20 pt-32 sm:pt-36 lg:pb-24 lg:pt-[150px]">
    <div className="pointer-events-none absolute left-0 top-28 h-52 w-52 rounded-full bg-red-100/40 blur-[90px]" />
    <div className="container-site relative grid items-center gap-14 lg:grid-cols-[1.06fr_.94fr] lg:gap-16">
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: [0.22, 1, 0.36, 1] }}>
        <span className="eyebrow rounded-full border border-red-100 bg-red-50/60 px-3.5 py-2"><Sparkles className="h-3.5 w-3.5" />{c.eyebrow}</span>
        <h1 className="mt-7 max-w-3xl font-serif text-[52px] leading-[.99] tracking-[-0.035em] text-ink-950 sm:text-[70px] lg:text-[76px] xl:text-[84px]">{c.title}<br /><em className="text-red-600">{c.titleAccent}</em></h1>
        <p className="mt-6 max-w-xl text-[15px] leading-7 text-ink-700">{c.description}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button size="lg" onClick={onConsultation}>{c.primaryCta}<ArrowRight className="h-4 w-4" /></Button><ButtonLink href="#destinations" size="lg" variant="secondary">{c.secondaryCta}<ArrowUpRight className="h-4 w-4" /></ButtonLink></div>
        <p className="mt-5 flex items-start gap-2 text-[10px] font-medium leading-5 text-ink-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />{c.trustNote}</p>
        <div className="mt-9 grid grid-cols-3 gap-2.5 sm:max-w-xl sm:gap-3">{c.stats.map((stat) => <div key={stat.label} className="glass rounded-2xl px-3 py-4 sm:px-5"><p className="font-serif text-[25px] leading-none text-ink-950 sm:text-3xl">{stat.value}</p><p className="mt-2 text-[9px] font-bold leading-4 text-ink-500 sm:text-[10px]">{stat.label}</p></div>)}</div>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: .96, x: 24 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: .85, delay: .12, ease: [0.22, 1, 0.36, 1] }} className="relative mx-auto w-full max-w-[520px] lg:mx-0">
        <div className="absolute -right-6 -top-6 h-36 w-36 rounded-full border-[22px] border-red-600/10" />
        <div className="relative aspect-[4/5] overflow-hidden rounded-[30px] bg-cream shadow-lift"><img src={c.image} alt={c.imageAlt} className="h-full w-full object-cover" /><span className="absolute inset-0 bg-gradient-to-t from-ink-950/25 via-transparent to-white/5" />
          <div className="glass absolute right-4 top-4 rounded-full px-3.5 py-2 text-[8px] font-extrabold tracking-[.14em] text-ink-950 sm:right-6 sm:top-6 sm:text-[9px]">{c.imageEyebrow}</div>
          <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="glass absolute bottom-5 left-4 right-4 rounded-[22px] p-5 sm:bottom-7 sm:left-6 sm:right-6 sm:p-6"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white"><Check className="h-4 w-4" /></span><p className="mt-4 font-serif text-[23px] leading-tight text-ink-950 sm:text-[27px]">{c.imageCardTitle}</p><p className="mt-2 text-[10px] leading-5 text-ink-700 sm:text-[11px]">{c.imageCardText}</p></motion.div>
        </div>
      </motion.div>
    </div>
  </section>;
}

function Journey({ content }: { content: Content }) {
  const c = content.journey;
  return <section id="approach" className="scroll-mt-24 border-t border-ink-900/[0.07] bg-white py-24 sm:py-28"><div className="container-site">
    <Reveal className="grid gap-5 lg:grid-cols-[1fr_420px] lg:items-end"><div><span className="eyebrow">{c.eyebrow}</span><h2 className="display-title mt-5 max-w-3xl">{c.title}</h2></div><p className="text-sm leading-7 text-ink-700">{c.description}</p></Reveal>
    <div className="mt-12 grid gap-px overflow-hidden rounded-[26px] border border-ink-900/10 bg-ink-900/10 sm:grid-cols-2 lg:grid-cols-4">{c.steps.map((step, index) => <Reveal key={step.number} delay={index * .07} className="h-full"><div className="group h-full min-h-[230px] bg-white p-6 transition hover:bg-red-50/40 sm:p-7"><div className="flex items-center justify-between"><span className="font-mono text-[11px] font-bold text-red-600">{step.number}</span><span className="h-px w-10 bg-red-100 transition-all group-hover:w-16 group-hover:bg-red-600" /></div><h3 className="mt-9 font-serif text-3xl text-ink-950">{step.title}</h3><p className="mt-3 text-[11px] leading-6 text-ink-500">{step.description}</p></div></Reveal>)}</div>
  </div></section>;
}

function TeamSection({ members, content }: { members: PublicData['teamMembers']; content: Content }) {
  const c = content.teamSection;
  if (!members.length) return null;
  return <section id="team" aria-labelledby="team-heading" className="scroll-mt-24 border-t border-ink-900/[0.07] bg-[#FBFAFA] py-24 sm:py-28"><div className="container-site">
    <Reveal className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end"><div><span className="eyebrow">{c.eyebrow}</span><h2 id="team-heading" className="display-title mt-5 max-w-3xl">{c.title} <em className="text-red-600">{c.titleAccent}</em></h2></div><p className="text-sm leading-7 text-ink-700">{c.description}</p></Reveal>
    <Reveal className="mt-10 lg:hidden"><MobileCarousel
      label={`${c.title} ${c.titleAccent}`}
      itemLabels={members.map((member) => member.name)}
      itemKeys={members.map((member) => member.id)}
      items={members.map((member, index) => <TeamMemberCard key={member.id} member={member} index={index} content={c} />)}
    /></Reveal>
    <div className="mt-12 hidden gap-5 lg:grid lg:grid-cols-2 xl:grid-cols-4">{members.map((member, index) => <Reveal key={member.id} delay={index * .06} className="h-full"><TeamMemberCard member={member} index={index} content={c} /></Reveal>)}</div>
  </div></section>;
}

function TeamMemberCard({ member, index, content: c }: { member: PublicData['teamMembers'][number]; index: number; content: Content['teamSection'] }) {
  return <article className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-ink-900/[0.09] bg-white shadow-[0_16px_45px_-38px_rgba(34,22,25,.7)] transition duration-300 hover:-translate-y-1 hover:border-red-600/20 hover:shadow-lift">
    <div className="relative aspect-[4/4.35] overflow-hidden bg-cream"><img src={member.photoUrl} alt={`${member.name}, ${member.role}`} loading="lazy" className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.025]" /><span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950/25 to-transparent" /><span className="absolute bottom-4 left-4 rounded-full border border-white/40 bg-white/85 px-2.5 py-1 font-mono text-[9px] font-bold text-ink-900 backdrop-blur-md">{String(index + 1).padStart(2, '0')}</span></div>
    <div className="flex flex-1 flex-col p-5 sm:p-6"><p className="text-[9px] font-extrabold uppercase leading-4 tracking-[.12em] text-red-600">{member.role}</p><h3 className="mt-2 font-serif text-[27px] leading-tight text-ink-950">{member.name}</h3><p className="mt-3 text-[11px] leading-[1.75] text-ink-600">{member.bio}</p>
      {member.credentials.filter(Boolean).length > 0 && <div className="mt-5 flex-1 border-t border-ink-900/[0.08] pt-4"><p className="text-[8px] font-extrabold uppercase tracking-[.14em] text-ink-400">{c.credentialsLabel}</p><ul className="mt-3 space-y-2">{member.credentials.filter(Boolean).map((credential) => <li key={credential} className="flex items-start gap-2 text-[10px] font-semibold leading-4 text-ink-700"><span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"><Check className="h-2.5 w-2.5" /></span>{credential}</li>)}</ul></div>}
    </div>
  </article>;
}

function AccreditationsBanner({ items, content }: { items: PublicData['accreditations']; content: Content }) {
  const c = content.accreditationsSection;
  if (!items.length) return null;
  return <section id="accreditations" aria-labelledby="accreditations-heading" className="border-b border-ink-900/[0.08] bg-[#FBFAFA] py-16 sm:py-20"><div className="container-site">
    <Reveal className="grid gap-5 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><span className="eyebrow"><ShieldCheck className="h-3.5 w-3.5" />{c.eyebrow}</span><h2 id="accreditations-heading" className="mt-4 max-w-xl font-serif text-3xl leading-tight tracking-[-0.025em] text-ink-950 sm:text-4xl">{c.title}</h2></div><p className="max-w-xl text-xs leading-6 text-ink-600 lg:justify-self-end">{c.description}</p></Reveal>
    <div className="mt-9 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{items.map((item, index) => <Reveal key={item.id} delay={index * .05} className="h-full"><article className="flex h-full min-h-[174px] flex-col items-center justify-center rounded-2xl border border-ink-900/[0.09] bg-white px-5 py-5 text-center shadow-[0_12px_35px_-32px_rgba(34,22,25,.8)]"><img src={item.imageUrl} alt={item.title} loading="lazy" className="h-[68px] w-full max-w-[210px] object-contain" /><h3 className="mt-3 text-[11px] font-extrabold leading-4 text-ink-950">{item.title}</h3><p className="mt-1 text-[9px] font-medium leading-4 text-ink-500">{item.subtitle}</p></article></Reveal>)}</div>
  </div></section>;
}

function Faq({ content }: { content: Content }) {
  const [active, setActive] = useState(0);
  const c = content.faqSection;
  return <section className="border-t border-ink-900/[0.07] bg-cream py-24 sm:py-28"><div className="container-site grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
    <Reveal><span className="eyebrow">{c.eyebrow}</span><h2 className="display-title mt-5">{c.title}</h2><p className="mt-5 max-w-sm text-sm leading-7 text-ink-700">{c.description}</p></Reveal>
    <Reveal delay={.08} className="space-y-3">{c.items.map((item, index) => <div key={item.question} className={cn('overflow-hidden rounded-2xl border bg-white transition', active === index ? 'border-red-600/25 shadow-card' : 'border-ink-900/10')}><button type="button" onClick={() => setActive(active === index ? -1 : index)} aria-expanded={active === index} className="btn flex w-full items-center justify-between gap-5 rounded-2xl border border-transparent bg-white px-5 py-5 text-left text-[13px] font-extrabold text-ink-950 sm:px-6"><span>{item.question}</span><ChevronDown className={cn('h-4 w-4 shrink-0 text-red-600 transition-transform', active === index && 'rotate-180')} /></button><AnimatePresence initial={false}>{active === index && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><p className="px-5 pb-6 text-xs leading-6 text-ink-700 sm:px-6">{item.answer}</p></motion.div>}</AnimatePresence></div>)}</Reveal>
  </div></section>;
}

function FinalCta({ content, onConsultation }: { content: Content; onConsultation: () => void }) {
  const c = content.finalCta;
  return <section className="bg-cream pb-24 sm:pb-28"><div className="container-site"><Reveal><div className="relative overflow-hidden rounded-[30px] bg-red-600 px-6 py-14 text-center text-white shadow-[0_30px_80px_-35px_rgba(220,38,38,.6)] sm:px-12 sm:py-20"><div className="absolute -left-20 -top-32 h-80 w-80 rounded-full border-[50px] border-white/[0.07]" /><div className="absolute -bottom-44 -right-16 h-96 w-96 rounded-full border-[65px] border-white/[0.07]" /><div className="relative mx-auto max-w-3xl"><span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-red-100">{c.eyebrow}</span><h2 className="mt-5 font-serif text-4xl leading-[1.05] sm:text-6xl">{c.title}</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-red-100">{c.description}</p><Button size="lg" variant="secondary" onClick={onConsultation} className="mt-8 border-white bg-white text-red-600 hover:bg-red-50">{c.button}<ArrowRight className="h-4 w-4" /></Button><p className="mt-5 text-[10px] font-medium text-red-100">{c.note}</p></div></div></Reveal></div></section>;
}

function Footer({ content, onLegal }: { content: Content; onLegal: (legal: 'terms' | 'privacy') => void }) {
  const c = content.footer; const brand = content.brand;
  return <footer className="bg-ink-950 pb-8 pt-16 text-white sm:pt-20"><div className="container-site">
    <div className="grid gap-12 border-b border-white/10 pb-12 md:grid-cols-2 lg:grid-cols-[1.1fr_.6fr_1fr]"><div><img src={brand.logo} alt={brand.logoAlt} className="h-11 w-auto max-w-[180px] rounded-lg bg-white object-contain object-left p-1" /><p className="mt-3 text-xs font-semibold text-red-500">{brand.tagline}</p><p className="mt-5 max-w-sm text-xs leading-6 text-white/50">{c.description}</p></div>
      <div><h3 className="text-[10px] font-extrabold uppercase tracking-[.16em] text-white/40">{c.exploreTitle}</h3><div className="mt-5 flex flex-col items-start gap-3">{content.navigation.map((item) => <a key={item.id} href={item.href} className="text-xs font-semibold text-white/70 transition hover:text-red-500">{item.label}</a>)}</div></div>
      <div><h3 className="text-[10px] font-extrabold uppercase tracking-[.16em] text-white/40">{c.contactTitle}</h3><div className="mt-5 space-y-4 text-xs text-white/70"><a href={`mailto:${brand.email}`} className="flex items-start gap-3 transition hover:text-red-500"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-red-500" /><span className="break-all">{brand.email}</span></a><a href={`tel:${brand.phone.replace(/[^+\d]/g, '')}`} className="flex items-center gap-3 transition hover:text-red-500"><Phone className="h-4 w-4 shrink-0 text-red-500" />{brand.phone}</a><p className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" /><span className="leading-5">{brand.address}<br /><span className="text-white/40">{brand.officeHours}</span></span></p></div></div>
    </div>
    <div className="grid gap-5 border-b border-white/10 py-8 lg:grid-cols-[auto_1fr]"><h3 className="text-[10px] font-extrabold uppercase tracking-[.16em] text-red-500">{c.legalTitle}</h3><p className="max-w-4xl text-[10px] leading-5 text-white/40 lg:justify-self-end">{c.legalText}</p></div>
    <div className="flex flex-col gap-5 pt-7 text-[10px] text-white/40 sm:flex-row sm:items-center sm:justify-between"><p>{c.copyright}</p><div className="flex flex-wrap items-center gap-5"><button type="button" className="btn-ghost btn-sm -ml-3 text-[10px] text-white/50" onClick={() => onLegal('privacy')}>{c.privacyLabel}</button><button type="button" className="btn-ghost btn-sm -ml-3 text-[10px] text-white/50" onClick={() => onLegal('terms')}>{c.termsLabel}</button><a href="#" className="btn-ghost btn-sm text-[10px] text-white/50">{c.backToTopLabel}<ArrowUp className="h-3.5 w-3.5" /></a></div></div>
  </div></footer>;
}
