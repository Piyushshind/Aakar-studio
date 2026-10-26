import { lazy, Suspense, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { albums } from '@/data/albums';
import { albumsNote, taglines } from '@/data/copy';
import { sectionEyebrows } from '@/data/navigation';
import { cn } from '@/lib/cn';
import type { Album } from '@/types/content';

// The viewer (flip-book or slider) loads on first use; hovering or touching a card fetches it.
const loadViewer = () => import('@/components/album/AlbumViewer');
const AlbumViewer = lazy(loadViewer);
const prefetchViewer = () => void loadViewer();

type OpenAlbum = (album: Album, origin: DOMRect | null) => void;

// Every card is a 3:2 frame. Most covers are 3:1 spreads (back cover left, front cover right),
// so anchoring the crop to the right edge shows exactly the front cover; the full spread is in
// the viewer. The wedding cover is already 3:2 and fills the frame as is.
const FRAME = 1.5;
const CARD_SIZES = [
  { media: '(min-width: 1440px)', px: 640 },
  { media: '(min-width: 768px)', vw: 45 },
  { vw: 100 },
] as const;

/** `sizes` for a cover that is wider than the frame: it renders `ratio / FRAME` times wider. */
function coverSizes(ratio: number) {
  const scale = Math.max(1, ratio / FRAME);
  return CARD_SIZES.map((s) => {
    const width = 'px' in s ? `${Math.round(s.px * scale)}px` : `${Math.round(s.vw * scale)}vw`;
    return 'media' in s ? `${s.media} ${width}` : width;
  }).join(', ');
}

function AlbumCard({
  album,
  index,
  open,
  onOpen,
}: {
  album: Album;
  index: number;
  /** Its viewer is open: the cover has "lifted off" into the book, so the card shows none. */
  open: boolean;
  onOpen: OpenAlbum;
}) {
  const { cover } = album;
  const ratio = cover.width / cover.height;
  const pageCount = album.pages.length;

  return (
    // The li is the reveal (and the stretched button's positioning box): a transformed child
    // would otherwise become the containing block and shrink the clickable area.
    <Reveal
      as="li"
      index={index}
      className="album-card group relative"
      data-cursor="view"
      onPointerEnter={prefetchViewer}
      onTouchStart={prefetchViewer}
    >
      {/* Hover / focus: the cover lifts (translate) and a soft shadow fades in (opacity). The
          lift wraps the reveal, so the reveal's clip-path never cuts the raised edge. */}
      <div className="relative transition-[translate] duration-(--duration-base) ease-out after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:opacity-0 after:shadow-[0_28px_50px_-28px_rgb(0_0_0/0.9)] after:transition-opacity after:duration-(--duration-base) group-focus-within:after:opacity-100 group-hover:after:opacity-100 motion-safe:group-focus-within:-translate-y-1.5 motion-safe:group-hover:-translate-y-1.5">
        <Reveal variant="photo" index={index}>
          <div className="overflow-clip border border-line">
            <ResponsiveImage
              photo={cover}
              ratio="3 / 2"
              sizes={coverSizes(ratio)}
              objectPosition={ratio > FRAME + 0.1 ? '100% 50%' : undefined}
              alt=""
              className={cn(
                'album-cover transition-opacity duration-(--duration-fast)',
                open && 'opacity-0',
              )}
            />
          </div>
        </Reveal>
      </div>
      <div className="mt-6 flex items-start justify-between gap-6">
        <div>
          <p className="eyebrow text-xs text-gold lg:text-[0.65rem]">{album.type}</p>
          <h3 className="mt-3 display text-[clamp(1.75rem,2.6vw,2.5rem)]">
            {/* Stretched button: the whole card opens the album viewer. */}
            <button
              type="button"
              data-album={album.slug}
              aria-haspopup="dialog"
              onFocus={prefetchViewer}
              onClick={(event) => {
                const cover = event.currentTarget.closest('li')?.querySelector('.album-cover');
                onOpen(album, cover?.getBoundingClientRect() ?? null);
              }}
              className="text-left outline-none after:absolute after:inset-0 after:outline-offset-8 after:outline-gold hover:text-gold-light focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-solid"
            >
              {album.title}
              {album.subtitle && <span className="sr-only">, {album.subtitle}</span>}
              <span className="sr-only">. Open album</span>
            </button>
          </h3>
          {album.subtitle && (
            <p aria-hidden="true" className="mt-2 font-display text-lg text-muted italic">
              {album.subtitle}
            </p>
          )}
        </div>
        <p className="shrink-0 pt-0.5 eyebrow text-xs text-muted lg:text-[0.65rem]">
          {pageCount} {pageCount === 1 ? 'page' : 'pages'}
        </p>
      </div>
    </Reveal>
  );
}

/**
 * Albums (spec 5, item 8): real client albums as a staggered two-column grid of front covers.
 * Each card opens the album viewer: a flip-book on desktop (the cover flies into it and opens),
 * a swipe slider on phones and with reduced motion.
 */
export function Albums() {
  const [viewer, setViewer] = useState<{ album: Album; origin: DOMRect | null } | null>(null);
  if (albums.length === 0) return null;
  const { number, label } = sectionEyebrows.albums;

  return (
    <Section id="albums" aria-labelledby="albums-title" className="albums">
      <Container>
        <SectionHeading
          id="albums-title"
          number={number}
          eyebrow={label}
          title={taglines.albums}
          intro={albumsNote}
          layout="split"
        />
        <ul className="mt-16 grid gap-x-8 gap-y-16 md:grid-cols-2 lg:mt-24 lg:gap-x-12 lg:gap-y-20 md:[&>li:nth-child(even)]:mt-28">
          {albums.map((album, i) => (
            <AlbumCard
              key={album.slug}
              album={album}
              index={i % 2}
              open={viewer?.album === album}
              onOpen={(a, origin) => setViewer({ album: a, origin })}
            />
          ))}
        </ul>
      </Container>

      {viewer && (
        <Suspense fallback={null}>
          <AlbumViewer
            album={viewer.album}
            origin={viewer.origin}
            onClose={() => setViewer(null)}
          />
        </Suspense>
      )}
    </Section>
  );
}
