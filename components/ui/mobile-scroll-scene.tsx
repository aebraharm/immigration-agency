'use client';

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface MobileScrollSceneProps {
  children: ReactNode;
  className?: string;
  name: 'hero' | 'destinations' | 'study' | 'team' | 'stories' | 'accreditations';
}

/** Reversible, mobile-only scroll motion with no scroll or touch interception. */
export function MobileScrollScene({ children, className, name }: MobileScrollSceneProps) {
  const target = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const mobile = useMobileViewport();
  const enabled = mobile && !reducedMotion;
  const { scrollYProgress: entrance } = useScroll({ target, offset: ['start 95%', 'start 65%'] });
  const { scrollYProgress: exit } = useScroll({ target, offset: ['end 45%', 'end 5%'] });
  const smoothEntrance = useSpring(entrance, { stiffness: 220, damping: 32, mass: 0.35 });
  const smoothExit = useSpring(exit, { stiffness: 220, damping: 32, mass: 0.35 });
  const opacity = useTransform([smoothEntrance, smoothExit], ([entering, leaving]: number[]) => entering * (1 - leaving));
  const y = useTransform([smoothEntrance, smoothExit], ([entering, leaving]: number[]) => (1 - entering) * 28 - leaving * 10);
  const scale = useTransform(smoothExit, [0, 1], [1, 0.985]);

  return <motion.div
    ref={target}
    className={className}
    data-scroll-scene={name}
    data-scroll-enabled={enabled ? 'true' : 'false'}
    style={enabled ? { opacity, y, scale, transformOrigin: 'center top', willChange: 'transform, opacity' } : { opacity: 1, y: 0, scale: 1 }}
  >{children}</motion.div>;
}

function useMobileViewport() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 1023px)');
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return mobile;
}
