import type { Transition } from 'motion/react';

// Motion tokens (spec 4.5). GSAP uses `ease`/`duration`/`stagger` directly; Motion
// (motion/react) uses the matching `bezier` curves and `transition` presets so both feel the same.

export const ease = { out: 'power3.out', inOut: 'power2.inOut', expo: 'expo.out' } as const;
export const duration = { fast: 0.3, base: 0.6, slow: 1.2 } as const;
export const stagger = { tight: 0.04, base: 0.08, loose: 0.15 } as const;

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
