import type { RefObject } from 'react';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';
import { duration, ease, stagger } from '@/lib/motion';
import { MOTION_OK_QUERY } from './useReducedMotion';

/**
 * Kinetic section title (spec 3): SplitText lines slide up inside masks, once, the first time
 * the title scrolls into view. SplitText puts the full text in aria-label and hides the line
 * wrappers from screen readers (spec 10). Reduced motion: never split, plain text.
 *
 * autoSplit re-splits when the width or fonts change; after the title has played, a re-split
 * just leaves the new lines in place instead of animating again.
 */
export function useKineticTitle(ref: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      let played = false;
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK_QUERY, () => {
        const split = SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'kinetic-line',
          autoSplit: true,
          onSplit: (self) => {
            if (played) return;
            return gsap.from(self.lines, {
              yPercent: 110,
              duration: duration.slow,
              ease: ease.expo,
              stagger: stagger.base,
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
              onComplete: () => {
                played = true;
              },
            });
          },
        });
        return () => split.revert();
      });

      return () => mm.revert();
    },
    { scope: ref },
  );
}
