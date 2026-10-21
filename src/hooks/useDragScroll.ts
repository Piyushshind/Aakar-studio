import { useEffect, type RefObject } from 'react';

const DRAG_THRESHOLD = 5; // px before a press becomes a drag (a smaller move is still a click)

/**
 * Mouse drag-to-scroll for a native horizontal scroller (the "Best of" strip, until Phase 7 pins
 * it). Touch and pen keep native scrolling; scroll-snap is paused while dragging so the strip
 * settles on the nearest photo after, and the click that ends a drag doesn't open a photo.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startX = 0;
    let startScroll = 0;
    let pressed = false;
    let dragging = false;

    const onMove = (event: PointerEvent) => {
      if (!pressed) return;
      const dx = event.clientX - startX;
      if (!dragging && Math.abs(dx) < DRAG_THRESHOLD) return;
      if (!dragging) {
        dragging = true;
        el.style.scrollSnapType = 'none';
        el.dataset.dragging = 'true';
      }
      el.scrollLeft = startScroll - dx;
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
      startX = event.clientX;
      startScroll = el.scrollLeft;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    el.addEventListener('pointerdown', onDown);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [ref]);
}
