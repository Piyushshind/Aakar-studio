// Typed access to src/data/photos.manifest.json (spec 13). Every section gets photos through
// these helpers, and every getter returns publishable photos only: never an excluded photo
// (curation.excludedPhotos), and no consent-pending photo in the launch build (spec 6).
import { albumInfo, heroPhotoIds } from '@/data/curation';
import manifest from '@/data/photos.manifest.json';
import { themeLabels } from '@/data/themes';
import { photoBlockReason } from '@/lib/imagePolicy';
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

/**
 * False for excluded photos, and for consent-pending photos in builds with
 * VITE_ENFORCE_CONSENT=true (the launch build). `enforceConsent` overrides the build flag
 * (dev-only simulation).
 */
export function isPublishable(photo: Photo, { enforceConsent = ENFORCE_CONSENT } = {}) {
  return photoBlockReason(photo, enforceConsent) === null;
}

const published = allPhotos.filter((p) => isPublishable(p));
const anyById = new Map(allPhotos.map((p) => [p.id, p]));

/** Any manifest entry by id, publishable or not. For ResponsiveImage and dev checks only. */
export function findPhoto(id: string): Photo | undefined {
  return anyById.get(id);
}
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
      const info = albumInfo[slug] ?? { title: slug, subtitle: undefined, type: 'Album' };
      return {
        slug,
        title: info.title,
        subtitle: info.subtitle,
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

// Image URLs and srcsets: src/lib/images.ts (resolvePhotoUrl, getPhotoSources).
