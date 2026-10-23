import type { Transition } from 'motion/react';

// Motion tokens (spec 4.5). GSAP uses `ease`/`duration`/`stagger` directly; Motion
// (motion/react) uses the matching `bezier` curves and `transition` presets so both feel the same.

export const ease = { out: 'power3.out', inOut: 'power2.inOut', expo: 'expo.out' } as const;
export const duration = { fast: 0.3, base: 0.6, slow: 1.2 } as const;
export const stagger = { tight: 0.04, base: 0.08, loose: 0.15 } as const;

/**
 * Scroll and loop tokens (Phase 6). CSS reads the same values as custom properties in
 * src/styles/index.css (`--reveal-*`, `--duration-*`); main.tsx warns in dev if they drift.
 */
export const reveal = {
  /** Slide distance for text and cards. */
  y: { desktop: 28, mobile: 16 },
  /** Scroll distance over which a scroll-driven reveal plays, and the extra per stagger step. */
  range: '24vh',
  step: '3vh',
  /** Photo reveal: the image settles from this scale while the clip-path wipe opens. */
  photoScale: 1.08,
} as const;

export const loop = {
  /** Seconds each hero photo stays before the next crossfade. */
  heroSlide: 6,
  /** Seconds for one marquee cycle at base speed. */
  marquee: 38,
  /** Max marquee speed multiplier from scroll velocity. */
  marqueeBoost: 5,
} as const;

/** Logo preloader (spec 5 item 1): finishes once the hero image is loaded and `min` has passed,
 * and opens by `max` whatever happens. */
export const preloader = {
  min: 1.1,
  max: 1.4,
  /** Seconds after navigation: if the app mounts later than this, skip the preloader rather
   * than covering a page that's already been waiting. */
  lateMount: 2,
} as const;

/** Parallax travel in px (desktop only, spec 5 items 7 and 13). */
export const parallax = { soft: 24, strong: 48 } as const;

/** Cubic-bezier equivalents of the GSAP eases above (power3 = quart, power2 = cubic). */
export const bezier = {
  out: [0.165, 0.84, 0.44, 1],
  inOut: [0.645, 0.045, 0.355, 1],
  expo: [0.19, 1, 0.22, 1],
} as const satisfies Record<keyof typeof ease, readonly [number, number, number, number]>;

/** Motion transition presets. `MotionConfig` uses `transition.base` as the default. */
export const transition = {
  fast: { duration: duration.fast, ease: bezier.out },
  base: { duration: duration.base, ease: bezier.out },
  slow: { duration: duration.slow, ease: bezier.expo },
  inOut: { duration: duration.base, ease: bezier.inOut },
} as const satisfies Record<string, Transition>;

/** Dev check: the CSS custom properties in index.css must mirror these tokens. */
export function checkCssMotionTokens() {
  const css = getComputedStyle(document.documentElement);
  const ms = (s: number) => `${Math.round(s * 1000)}ms`;
  const wide = window.matchMedia('(min-width: 768px)').matches;
  const expected: Record<string, string> = {
    '--duration-fast': ms(duration.fast),
    '--duration-base': ms(duration.base),
    '--duration-slow': ms(duration.slow),
    '--stagger-base': ms(stagger.base),
    '--reveal-y': `${wide ? reveal.y.desktop : reveal.y.mobile}px`,
    '--reveal-range': reveal.range,
    '--reveal-step': reveal.step,
    '--reveal-photo-scale': String(reveal.photoScale),
    '--parallax-soft': `${parallax.soft}px`,
    '--parallax-strong': `${parallax.strong}px`,
    '--ease-out': `cubic-bezier(${bezier.out.join(', ')})`,
    '--ease-in-out': `cubic-bezier(${bezier.inOut.join(', ')})`,
    '--ease-expo': `cubic-bezier(${bezier.expo.join(', ')})`,
  };
  for (const [name, value] of Object.entries(expected)) {
    const actual = css.getPropertyValue(name).trim();
    if (actual !== value)
      console.warn(`Motion token drift: ${name} is "${actual}", motion.ts says "${value}"`);
  }
}
