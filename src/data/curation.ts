// Hand-picked ids and album titles layered on top of photos.manifest.json (spec 7.3).
// Kept free of imports so src/lib/photos.ts can read it without an import cycle.

/** Hero candidates, in display order (spec 7.3). */
export const heroPhotoIds = [
  'baby-kids-traditional-flowers-01',
  'baby-kids-traditional-flowers-03',
  'baby-kids-krishna-theme-01',
  'baby-kids-farm-theme-01',
  'baby-kids-beach-theme-04',
  'baby-kids-kutchi-traditional-01',
  'baby-kids-blue-sky-01',
  'baby-kids-pink-winter-01',
];

/**
 * Album titles and types, in display order. Titles are the ones printed on the album pages;
 * wedding-01's printed title is Marathi with the couple's names, so it gets a neutral title.
 */
export const albumInfo: Record<string, { title: string; type: string }> = {
  'little-farmer': { title: 'Our Little Farmer', type: 'Kids themed album' },
  'little-farmer-green': { title: 'Our Little Farmer', type: 'Kids themed album' },
  'beach-baby': { title: 'Beach Vibes', type: 'Kids themed album' },
  'wedding-01': { title: 'Wedding Album', type: 'Wedding album' },
};
