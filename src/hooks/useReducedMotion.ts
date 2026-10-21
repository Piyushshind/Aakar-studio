import { useMediaQuery } from './useMediaQuery';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
export const MOTION_OK_QUERY = '(prefers-reduced-motion: no-preference)';
/** Desktop-class pointer: hover previews and the custom cursor (spec 8.4: none on touch). */
export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

/** True when the user asks for reduced motion (spec 8.3). Updates live. */
export function useReducedMotion() {
  return useMediaQuery(REDUCED_MOTION_QUERY);
}

/** Non-hook read for event handlers and plain functions. */
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
