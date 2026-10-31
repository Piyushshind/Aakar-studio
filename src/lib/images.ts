// Responsive image sources for manifest photos (spec 7.2, stage 2).
//
// Every master in src/assets/photos/ is imported through vite-imagetools: `?responsive` gives AVIF
// and WebP srcsets (widths from src/lib/imagePolicy.ts, never upscaled) and `?placeholder` a tiny
// inline WebP for the blur-up. A photo whose file is missing (e.g. a fresh clone without the
// masters) resolves to `undefined` (ResponsiveImage shows a neutral placeholder). Blocked photos (excluded, or no consent in the launch build) resolve to
// `undefined` too, via the photo gate in vite.config.ts, and are never emitted.
import type { Picture } from 'vite-imagetools';
import manifest from '@/data/photos.manifest.json';
import type { Photo } from '@/types/content';

// Glob patterns must be literals. _review is never imported (CLAUDE.md).
const pictures = import.meta.glob<Picture | undefined>(
  ['/src/assets/photos/**/*.webp', '!/src/assets/photos/_review/**'],
  { query: '?responsive', import: 'default', eager: true },
);
const placeholders = import.meta.glob<string | undefined>(
  ['/src/assets/photos/**/*.webp', '!/src/assets/photos/_review/**', '!**/*-xl.webp'],
  { query: '?placeholder', import: 'default', eager: true },
);

const globKey = (src: string) => `/${src}`;

export interface PhotoSources {
  /** srcset strings per format; the browser picks the first type it supports. */
  avif?: string;
  webp?: string;
  /** Largest WebP, for the <img> fallback. */
  src: string;
  /** Generated widths (both formats share them). */
  widths: number[];
  /** Inline data URI of a ~20px WebP, for the blur-up. */
  placeholder?: string;
}

const widthsOf = (srcset = '') => [...srcset.matchAll(/\s(\d+)w/g)].map((m) => Number(m[1]));

/** Built sources for a photo (or its `-xl` master), or undefined when the file isn't available. */
export function getPhotoSources(photo: Photo, { xl = false } = {}): PhotoSources | undefined {
  const pic = pictures[globKey(xl && photo.xlSrc ? photo.xlSrc : photo.src)];
  if (!pic) return undefined;
  return {
    avif: pic.sources.avif,
    webp: pic.sources.webp,
    src: pic.img.src,
    widths: widthsOf(pic.sources.webp ?? pic.sources.avif),
    placeholder: placeholders[globKey(photo.src)],
  };
}

/**
 * The WebP widths as {src, width, height} entries (the lightbox's `srcSet` format; WebP because a
 * plain <img> has no format fallback). Height follows the photo's own ratio.
 */
export function getPhotoSrcSet(photo: Photo) {
  const srcset = getPhotoSources(photo)?.webp;
  if (!srcset) return [];
  return [...srcset.matchAll(/(\S+)\s(\d+)w/g)].map(([, src, w]) => {
    const width = Number(w);
    return { src, width, height: Math.round((width * photo.height) / photo.width) };
  });
}

/** URL of the largest built WebP, e.g. for meta tags. */
export function resolvePhotoUrl(photo: Photo): string | undefined {
  return getPhotoSources(photo)?.src;
}

export interface PreloadLink {
  rel: 'preload';
  as: 'image';
  type: string;
  imageSrcSet: string;
  imageSizes: string;
  fetchPriority: 'high';
}

/**
 * <link rel="preload"> descriptors for an above-the-fold photo (hero, Phase 5/9). One link, for
 * the best format: browsers skip preloads whose `type` they don't support. Use the same `sizes`
 * as the ResponsiveImage, or the browser downloads a different width twice.
 */
export function getPreloadLinks(photo: Photo, sizes: string): PreloadLink[] {
  const s = getPhotoSources(photo);
  if (!s) return [];
  const [type, srcset] = s.avif ? ['image/avif', s.avif] : ['image/webp', s.webp ?? s.src];
  return [
    {
      rel: 'preload',
      as: 'image',
      type,
      imageSrcSet: srcset,
      imageSizes: sizes,
      fetchPriority: 'high',
    },
  ];
}

// Dev only: report manifest entries without a file and files without a manifest entry, once.
if (import.meta.env.DEV) {
  const photos = manifest as Photo[];
  const known = new Set(photos.flatMap((p) => [p.src, p.xlSrc ?? p.src]).map(globKey));
  const missing = photos.filter((p) => !(globKey(p.src) in pictures)).map((p) => p.id);
  const unlisted = Object.keys(pictures).filter((k) => !known.has(k));
  if (missing.length > 0) {
    console.warn(
      `images: ${missing.length} manifest photo(s) have no file in src/assets/photos/ (placeholders shown):\n  ${missing.join(', ')}`,
    );
  }
  if (unlisted.length > 0) {
    console.warn(
      `images: ${unlisted.length} file(s) in src/assets/photos/ have no manifest entry (never shown):\n  ${unlisted.join('\n  ')}`,
    );
  }
}
