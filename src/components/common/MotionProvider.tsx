import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { transition } from '@/lib/motion';

/**
 * Motion at the app root (spec 2): LazyMotion with domAnimation (use `m.*`, not `motion.*`;
 * `strict` enforces it), shared default transition, and the OS reduced-motion setting.
 * Switch to domMax only if layout animations or drag are needed.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={transition.base}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
