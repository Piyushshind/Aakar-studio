import type { Album, Photo } from '@/types/content';

// Album spreads → flip-book leaves (spec 5 item 8). Every album image is a two-page spread split
// at the spine; a leaf is one physical sheet: the right half of a spread on its front, the left
// half of the next spread on its back. A cover that is itself a spread (back cover left, front
// cover right; the kids albums) closes the book at both ends. A single front cover (the wedding
// album) only closes it at the start. An album without a cover opens straight at its first spread.

/** Which part of an image a page face shows. */
export type FaceHalf = 'left' | 'right' | 'full';
export interface Face {
  photo: Photo;
  half: FaceHalf;
}
export interface Leaf {
  front: Face;
  back: Face | null;
}

export interface Book {
  leaves: Leaf[];
  /** Static pages under the leaves: the first spread's left half when there is no cover, and the
   * last spread's right half when there is no back cover. */
  baseLeft: Face | null;
  baseRight: Face | null;
  /** Width / height of the open book. */
  ratio: number;
  /** Positions run 0..leaves.length (one per turn). */
  positions: number;
  closedFront: boolean;
  closedBack: boolean;
}

/** Below this an image is a single page (or a 3:2 spread), not a 3:1 spread. */
const SPREAD_RATIO = 2.2;
const ratioOf = (p: Photo) => p.width / p.height;

export function buildBook(album: Album): Book {
  const hasCover = album.cover.kind === 'album-cover';
  const pages = hasCover
    ? album.pages
    : [album.cover, ...album.pages.filter((p) => p !== album.cover)];
  const coverIsSpread = hasCover && ratioOf(album.cover) >= SPREAD_RATIO;
  const left = (photo: Photo): Face => ({ photo, half: 'left' });
  const right = (photo: Photo): Face => ({ photo, half: 'right' });

  const leaves: Leaf[] = [];
  if (hasCover) {
    leaves.push({
      front: coverIsSpread ? right(album.cover) : { photo: album.cover, half: 'full' },
      back: pages[0] ? left(pages[0]) : coverIsSpread ? left(album.cover) : null,
    });
  }
  pages.forEach((page, i) => {
    const next = pages[i + 1];
    if (next) leaves.push({ front: right(page), back: left(next) });
    else if (coverIsSpread) leaves.push({ front: right(page), back: left(album.cover) });
  });

  // The open book takes the widest spread's shape; narrower spreads are letterboxed in it.
  const widest = Math.max(...pages.map(ratioOf), coverIsSpread ? ratioOf(album.cover) : 0);
  return {
    leaves,
    baseLeft: hasCover || !pages[0] ? null : left(pages[0]),
    baseRight: coverIsSpread || !pages.at(-1) ? null : right(pages.at(-1) as Photo),
    ratio: Math.min(3.2, Math.max(1.4, widest || 3)),
    positions: leaves.length + 1,
    closedFront: hasCover,
    closedBack: coverIsSpread,
  };
}

/** The open spreads in order, for the swipe slider (phones, reduced motion). */
export function albumSpreads(album: Album): Photo[] {
  const hasCover = album.cover.kind === 'album-cover';
  return hasCover ? [album.cover, ...album.pages] : album.pages;
}

/** Label for a book position, e.g. "Front cover", "Spread 2 of 4". */
export function positionLabel(book: Book, position: number) {
  const last = book.positions - 1;
  if (book.closedFront && position === 0) return 'Front cover';
  if (book.closedBack && position === last) return 'Back cover';
  const spreads = book.positions - (book.closedFront ? 1 : 0) - (book.closedBack ? 1 : 0);
  const n = position + (book.closedFront ? 0 : 1);
  return `Spread ${n} of ${spreads}`;
}
