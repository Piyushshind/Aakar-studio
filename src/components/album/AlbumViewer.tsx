import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, RotateCw, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MOTION_OK_QUERY } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import { getPhotoSources } from '@/lib/images';
import { gsap, useGSAP } from '@/lib/gsap';
import { duration, ease } from '@/lib/motion';
import { getActiveLenis } from '@/lib/scroll';
import type { Album } from '@/types/content';
import { albumSpreads, buildBook, positionLabel, type Book, type Face } from './albumBook';

export interface AlbumViewerProps {
  album: Album;
  /** Screen rect of the card's cover when it was clicked: the book flies in from there. */
  origin: DOMRect | null;
  onClose: () => void;
}

// The flip-book needs a desktop-sized screen and motion; otherwise the swipe slider.
const BOOK_QUERY = `(min-width: 1024px) and ${MOTION_OK_QUERY}`;
const TURN = 0.9; // seconds per page turn
// Book size: as wide as the screen allows (arrows either side), as tall as fits between the bars.
const BOOK_SIZE =
  'w-[min(calc(100vw-11rem),calc((100svh-13rem)*var(--book-ratio)))] aspect-(--book-ratio)';
const ROUND =
  'flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-bg/60 text-text backdrop-blur-sm hover:border-gold/60 hover:text-gold-light disabled:pointer-events-none disabled:opacity-25';

/**
 * Album viewer (spec 5 item 8; signature moment 5): a modal dialog. Desktop with motion: a CSS 3D
 * flip-book driven by GSAP; the clicked cover flies from the card into the closed book (FLIP),
 * which then opens. Phones and reduced motion: an Embla swipe slider of the spreads. Esc, the
 * close button or a click outside closes it; the page behind is inert and Lenis paused, and focus
 * returns to the album card.
 */
