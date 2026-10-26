import { useRef } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { FINE_POINTER_QUERY, useReducedMotion } from '@/hooks/useReducedMotion';
import { gsap, useGSAP } from '@/lib/gsap';
import { duration, ease } from '@/lib/motion';

/** `data-cursor` values and their labels (gallery photos, album cards, Best of, service rows,
 * the album flip-book's halves). */
const LABELS: Record<string, string> = {
  view: 'View',
  drag: 'Drag',
  enquire: 'Enquire',
  prev: 'Back',
  next: 'Next',
};

/** Native cursor here (precision matters), so the custom one hides. Matches animations.css. */
const NATIVE = 'input, textarea, select, iframe, [contenteditable]';
const INTERACTIVE = 'a[href], button, summary, label, [role="button"]';

type Mode = 'default' | 'link' | 'label' | 'hidden';

/**
 * Custom cursor (spec 5, global extras; 8.4): a gold dot that tracks the pointer exactly and a
 * lagging ring. Over [data-cursor] targets the ring becomes a gold disc with a label; over links
 * and buttons it grows a little. Fine pointers only, never with reduced motion, hidden over form
 * fields and while navigating by keyboard (so it never sits on a focus outline).
 */
export function CustomCursor() {
  // Desktop-sized screens only, as well as a fine pointer: DevTools' device mode (and some
  // tablets with a mouse) can report a fine pointer on a phone-sized screen.
  const finePointer = useMediaQuery(`${FINE_POINTER_QUERY} and (min-width: 1024px)`);
  const reducedMotion = useReducedMotion();
  return finePointer && !reducedMotion ? <Cursor /> : null;
}

function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const [dot] = q('.cursor-dot');
      const [follower] = q('.cursor-follower');
      const [ring] = q('.cursor-ring');
      const [disc] = q('.cursor-disc');
      const html = document.documentElement;
      html.classList.add('has-custom-cursor');

      gsap.set([dot, follower], { xPercent: -50, yPercent: -50 });
      gsap.set(root.current, { autoAlpha: 0 });
      gsap.set(disc, { scale: 0 });
      const followX = gsap.quickTo(follower, 'x', { duration: duration.fast, ease: ease.out });
      const followY = gsap.quickTo(follower, 'y', { duration: duration.fast, ease: ease.out });

      let mode: Mode | null = null;
      let shown = false;
      const show = (on: boolean) => {
        if (on === shown) return;
        shown = on;
        gsap.to(root.current, {
          autoAlpha: on ? 1 : 0,
          duration: duration.fast,
          overwrite: 'auto',
        });
      };
      const setMode = (next: Mode, text = '') => {
        if (next === mode && (next !== 'label' || label.current?.textContent === text)) return;
        mode = next;
        if (label.current) label.current.textContent = text;
        const t = { duration: duration.fast, ease: ease.out, overwrite: 'auto' as const };
        gsap.to(disc, { scale: next === 'label' ? 1 : 0, ...t });
        gsap.to(ring, {
          scale: next === 'link' ? 1.6 : 1,
          autoAlpha: next === 'label' ? 0 : 1,
          ...t,
        });
        gsap.to(dot, { autoAlpha: next === 'label' ? 0 : 1, ...t });
      };

      const modeFor = (target: EventTarget | null): [Mode, string?] => {
        const el = target instanceof Element ? target : null;
        if (!el || el.closest(NATIVE)) return ['hidden'];
        // The nearest labelled area wins (a whole album card or service row is clickable).
        const labelled = el.closest<HTMLElement>('[data-cursor]');
        if (labelled) return ['label', LABELS[labelled.dataset.cursor ?? ''] ?? ''];
        return el.closest(INTERACTIVE) ? ['link'] : ['default'];
      };

      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return;
        gsap.set(dot, { x: event.clientX, y: event.clientY });
        followX(event.clientX);
        followY(event.clientY);
        const [next, text] = modeFor(event.target);
        show(next !== 'hidden');
        if (next !== 'hidden') setMode(next, text);
      };
      const onLeave = () => show(false);
      // Keyboard navigation: get out of the way of focus outlines until the mouse moves again.
      const onKey = (event: KeyboardEvent) => {
        if (event.key === 'Tab' || event.key.startsWith('Arrow')) show(false);
      };

      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
      window.addEventListener('keydown', onKey);
      return () => {
        html.classList.remove('has-custom-cursor');
        window.removeEventListener('pointermove', onMove);
        document.documentElement.removeEventListener('pointerleave', onLeave);
        window.removeEventListener('keydown', onKey);
      };
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="custom-cursor pointer-events-none invisible fixed inset-0 z-[100] opacity-0"
    >
      <div className="cursor-follower absolute top-0 left-0">
        <div className="cursor-ring size-9 rounded-full border border-gold/70" />
        <div className="cursor-disc absolute top-1/2 left-1/2 flex size-22 -translate-1/2 items-center justify-center rounded-full bg-gold/90 text-bg">
          <span ref={label} className="eyebrow text-[0.62rem] tracking-[0.24em]" />
        </div>
      </div>
      <div className="cursor-dot absolute top-0 left-0 size-1.5 rounded-full bg-gold" />
    </div>
  );
}
