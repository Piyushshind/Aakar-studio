import { getAlbums } from '@/lib/photos';

// Derived from the manifest via src/lib/photos.ts (spec 6). Titles live in ./curation.ts.
export const albums = getAlbums();
