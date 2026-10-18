import { useMediaQuery } from './useMediaQuery';

/** True when the primary input can't hover or is coarse (no custom cursor, spec 8.4). */
export function useIsTouch() {
  return useMediaQuery('(hover: none), (pointer: coarse)');
}
