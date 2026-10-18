import type { LenisOptions } from 'lenis';
import 'lenis/dist/lenis.css';
import { ReactLenis, useLenis } from 'lenis/react';
import type { ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { setActiveLenis } from '@/lib/scroll';

// Stable reference: ReactLenis recreates its instance when the serialised options change.
const LENIS_OPTIONS: LenisOptions = { autoRaf: false, lerp: 0.1 };

/**
 * One root Lenis instance synced with ScrollTrigger (spec 8.2); native scroll with reduced
 * motion (spec 8.3). Lenis is rendered next to the children, not around them, so toggling
 * reduced motion never remounts the page; useLenis() reaches it through lenis/react's root store.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();

  return (
    <>
      {!reducedMotion && (
        <ReactLenis root options={LENIS_OPTIONS}>
          <LenisScrollTriggerSync />
        </ReactLenis>
      )}
      {children}
    </>
  );
}

function LenisScrollTriggerSync() {
  const lenis = useLenis();

  useGSAP(
    () => {
      if (!lenis) return;
      const raf = (time: number) => lenis.raf(time * 1000);
      const offScroll = lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      setActiveLenis(lenis);
      ScrollTrigger.refresh();

      return () => {
        gsap.ticker.remove(raf);
        gsap.ticker.lagSmoothing(500, 33); // GSAP default, for native scroll
        offScroll();
        setActiveLenis(null);
        // Lenis 1.3.26 bug: destroy() leaves the native-scroll velocity reset timer running, and
        // ~400 ms later it re-adds the `lenis` class to <html>. Clear it (safe before or after destroy).
        clearTimeout(
          (lenis as unknown as { _resetVelocityTimeout?: number })._resetVelocityTimeout,
        );
      };
    },
    // revertOnUpdate: a new instance (StrictMode remount) must clean up the previous one.
    { dependencies: [lenis], revertOnUpdate: true },
  );

  return null;
}
