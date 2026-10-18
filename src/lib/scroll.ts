import type Lenis from 'lenis';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';

// The fixed-header offset lives in ONE place: `--header-offset` in src/styles/index.css, applied
// as `scroll-padding-top` on <html>. Native #anchor jumps use it directly; scrollToSection()
// reads it back from the computed style.

let activeLenis: Lenis | null = null;

/** Called by SmoothScrollProvider only. */
export function setActiveLenis(lenis: Lenis | null) {
  if (import.meta.env.DEV && lenis && activeLenis && activeLenis !== lenis) {
    console.warn('SmoothScrollProvider: a second Lenis instance was registered');
  }
  activeLenis = lenis;
}

export function getActiveLenis() {
  return activeLenis;
}

/** Document Y of an element's layout box, ignoring transforms (e.g. a pending reveal's `y`). */
function layoutTop(el: HTMLElement) {
  let y = 0;
  for (let node: HTMLElement | null = el; node; node = node.offsetParent as HTMLElement | null) {
    y += node.offsetTop;
  }
  return y;
}

const px = (value: string) => Number.parseFloat(value) || 0;

/**
 * Smoothly scroll to `#id` below the fixed header, with or without Lenis, then move keyboard
 * focus there without a second jump. Returns false when the element doesn't exist.
 */
export function scrollToSection(id: string, { focus = true } = {}) {
  const target = document.getElementById(id);
  if (!target) {
    if (import.meta.env.DEV) console.warn(`scrollToSection: no element with id "${id}"`);
    return false;
  }

  const top =
    layoutTop(target) -
    px(getComputedStyle(document.documentElement).scrollPaddingTop) -
    px(getComputedStyle(target).scrollMarginTop);

  if (activeLenis) {
    activeLenis.scrollTo(top);
  } else {
    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  if (focus) {
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  return true;
}
