'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean; onClose: () => void; children: ReactNode; label: string;
  className?: string; hideClose?: boolean; closeLabel?: string;
}

export function Modal({ open, onClose, children, label, className, hideClose, closeLabel = 'Close dialog' }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => panel.current?.focus(), 50);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab' && panel.current) {
        const focusable = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'));
        if (!focusable.length) return;
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      clearTimeout(timer); document.body.style.overflow = oldOverflow;
      document.removeEventListener('keydown', keydown); previous?.focus();
    };
  }, [open, onClose]);

  return <AnimatePresence>
    {open && <motion.div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div aria-hidden="true" className="absolute inset-0 h-full w-full bg-ink-950/60 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div
        ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label}
        className={cn('fine-scrollbar relative z-10 max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-t-[28px] border border-white/50 bg-white shadow-2xl outline-none sm:rounded-[28px]', className)}
        initial={{ opacity: 0, y: 40, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      >
        {!hideClose && <button onClick={onClose} aria-label={closeLabel} className="icon-btn absolute right-4 top-4 z-20 bg-white/80 backdrop-blur-md"><X className="h-4 w-4" /></button>}
        {children}
      </motion.div>
    </motion.div>}
  </AnimatePresence>;
}
