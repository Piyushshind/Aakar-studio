// Hand-picked ids and album titles layered on top of photos.manifest.json (spec 7.3).
// Kept free of imports: src/lib/photos.ts and the build-time photo gate (vite.config.ts) read it.

/**
 * Photos that must never appear on the site, whatever their consent status. Every photos.ts
 * getter skips them, and the build never even emits their image files.
 */
export const excludedPhotos: Record<string, string> = {
  'wedding-01-06':
    'Back cover shows an older blue Aakar logo; hidden until the owner confirms which logo is current.',
};

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
export const albumInfo: Record<string, { title: string; subtitle?: string; type: string }> = {
  // Subtitles are other titles printed on the pages: little-farmer-01, little-farmer-green-02, beach-baby-01.
  'little-farmer': {
    title: 'Our Little Farmer',
    subtitle: 'Village Charm',
    type: 'Kids themed album',
  },
  'little-farmer-green': {
    title: 'Our Little Farmer',
    subtitle: 'Pure Joy',
    type: 'Kids themed album',
  },
  'beach-baby': { title: 'Beach Vibes', subtitle: 'Sun, Sand & Smiles', type: 'Kids themed album' },
  'wedding-01': { title: 'Wedding Album', type: 'Wedding album' },
};
