// The only place GSAP plugins are registered (spec 8.2). Every other file imports GSAP from here.
// Only the plugins the site uses (Phase 10): Flip, MorphSVG, CustomEase and ScrollTo were
// registered but unused (the album viewer measures its own FLIP), and every plugin ships in the
// main bundle. Import and register one here again if it's ever needed.
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { duration, ease } from './motion';
import { getActiveLenis } from './scroll';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, DrawSVGPlugin);

// The spec 4.5 eases are built into GSAP, so no CustomEase curves are needed.
gsap.defaults({ ease: ease.out, duration: duration.base });

// Mobile address-bar show/hide shouldn't trigger a full refresh.
ScrollTrigger.config({ ignoreMobileResize: true });

if (typeof document !== 'undefined') {
  // Workaround (GSAP 3.15): when a gsap.matchMedia() condition flips (reduced motion,
  // desktop/mobile breakpoint), ScrollTrigger loses the scroll position it recorded, because
  // killing or creating triggers mid-flip zeroes it, and the page jumps to the top. A flip always
  // fires 'revert' first (scroll still intact) and 'matchMedia' after its refresh.
  let scrollBeforeFlip: number | null = null;
  ScrollTrigger.addEventListener('revert', () => {
    scrollBeforeFlip = window.scrollY;
  });
  ScrollTrigger.addEventListener('matchMedia', () => {
    const y = scrollBeforeFlip;
    scrollBeforeFlip = null;
    if (y === null || Math.abs(window.scrollY - y) <= 1) return;
    const lenis = getActiveLenis();
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  });

  // Spec 8.2: refresh once web fonts have loaded. Images have fixed aspect ratios, but content
  // can still change height (gallery "View more", FAQ answers, the map), so any change in the
  // page height re-measures every trigger, debounced.
  void document.fonts.ready.then(() => ScrollTrigger.refresh());
  let refreshTimer = 0;
  let lastHeight = 0;
  new ResizeObserver(([entry]) => {
    const height = Math.round(entry.contentRect.height);
    if (height === lastHeight) return;
    lastHeight = height;
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
  }).observe(document.body);

  // Dev only: lets headless checks count triggers (StrictMode duplicates would show up).
  if (import.meta.env.DEV) Object.assign(window, { __gsap: gsap, __ScrollTrigger: ScrollTrigger });
}

export { DrawSVGPlugin, gsap, ScrollTrigger, SplitText, useGSAP };
