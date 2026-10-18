// The only place GSAP plugins are registered (spec 8.2). Every other file imports GSAP from here.
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Flip } from 'gsap/Flip';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { duration, ease } from './motion';
import { getActiveLenis } from './scroll';

gsap.registerPlugin(
  useGSAP,
  ScrollTrigger,
  SplitText,
  Flip,
  CustomEase,
  DrawSVGPlugin,
  MorphSVGPlugin,
  ScrollToPlugin,
);

// The spec 4.5 eases are built into GSAP, so no CustomEase curves are needed yet.
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

  // Spec 8.2: refresh once web fonts have loaded (images are handled where they render).
  void document.fonts.ready.then(() => ScrollTrigger.refresh());
}

export {
  CustomEase,
  DrawSVGPlugin,
  Flip,
  gsap,
  MorphSVGPlugin,
  ScrollToPlugin,
  ScrollTrigger,
  SplitText,
  useGSAP,
};
