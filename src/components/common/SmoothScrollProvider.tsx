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
      // Prioritised: Lenis scrolls before GSAP renders its tweens. The other way round, Lenis's
      // window.scrollTo() lands right after GSAP has written transforms and forces a synchronous
      // style recalc every frame (measured: ~60% of the tick while scrolling the pinned strip).
      gsap.ticker.add(raf, false, true);
      gsap.ticker.lagSmoothing(0);
      setActiveLenis(lenis);
      ScrollTrigger.refresh();

      // Keyboard focus (spec 10): while Lenis is gliding it overrides the browser's own scroll to
      // a newly focused element, which then stays off screen (Phase 9 keyboard walk, e.g. tabbing
      // out of the pinned "Best of" strip). Glide to it instead. The pinned strip moves its own
      // items sideways, so focus inside it is left to Gallery.tsx.
      const onFocusIn = (event: FocusEvent) => {
        const el = event.target;
        if (!(el instanceof HTMLElement) || el.closest('[data-pinned]')) return;
        requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          if (r.height === 0 || (r.top >= 0 && r.bottom <= window.innerHeight)) return;
          lenis.scrollTo(el, { offset: -window.innerHeight / 3, force: true });
        });
      };
      document.addEventListener('focusin', onFocusIn);

      return () => {
        document.removeEventListener('focusin', onFocusIn);
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
