// Image rules shared by the app (src/lib/photos.ts, src/lib/images.ts) and the build
// (vite.config.ts), so what the site shows and what the build emits can never disagree.
// Relative `.ts` imports only: vite.config.ts loads this file outside the app's `@` alias.
import { excludedPhotos } from '../data/curation.ts';
import type { Photo } from '../types/content.ts';

export type BlockReason = 'excluded' | 'consent';

/**
 * Why a photo must not be published, or null. Excluded photos are always blocked; photos that
 * need consent are blocked only when `enforceConsent` is on (the launch build, spec 6).
 */
export function photoBlockReason(
  photo: Pick<Photo, 'id' | 'requiresConsent' | 'consent'>,
  enforceConsent: boolean,
): BlockReason | null {
  if (photo.id in excludedPhotos) return 'excluded';
  if (enforceConsent && photo.requiresConsent && photo.consent !== true) return 'consent';
  return null;
}

const PHOTO_WIDTHS = [480, 768, 1200, 1920, 2560];
const ALBUM_WIDTHS = [...PHOTO_WIDTHS, 3840];
const XL_WIDTHS = [...PHOTO_WIDTHS, 3200, 4000];

/** `pnpm dev` only: two widths, so the first dev load encodes a few hundred files fewer. */
const DEV_WIDTHS = [768, 1920];

/**
 * Responsive widths for a master (spec 7.2): photos up to 2560, album pages and covers up to
 * 3840, `-xl` masters up to 4000. Widths above the master's own width are dropped (never
 * upscaled); the master width itself is added when it is meaningfully larger than the last step.
 * In dev: 768 and 1920 only, plus the master width when it is smaller than 1920.
 */
export function responsiveWidths(srcPath: string, masterWidth: number, { dev = false } = {}) {
  const steps = dev
    ? DEV_WIDTHS
    : /-xl\.webp$/.test(srcPath)
      ? XL_WIDTHS
      : /\/albums\//.test(srcPath)
        ? ALBUM_WIDTHS
        : PHOTO_WIDTHS;
  const widths = steps.filter((w) => w <= masterWidth);
  const top = widths.at(-1) ?? 0;
  if (dev ? masterWidth < 1920 && masterWidth > top : masterWidth > top * 1.1) {
    widths.push(masterWidth);
  }
  return widths.length > 0 ? widths : [masterWidth];
}

/** Output formats, best first. Dev: WebP only (AVIF encoding is the slow part). */
export function responsiveFormats({ dev = false } = {}) {
  return dev ? ['webp'] : ['avif', 'webp'];
}

/**
 * AVIF encoder settings for production builds. Measured on 6 masters (2026-10-21) against
 * sharp's default (effort 4, quality 50): 27% of the encode time, 9% larger files, same PSNR
 * (36.57 vs 36.50 dB). WebP keeps sharp's defaults.
 */
export const AVIF_SETTINGS = { effort: 3, quality: 53 };

/** Width of the inline blur placeholder (spec 7.2, step 5). */
export const PLACEHOLDER_WIDTH = 20;
