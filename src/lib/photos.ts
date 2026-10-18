// Typed access to src/data/photos.manifest.json (spec 13). Every section gets photos through
// these helpers, and every getter returns publishable photos only (consent gate, spec 6).
import { albumInfo, heroPhotoIds } from '@/data/curation';
import manifest from '@/data/photos.manifest.json';
import { themeLabels } from '@/data/themes';
import type {
  Album,
  Category,
  Photo,
  PhotoCategory,
  PhotoKind,
  QualityTier,
} from '@/types/content';

/** Every manifest entry, publishable or not. Only for dev checks; sections use the getters. */
export const allPhotos = manifest as Photo[];

const ENFORCE_CONSENT = import.meta.env.VITE_ENFORCE_CONSENT === 'true';

/** True when the photo needs consent that the owner hasn't confirmed yet (dev badge). */
export function isConsentPending(photo: Photo) {
  return photo.requiresConsent && photo.consent !== true;
}

/** Hidden only in builds with VITE_ENFORCE_CONSENT=true (the launch build). */
export function isPublishable(photo: Photo) {
  return !(ENFORCE_CONSENT && isConsentPending(photo));
}

const published = allPhotos.filter(isPublishable);
const byId = new Map(published.map((p) => [p.id, p]));

export interface PhotoFilter {
  category?: PhotoCategory;
  theme?: string;
  featured?: boolean;
  tier?: QualityTier;
  kind?: PhotoKind;
}

export function getPhotos({ category, theme, featured, tier, kind }: PhotoFilter = {}): Photo[] {
  return published.filter(
    (p) =>
      (category === undefined || p.category === category) &&
      (theme === undefined || p.theme === theme) &&
      (featured === undefined || p.featured === featured) &&
      (tier === undefined || p.qualityTier === tier) &&
      (kind === undefined || p.kind === kind),
  );
}

export function getPhoto(id: string): Photo | undefined {
  return byId.get(id);
}

const byAlbumOrder = (a: Photo, b: Photo) => (a.albumOrder ?? 0) - (b.albumOrder ?? 0);

/**
 * Albums in `albumInfo` order (unlisted slugs last). Cover: the lowest-ordered album-cover,
 * otherwise the first page. A back cover (an album-cover after the front one) stays in `pages`.
 */
export function getAlbums(): Album[] {
  const groups = new Map<string, Photo[]>();
  for (const p of published) {
    if (p.album) groups.set(p.album, [...(groups.get(p.album) ?? []), p]);
  }
  const order = Object.keys(albumInfo);
  const rank = (slug: string) => (order.includes(slug) ? order.indexOf(slug) : order.length);

  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([slug, entries]) => {
      const sorted = entries.toSorted(byAlbumOrder);
      const frontCover = sorted.find((p) => p.kind === 'album-cover');
      const cover = frontCover ?? sorted[0];
      const info = albumInfo[slug] ?? { title: slug, type: 'Album' };
      return {
        slug,
        title: info.title,
        type: info.type,
        cover,
        pages: frontCover ? sorted.filter((p) => p !== frontCover) : sorted,
      };
    });
}

/** Hero candidates from spec 7.3; falls back to hero-tier photos if none are publishable. */
export function getHeroPhotos(): Photo[] {
  const picked = heroPhotoIds.map(getPhoto).filter((p): p is Photo => p !== undefined);
  return picked.length > 0 ? picked : getPhotos({ tier: 'hero', kind: 'photo' });
}

/** Categories (albums excluded) that have at least one publishable photo. */
export function categoriesWithPhotos(): Category[] {
  const found = new Set<Category>();
  for (const p of published) {
    if (p.kind === 'photo' && !p.category.startsWith('albums/')) found.add(p.category as Category);
  }
  return [...found];
}

/** Theme ids within a category, in `themeLabels` order (unlisted themes last). */
export function themesIn(category: PhotoCategory): string[] {
  const themes = new Set(getPhotos({ category, kind: 'photo' }).map((p) => p.theme));
  const order = Object.keys(themeLabels);
  return [
    ...order.filter((t) => themes.has(t)),
    ...[...themes].filter((t) => !order.includes(t)).sort(),
  ];
}

/**
 * TODO(Phase 4): resolve a manifest `src` to a built asset URL.
 * Photos are git-ignored, so a fresh clone has no files. Phase 4 will use
 * `import.meta.glob('/src/assets/photos/**\/*.webp', { query: ..., import: 'default' })`, which
 * returns an empty map when files are missing, and return `undefined` for a missing photo so
 * callers can skip it. A missing file must never break the build.
 */
export function resolvePhotoUrl(_photo: Photo): string | undefined {
  return undefined;
}
