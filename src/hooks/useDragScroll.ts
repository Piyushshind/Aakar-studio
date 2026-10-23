import { useEffect, type RefObject } from 'react';
import type { ScrollTrigger } from '@/lib/gsap';
import { getActiveLenis } from '@/lib/scroll';

const DRAG_THRESHOLD = 5; // px before a press becomes a drag (a smaller move is still a click)

/**
 * Mouse drag-to-scroll for the "Best of" strip. Touch and pen keep native scrolling.
 * - Native row (mobile, reduced motion): drags the row's scrollLeft; scroll-snap pauses while
 *   dragging so the row settles on the nearest photo after.
 * - Pinned strip (desktop, `pin` set): drags the page through the pin instead, `scrollPerPx`
 *   page pixels per pixel of rail travel, so the rail follows the pointer one-to-one.
 * The click that ends a drag never opens a photo.
 */
export function useDragScroll(
  ref: RefObject<HTMLElement | null>,
  pin?: RefObject<ScrollTrigger | null>,
  scrollPerPx = 1,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startX = 0;
    let startScroll = 0;
    let pressed = false;
    let dragging = false;
    let pinnedDrag = false;

    const onMove = (event: PointerEvent) => {
      if (!pressed) return;
      const dx = event.clientX - startX;
      if (!dragging && Math.abs(dx) < DRAG_THRESHOLD) return;
      if (!dragging) {
        dragging = true;
        el.style.scrollSnapType = 'none';
        el.dataset.dragging = 'true';
      }
      if (pinnedDrag) {
        const st = pin?.current;
        const target = startScroll - dx * scrollPerPx;
        const y = st ? Math.min(st.end, Math.max(st.start, target)) : target;
        const lenis = getActiveLenis();
        if (lenis) lenis.scrollTo(y, { immediate: true });
        else window.scrollTo(0, y);
      } else {
        el.scrollLeft = startScroll - dx;
      }
    };
    const onUp = () => {
      pressed = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (!dragging) return;
      el.style.scrollSnapType = '';
      delete el.dataset.dragging;
      // Swallow the click that ends the drag.
      const block = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
      };
      el.addEventListener('click', block, { capture: true, once: true });
      window.setTimeout(() => el.removeEventListener('click', block, { capture: true }), 0);
      dragging = false;
    };
    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      event.preventDefault(); // no native image drag or text selection
      pressed = true;
      pinnedDrag = Boolean(pin?.current);
      startX = event.clientX;
      startScroll = pinnedDrag ? window.scrollY : el.scrollLeft;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    el.addEventListener('pointerdown', onDown);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [ref, pin, scrollPerPx]);
}
