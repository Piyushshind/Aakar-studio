import { LazyMotion, MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { transition } from '@/lib/motion';

// Loaded on demand (Phase 10): the features are most of Motion's weight, and nothing animates
// with Motion before the visitor interacts (menu, filters, FAQ, form), so they leave the main
// bundle. `m` components render normally until they arrive.
const loadFeatures = () => import('./motionFeatures').then((mod) => mod.default);

/**
 * Motion at the app root (spec 2): LazyMotion (use `m.*`, not `motion.*`; `strict` enforces it),
 * shared default transition, and the OS reduced-motion setting. domMax rather than domAnimation:
 * the gallery filters use layout animations (Phase 8).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={transition.base}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
