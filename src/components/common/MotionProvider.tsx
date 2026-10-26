import { domMax, LazyMotion, MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { transition } from '@/lib/motion';

/**
 * Motion at the app root (spec 2): LazyMotion (use `m.*`, not `motion.*`; `strict` enforces it),
 * shared default transition, and the OS reduced-motion setting. domMax rather than domAnimation:
 * the gallery filters use layout animations (Phase 8).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" transition={transition.base}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
