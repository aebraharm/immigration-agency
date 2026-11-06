'use client';

import { MoveHorizontal } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileCarouselProps {
  items: ReactNode[];
  itemLabels: string[];
  itemKeys: string[];
  label: string;
  className?: string;
  tone?: 'light' | 'dark';
}

/** Native, touch-first carousel used below the Tailwind lg (1024px) breakpoint. */
export function MobileCarousel({ items, itemLabels, itemKeys, label, className, tone = 'light' }: MobileCarouselProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const multiple = items.length > 1;

  const updateActive = useCallback(() => {
    const root = viewport.current;
    if (!root || !root.offsetParent) return;
    const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-carousel-slide]'));
    if (!slides.length) return;
    const rootLeft = root.getBoundingClientRect().left;
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;
    slides.forEach((slide, index) => {
      const current = Math.abs(slide.getBoundingClientRect().left - rootLeft);
      if (current < distance) { distance = current; nearest = index; }
    });
    setActive(nearest);
  }, []);

  const onScroll = useCallback(() => {
    if (frame.current !== null) return;
    frame.current = window.requestAnimationFrame(() => {
      frame.current = null;
      updateActive();
    });
  }, [updateActive]);

  useEffect(() => {
    setActive((current) => Math.min(current, Math.max(0, items.length - 1)));
    updateActive();
  }, [items.length, updateActive]);

  useEffect(() => {
    const root = viewport.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateActive);
    observer.observe(root);
    return () => observer.disconnect();
  }, [updateActive]);

  useEffect(() => () => {
    if (frame.current !== null) window.cancelAnimationFrame(frame.current);
  }, []);

  const goTo = useCallback((index: number, smooth = true) => {
    const root = viewport.current;
    const slide = root?.querySelectorAll<HTMLElement>('[data-carousel-slide]')[index];
    if (!root || !slide) return;
    const left = root.scrollLeft + slide.getBoundingClientRect().left - root.getBoundingClientRect().left;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.scrollTo({ left, behavior: smooth && !reducedMotion ? 'smooth' : 'auto' });
    setActive(index);
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!multiple) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      goTo(Math.max(0, Math.min(items.length - 1, active + direction)));
    }
    if (event.key === 'Home') { event.preventDefault(); goTo(0); }
    if (event.key === 'End') { event.preventDefault(); goTo(items.length - 1); }
  }

  if (!items.length) return null;
  // Native direction detection needs both pan axes on the viewport and every
  // slide: vertical gestures scroll the page; deliberate horizontal drags scroll cards.
  return <div className={cn('lg:hidden', className)}>
    <div
      ref={viewport}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onScroll={onScroll}
      onKeyDown={onKeyDown}
      className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 rounded-[24px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20 [-webkit-overflow-scrolling:touch] [touch-action:pan-x_pan-y_pinch-zoom]"
    >
      {items.map((item, index) => <div
        key={itemKeys[index] || index}
        data-carousel-slide
        role="group"
        aria-roledescription="slide"
        aria-label={`${index + 1} / ${items.length}`}
        className={cn('shrink-0 grow-0 snap-start [touch-action:pan-x_pan-y_pinch-zoom]', multiple ? 'basis-[86%] sm:basis-[47%] md:basis-[42%]' : 'basis-full')}
      >{item}</div>)}
      {multiple && <div aria-hidden="true" className="shrink-0 grow-0 pointer-events-none basis-[calc(14%_-_1rem)] sm:basis-[calc(53%_-_1rem)] md:basis-[calc(58%_-_1rem)]" />}
    </div>
    {multiple && <div className="mt-4 flex items-center justify-center" role="group" aria-label={`${label} navigation`}>
      <span aria-hidden="true" className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600"><MoveHorizontal className="h-4 w-4" /></span>
      {itemLabels.map((itemLabel, index) => <button
        key={itemKeys[index] || index}
        type="button"
        aria-label={`${label}: ${itemLabel}`}
        aria-current={active === index ? 'true' : undefined}
        onClick={() => goTo(index)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20"
      ><span className={cn('block h-1.5 rounded-full transition-all duration-300', active === index ? 'w-6 bg-red-600' : cn('w-1.5 hover:bg-red-400', tone === 'dark' ? 'bg-white/30' : 'bg-ink-900/25'))} /></button>)}
      <span aria-hidden="true" className={cn('ml-2 min-w-10 font-mono text-[9px] font-bold tracking-wider', tone === 'dark' ? 'text-white/40' : 'text-ink-400')}>{String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
    </div>}
  </div>;
}