export default function AlbumViewer({ album, origin, onClose }: AlbumViewerProps) {
  const root = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bookMode = useMediaQuery(BOOK_QUERY);
  const [closing, setClosing] = useState(false);
  const [label, setLabel] = useState('');

  // Dialog plumbing: inert page, paused Lenis, no page scroll, focus in and back out.
  useEffect(() => {
    const opener = document.activeElement;
    const page = document.getElementById('root');
    const lenis = getActiveLenis();
    const html = document.documentElement;
    const overflow = html.style.overflow;
    if (page) page.inert = true;
    lenis?.stop();
    html.style.overflow = 'hidden';
    root.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true });
    return () => {
      if (page) page.inert = false;
      lenis?.start();
      html.style.overflow = overflow;
      if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
    };
  }, []);

  // The backdrop and bars fade in while the book arrives (FlipBook / SpreadSlider animate it).
  useGSAP(
    () => {
      gsap.from('.album-backdrop', { autoAlpha: 0, duration: duration.base, ease: ease.out });
      // Opacity only: visibility:hidden would stop the close button taking focus.
      gsap.from('.album-viewer-bar', {
        opacity: 0,
        y: -12,
        duration: duration.base,
        ease: ease.out,
        delay: duration.fast,
      });
    },
    { scope: root },
  );

  // Fade out, then unmount.
  const close = () => {
    if (closing) return;
    setClosing(true);
    gsap.to(root.current, {
      autoAlpha: 0,
      duration: duration.fast,
      ease: ease.out,
      onComplete: onClose,
    });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return createPortal(
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="album-viewer fixed inset-0 z-[90] flex flex-col text-text"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div aria-hidden="true" className="album-backdrop absolute inset-0 -z-10 bg-bg" />
      <header className="album-viewer-bar flex items-start justify-between gap-6 px-(--gutter) pt-5 lg:pt-7">
        <div>
          <p className="eyebrow text-xs text-gold lg:text-[0.65rem]">{album.type}</p>
          <h2 id={titleId} className="mt-2 display text-[clamp(1.5rem,2.4vw,2.25rem)]">
            {album.title}
            {album.subtitle && (
              <span className="ml-3 font-display text-[0.6em] text-muted italic">
                {album.subtitle}
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-5">
          <p
            aria-live="polite"
            className="hidden eyebrow text-xs text-muted sm:block lg:text-[0.65rem]"
          >
            {label}
          </p>
          <button
            type="button"
            data-autofocus
            onClick={close}
            aria-label="Close album"
            className={ROUND}
          >
            <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {bookMode ? (
        <FlipBook album={album} origin={origin} onLabel={setLabel} onBackdrop={close} />
      ) : (
        <SpreadSlider album={album} onLabel={setLabel} onBackdrop={close} />
      )}
    </div>,
    document.body,
  );
}

/** One page face: a half (or all) of an album image, letterboxed in the book's shape. */
function PageFace({ face, back = false }: { face: Face | null; back?: boolean }) {
  return (
    <div
      className={cn(
        'album-face absolute inset-0 overflow-clip bg-surface [backface-visibility:hidden]',
        back && '[transform:rotateY(180deg)]',
      )}
    >
      {face && (
        <div
          className={cn(
            'absolute inset-y-0',
            face.half === 'full' ? 'inset-x-0' : 'w-[200%]',
            face.half === 'right' && 'right-0',
            face.half === 'left' && 'left-0',
          )}
        >
          {/* A narrower spread is letterboxed in the book: its margins get a soft blurred wash
              of the same spread (the inline blur placeholder), not empty dark paper. */}
          {face.half !== 'full' && (
            <div
              aria-hidden="true"
              className="absolute inset-0 scale-110 bg-cover bg-center opacity-50 blur-2xl"
              style={{ backgroundImage: `url(${getPhotoSources(face.photo)?.placeholder ?? ''})` }}
            />
          )}
          <ResponsiveImage
            photo={face.photo}
            sizes="85vw"
            fit={face.half === 'full' ? 'cover' : 'contain'}
            alt=""
            // size-full: an absolutely positioned box with an aspect-ratio would otherwise take
            // its height from the photo's ratio rather than from the insets.
            className="absolute inset-0 size-full"
          />
        </div>
      )}
      {/* Shading that deepens while the page lifts (GSAP, opacity only). */}
      <div
        aria-hidden="true"
        className={cn(
          'leaf-shade pointer-events-none absolute inset-0 opacity-0',
          back
            ? 'bg-linear-to-l from-black/60 via-black/15 to-transparent'
            : 'bg-linear-to-r from-black/60 via-black/15 to-transparent',
        )}
      />
    </div>
  );
}

/** Stacking for a resting book: turned leaves pile up on the left (last on top), the rest on the
 * right (first on top). */
const restingZ = (j: number, position: number, count: number) =>
  j < position ? j + 1 : count - j + 1;
/** Closed at the front: the cover (right half) sits in the middle; closed at the back, the left. */
const shiftFor = (book: Book, position: number) =>
  book.closedFront && position === 0
    ? -25
    : book.closedBack && position === book.positions - 1
      ? 25
      : 0;

function FlipBook({
  album,
  origin,
  onLabel,
  onBackdrop,
}: {
  album: Album;
  origin: DOMRect | null;
  onLabel: (label: string) => void;
  onBackdrop: () => void;
}) {
  const book = useMemo(() => buildBook(album), [album]);
  const scope = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  /** Turns the book to a position; set up inside the GSAP context (so it is cleaned up with it). */
  const turnTo = useRef<(to: number) => void>(() => {});
  /** Turns one page forward (+1) or back (-1). For buttons, keys and the page halves. */
  const step = (dir: 1 | -1) => turnTo.current(position.current + dir);
  const position = useRef(0);
  const [shown, setShown] = useState(0);
  const last = book.positions - 1;
  const alt = `${album.title}, ${positionLabel(book, shown).toLowerCase()}`;

  useEffect(() => onLabel(positionLabel(book, shown)), [book, shown, onLabel]);

  useGSAP(
    (_, contextSafe) => {
      const q = gsap.utils.selector(scope);
      const leaves = q('.album-leaf');
      const count = leaves.length;
      const bookEl = q('.album-book');
      const spine = q('.album-spine');
      // Only the pages that can be seen are drawn: covered ones would otherwise peek out by a
      // pixel at the edges (the GPU rounds each 3D layer's edge on its own). `stack` runs from the
      // static left page (j = -1) through the leaves to the static right page (j = count).
      const stack = [q('.album-base-left')[0], ...leaves, q('.album-base-right')[0]];
      const showOnly = (lo: number, hi: number) =>
        stack.forEach((el, i) =>
          gsap.set(el, { visibility: i - 1 >= lo && i - 1 <= hi ? 'visible' : 'hidden' }),
        );

      leaves.forEach((leaf, j) => gsap.set(leaf, { rotateY: 0, zIndex: restingZ(j, 0, count) }));
      showOnly(-1, 0);
      gsap.set(bookEl, { xPercent: shiftFor(book, 0) });
      gsap.set(spine, { autoAlpha: book.closedFront ? 0 : 1 });

      let turning: gsap.core.Timeline | null = null;
      turnTo.current = contextSafe!((to: number) => {
        const from = position.current;
        if (to < 0 || to > last || to === from) return;
        turning?.progress(1); // finish a turn in progress first
        const forward = to > from;
        const leaf = leaves[forward ? from : from - 1];
        position.current = to;
        setShown(to);
        if (!leaf) return;
        // The turning leaf, the pages it uncovers and the ones it lands on.
        showOnly(Math.min(from, to) - 1, Math.max(from, to));

        turning = gsap
          .timeline({
            defaults: { duration: TURN, ease: ease.inOut },
            onComplete: () => {
              leaves.forEach((l, k) => gsap.set(l, { zIndex: restingZ(k, to, count) }));
              showOnly(to - 1, to);
              turning = null;
            },
          })
          .set(leaf, { zIndex: count + 10 })
          .to(leaf, { rotateY: forward ? -180 : 0 }, 0)
          .to(bookEl, { xPercent: shiftFor(book, to) }, 0)
          .to(
            leaf.querySelectorAll('.leaf-shade'),
            { opacity: 1, duration: TURN / 2, ease: 'sine.in', yoyo: true, repeat: 1 },
            0,
          )
          .to(spine, { autoAlpha: shiftFor(book, to) === 0 ? 1 : 0, duration: TURN / 2 }, TURN / 4);
      });

      // FLIP from the card: start the stage where the card's cover was, scaled to its size, so
      // the cover itself appears to lift off the page into the viewer. Then the cover opens.
      const tl = gsap.timeline();
      const face = q('.album-leaf .album-face')[0];
      const stage = stageRef.current;
      if (origin && face && stage && book.closedFront) {
        const f = face.getBoundingClientRect();
        const s = stage.getBoundingClientRect();
        tl.from(stage, {
          x: origin.left - f.left,
          y: origin.top - f.top,
          scale: origin.width / f.width,
          transformOrigin: `${f.left - s.left}px ${f.top - s.top}px`,
          duration: duration.slow,
          ease: 'power3.inOut',
          clearProps: 'transform',
        });
      } else {
        tl.from(stage, { autoAlpha: 0, y: 24, duration: duration.base, ease: ease.out });
      }
      // clearProps: an inline opacity would hide the dimmed style of a disabled button.
      tl.from(
        q('.album-controls'),
        { autoAlpha: 0, duration: duration.base, clearProps: 'opacity,visibility' },
        '<0.4',
      );
      if (book.closedFront && last > 0) tl.add(() => turnTo.current(1), '-=0.35');
    },
    { scope },
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') turnTo.current(position.current + 1);
      else if (event.key === 'ArrowLeft') turnTo.current(position.current - 1);
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      ref={scope}
      className="flex flex-1 items-center justify-center gap-6 px-(--gutter) pb-8"
      onClick={(event) => {
        if (event.target === event.currentTarget) onBackdrop();
      }}
    >
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={shown === 0}
        aria-label="Previous page"
        className={cn('album-controls', ROUND)}
      >
        <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
      </button>

      <div
        ref={stageRef}
        className="relative"
        style={{ '--book-ratio': book.ratio } as CSSProperties}
      >
        <div role="img" aria-label={alt} className={cn('relative', BOOK_SIZE)}>
          {/* Flat (no preserve-3d), so z-index orders the leaves; each leaf is its own 3D
              context for its two faces, seen through the book's perspective. */}
          <div className="album-book absolute inset-0 [perspective:2800px]">
            {/* Static pages under the leaves. */}
            <div className="album-base-left absolute inset-y-0 left-0 w-1/2">
              {book.baseLeft && <PageFace face={book.baseLeft} />}
            </div>
            <div className="album-base-right absolute inset-y-0 right-0 w-1/2">
              {book.baseRight && <PageFace face={book.baseRight} />}
            </div>
            {book.leaves.map((leaf, j) => (
              <div
                key={j}
                className="album-leaf absolute inset-y-0 right-0 w-1/2 origin-left [transform-style:preserve-3d]"
              >
                <PageFace face={leaf.front} />
                <PageFace face={leaf.back} back />
              </div>
            ))}
            {/* Spine shadow down the middle while the book is open. */}
            <div
              aria-hidden="true"
              className="album-spine pointer-events-none absolute inset-y-0 left-1/2 z-[100] w-24 -translate-x-1/2 bg-[linear-gradient(to_right,transparent,rgb(0_0_0/0.28)_45%,rgb(0_0_0/0.4)_50%,rgb(0_0_0/0.28)_55%,transparent)]"
            />
            {/* Click either half to turn (the custom cursor labels them). */}
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              data-cursor="prev"
              disabled={shown === 0}
              onClick={() => step(-1)}
              className="absolute inset-y-0 left-0 z-[101] w-1/2 disabled:pointer-events-none"
            />
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              data-cursor="next"
              disabled={shown === last}
              onClick={() => step(1)}
              className="absolute inset-y-0 right-0 z-[101] w-1/2 disabled:pointer-events-none"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => step(1)}
        disabled={shown === last}
        aria-label="Next page"
        className={cn('album-controls', ROUND)}
      >
        <ChevronRight aria-hidden="true" className="size-5" strokeWidth={1.5} />
      </button>
    </div>
  );
}

/** Phones and reduced motion: the spreads full width in a swipe slider. */
function SpreadSlider({
  album,
  onLabel,
  onBackdrop,
}: {
  album: Album;
  onLabel: (label: string) => void;
  onBackdrop: () => void;
}) {
  const spreads = useMemo(() => albumSpreads(album), [album]);
  const [viewport, api] = useEmblaCarousel({ align: 'center' });
  const [index, setIndex] = useState(0);
  const reducedMotion = !useMediaQuery(MOTION_OK_QUERY);
  const portrait = useMediaQuery('(orientation: portrait) and (max-width: 767px)');
  const count = spreads.length;
  const labelFor = (i: number) => `${i + 1} of ${count}`;

  useEffect(() => onLabel(labelFor(index)));

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  const go = (i: number) => api?.scrollTo(i, reducedMotion);

  // Arrow keys step through the spreads, as in the flip-book.
  useEffect(() => {
    if (!api) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const next = api.selectedScrollSnap() + (event.key === 'ArrowRight' ? 1 : -1);
      api.scrollTo(next, reducedMotion);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [api, reducedMotion]);

  return (
    <div
      className="flex flex-1 flex-col justify-center gap-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:gap-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onBackdrop();
      }}
    >
      <div
        ref={viewport}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${album.title} pages`}
        className="overflow-clip"
      >
        <ul className="flex touch-pan-y">
          {spreads.map((photo, i) => (
            <li
              key={photo.id}
              role="group"
              aria-roledescription="slide"
              aria-label={labelFor(i)}
              className="min-w-0 shrink-0 grow-0 basis-full px-(--gutter)"
            >
              <ResponsiveImage
                photo={photo}
                sizes="100vw"
                fit="contain"
                alt={`${album.title}, ${i === 0 && album.cover === photo ? 'cover' : `page ${i + 1}`}`}
                className="mx-auto max-h-[min(70svh,calc(100svh-12rem))] w-auto max-w-full shadow-[0_24px_60px_-30px_rgb(0_0_0/0.9)]"
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-center gap-4 px-(--gutter)">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Previous page"
          className={ROUND}
        >
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </button>
        <p className="min-w-16 text-center eyebrow text-xs text-muted tabular-nums">
          {index + 1} / {count}
        </p>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === count - 1}
          aria-label="Next page"
          className={ROUND}
        >
          <ChevronRight aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </button>
      </div>
      {portrait && (
        <p className="flex items-center justify-center gap-2 px-(--gutter) text-center text-sm text-muted">
          <RotateCw aria-hidden="true" className="size-4 text-gold" strokeWidth={1.5} />
          Turn your phone sideways for a bigger view
        </p>
      )}
    </div>
  );
}
