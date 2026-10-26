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

/** The first hero photo: the LCP image (preloaded) and the only one with reduced motion. */
// Not traditional-flowers-03: it is the only -xl master, so the photo-quality section uses it.
export const heroLeadPhotoId = 'baby-kids-kutchi-traditional-01';

/**
 * Hero crossfade, in order (Phase 7): the lead photo, then four from heroPhotoIds picked for
 * varied palettes: earthy farm, bright beach, cool blue, soft pink. traditional-flowers-01 and
 * krishna-theme-01 share the lead's orange backdrop, so they're left out.
 */
export const heroSlideIds = [
  heroLeadPhotoId,
  'baby-kids-farm-theme-01',
  'baby-kids-beach-theme-04',
  'baby-kids-blue-sky-01',
  'baby-kids-pink-winter-01',
];

/**
 * object-position focal points that keep faces in frame when a photo is cropped (spec 4.4).
 * Photos not listed are centred.
 */
export const photoFocus: Record<string, string> = {
  'baby-kids-traditional-flowers-03': '50% 30%',
  'baby-kids-kutchi-traditional-01': '46% 55%',
  'baby-kids-pink-winter-02': '45% 45%',
  'baby-kids-first-birthday-01': '42% 60%',
  'baby-kids-teddy-theme-01': '50% 40%',
  // Hero slides: the child stays in the roughly square split-layout panel.
  'baby-kids-farm-theme-01': '45% 60%',
  'baby-kids-beach-theme-04': '45% 65%',
  'baby-kids-blue-sky-01': '72% 55%',
  'baby-kids-pink-winter-01': '40% 55%',
  // 4:3 service thumbnails and previews of portrait photos: keep faces in the crop.
  'maternity-portrait-01': '50% 22%',
  'pre-wedding-outdoor-03': '50% 20%',
  'newborn-studio-01': '20% 50%',
  'family-studio-01': '50% 20%',
  'portrait-floral-arch-01': '50% 30%',
  'about-owner-01': '50% 30%',
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
