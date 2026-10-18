import { categoriesWithPhotos, getPhotos, themesIn } from '@/lib/photos';
import type { Category, Photo } from '@/types/content';
import { themeLabel } from './themes';

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

/** Portfolio photos: album pages and About photos are shown elsewhere. */
export const galleryPhotos = getPhotos({ kind: 'photo' }).filter((p) => p.category !== 'about');

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
          photos: galleryPhotos.filter((p) => p.category === c && p.theme === t),
        })),
      )),
];

/** Featured photos for the "Best of" strip. */
export const bestOf = galleryPhotos.filter((p) => p.featured);
