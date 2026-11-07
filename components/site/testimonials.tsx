'use client';

import { BadgeCheck, Play, Quote, Star } from 'lucide-react';
import { MobileCarousel } from '@/components/ui/mobile-carousel';
import { MobileScrollScene } from '@/components/ui/mobile-scroll-scene';
import { Reveal } from '@/components/ui/reveal';
import type { SiteContent, Testimonial } from '@/lib/types';

type TestimonialContent = SiteContent['testimonialsSection'];

export function Testimonials({ testimonials, content }: { testimonials: Testimonial[]; content: SiteContent }) {
  const c = content.testimonialsSection;
  const label = `${c.title} ${c.titleAccent}`;
  return <section id="stories" className="scroll-mt-24 bg-white py-24 sm:py-28 lg:py-32">
    <MobileScrollScene name="stories" className="container-site">
      <Reveal className="mx-auto max-w-3xl text-center"><span className="eyebrow"><BadgeCheck className="h-4 w-4" />{c.eyebrow}</span><h2 className="display-title mt-5">{c.title} <em className="text-red-600">{c.titleAccent}</em></h2><p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-ink-700">{c.description}</p></Reveal>
      <Reveal className="mt-10 lg:hidden"><MobileCarousel
        label={label}
        itemLabels={testimonials.map((testimonial) => testimonial.name)}
        itemKeys={testimonials.map((testimonial) => testimonial.id)}
        items={testimonials.map((testimonial) => <TestimonialCard key={testimonial.id} testimonial={testimonial} content={c} />)}
      /></Reveal>
      <div className="mt-12 hidden gap-5 lg:grid lg:grid-cols-3">
        {testimonials.map((testimonial, index) => <Reveal key={testimonial.id} delay={index * 0.08}>
          <TestimonialCard testimonial={testimonial} content={c} />
        </Reveal>)}
      </div>
    </MobileScrollScene>
  </section>;
}

function TestimonialCard({ testimonial, content: c }: { testimonial: Testimonial; content: TestimonialContent }) {
  return <article className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-ink-900/10 bg-white shadow-card transition duration-300 hover:-translate-y-1.5 hover:shadow-lift">
    <div className="relative aspect-[1.45] overflow-hidden bg-ink-950">
      {testimonial.mediaType === 'video' && testimonial.mediaUrl ? <video src={testimonial.mediaUrl} poster={testimonial.posterUrl || undefined} controls playsInline preload="metadata" className="h-full w-full object-cover" aria-label={`${c.videoLabel}: ${testimonial.name}`} /> : testimonial.mediaUrl ? <img src={testimonial.mediaUrl} alt={testimonial.name} loading="lazy" className="h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.035]" /> : <div className="flex h-full items-center justify-center bg-red-50 font-serif text-6xl text-red-600">{testimonial.name.charAt(0)}</div>}
      {testimonial.mediaType === 'video' && <span className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-ink-950/70 px-3 py-1.5 text-[9px] font-bold text-white backdrop-blur-lg"><Play className="h-3 w-3 fill-current" />{c.videoLabel}</span>}
      <span className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-white/80 px-3 py-1.5 text-[9px] font-bold text-ink-900 backdrop-blur-xl">{testimonial.location}</span>
    </div>
    <div className="flex flex-1 flex-col p-6">
      <div className="flex items-center justify-between"><div className="flex gap-0.5" aria-label={`${testimonial.rating} ${c.ratingLabel}`}>{Array.from({ length: testimonial.rating }).map((_, star) => <Star key={star} className="h-3.5 w-3.5 fill-red-600 text-red-600" />)}</div><Quote className="h-7 w-7 fill-red-50 text-red-100" /></div>
      <blockquote className="mt-5 flex-1 font-serif text-[22px] leading-[1.4] text-ink-900">“{testimonial.quote}”</blockquote>
      <div className="mt-6 border-t border-ink-900/10 pt-5"><p className="text-sm font-extrabold text-ink-950">{testimonial.name}</p><p className="mt-1 text-[10px] leading-4 text-ink-500">{testimonial.role}</p><p className="mt-3 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-red-600"><BadgeCheck className="h-3.5 w-3.5" />{c.verifiedLabel}</p></div>
    </div>
  </article>;
}
