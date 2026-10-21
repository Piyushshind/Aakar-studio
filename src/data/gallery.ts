import { categoriesWithPhotos, getPhotos, themesIn } from '@/lib/photos';
import type { Category, Photo } from '@/types/content';
import { themeLabel, themeLabels } from './themes';

// Derived from the manifest via src/lib/photos.ts (spec 6); nothing is duplicated here.

export interface GalleryTab {
  id: string; // 'all', a category or a theme id
  label: string;
  photos: Photo[];
}

const categoryLabels: Record<Category, string> = {
  newborn: 'Newborn',
  'baby-kids': 'Baby & Kids',
  maternity: 'Maternity',
  wedding: 'Wedding',
  'pre-wedding': 'Pre-Wedding',
  family: 'Family',
  events: 'Events',
  product: 'Product',
  about: 'About',
};

const featuredFirst = (photos: Photo[]) => [
  ...photos.filter((p) => p.featured),
  ...photos.filter((p) => !p.featured),
];

/**
 * Display order: round-robin across themes (featured photos first within each), so neighbouring
 * photos and masonry columns mix themes instead of showing near-identical frames in a row.
 */
function interleaveByTheme(photos: Photo[]): Photo[] {
  const order = Object.keys(themeLabels);
  const rank = (t: string) => (order.includes(t) ? order.indexOf(t) : order.length);
  const byTheme = new Map<string, Photo[]>();
  for (const p of photos) byTheme.set(p.theme, [...(byTheme.get(p.theme) ?? []), p]);
  const groups = [...byTheme.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([, group]) => featuredFirst(group));
  const out: Photo[] = [];
  for (let i = 0; out.length < photos.length; i++) {
    for (const group of groups) if (group[i]) out.push(group[i]);
  }
  return out;
}

/** Portfolio photos: album pages and About photos are shown elsewhere. */
export const galleryPhotos = interleaveByTheme(
  getPhotos({ kind: 'photo' }).filter((p) => p.category !== 'about'),
);

const galleryCategories = categoriesWithPhotos().filter((c) => c !== 'about');

/**
 * Spec 5, Gallery: filter by category when two or more have photos, otherwise by theme
 * within the only category. Tabs only exist for groups that have photos.
 */
export const galleryFilterMode: 'category' | 'theme' =
  galleryCategories.length >= 2 ? 'category' : 'theme';

export const galleryTabs: GalleryTab[] = [
  { id: 'all', label: 'All', photos: galleryPhotos },
  ...(galleryFilterMode === 'category'
    ? galleryCategories.map((c) => ({
        id: c,
        label: categoryLabels[c],
        photos: galleryPhotos.filter((p) => p.category === c),
      }))
    : galleryCategories.flatMap((c) =>
        themesIn(c).map((t) => ({
          id: t,
          label: themeLabel(t),
          photos: featuredFirst(galleryPhotos.filter((p) => p.category === c && p.theme === t)),
        })),
      )),
];

/** Featured photos for the "Best of" strip. */
export const bestOf = galleryPhotos.filter((p) => p.featured);
