import { ArrowUpRight } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { bestOfLabel, homeIntro, taglines } from '@/data/copy';
import { bestOf, galleryFilterMode, galleryTabs } from '@/data/gallery';
import { sectionEyebrows } from '@/data/navigation';
import { useDragScroll } from '@/hooks/useDragScroll';
import { MOTION_OK_QUERY } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { duration, ease, transition } from '@/lib/motion';
import { observeReveal } from '@/lib/reveal';
import { getActiveLenis, goTo } from '@/lib/scroll';
import type { Photo } from '@/types/content';

const INITIAL_COUNT = 12;
const GRID_SIZES = '(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw';

// The lightbox and its CSS load on first use; hovering or touching a photo fetches them early.
const loadLightbox = () => import('@/components/gallery/Lightbox');
const Lightbox = lazy(loadLightbox);
const prefetchLightbox = () => void loadLightbox();

type OpenPhoto = (photo: Photo) => void;

/**
 * A gallery photo as a button that opens the lightbox. Hover and keyboard focus zoom the photo
 * slowly inside its frame (the `scale` property, separate from the reveal's transform).
 */
function PhotoButton({
  photo,
  sizes,
  onOpen,
  cursor = 'view',
  className,
}: {
  photo: Photo;
  sizes: string;
  onOpen: OpenPhoto;
  /** Custom cursor label; 'inherit' uses the container's (the Best of strip's "Drag"). */
  cursor?: 'view' | 'inherit';
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={`View photo: ${photo.alt}`}
      aria-haspopup="dialog"
      data-photo-id={photo.id}
      data-cursor={cursor === 'inherit' ? undefined : cursor}
      onClick={() => onOpen(photo)}
      onPointerEnter={prefetchLightbox}
      onTouchStart={prefetchLightbox}
      onFocus={prefetchLightbox}
      className={cn('gallery-item group block w-full overflow-clip', className)}
    >
      <ResponsiveImage
        photo={photo}
        sizes={sizes}
        imgClassName="transition-[opacity,scale] duration-(--duration-slow) ease-out motion-safe:group-hover:scale-[1.04] motion-safe:group-focus-visible:scale-[1.04]"
      />
    </button>
  );
}

/**
 * A grid cell: the photo reveal (data-reveal, observed like <Reveal>) on a Motion item, so filter
 * changes fade leaving photos out, slide the rest to their new places and fade new ones in. The
 * `ref` prop is forwarded too: AnimatePresence measures a leaving item through it.
 */
function GridItem({ ref, children }: { ref?: Ref<HTMLLIElement>; children: ReactNode }) {
  const own = useRef<HTMLLIElement | null>(null);
  useEffect(() => (own.current ? observeReveal(own.current) : undefined), []);

  return (
    <m.li
      ref={(el) => {
        own.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      data-reveal="photo"
      layout="position"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: transition.fast }}
      transition={transition.base}
      className="mb-3 break-inside-avoid sm:mb-4"
    >
      {children}
    </m.li>
  );
}

/**
 * Gallery (spec 5, item 6): category (or theme) filter tabs, a masonry grid that keeps portrait
 * and landscape photos at their own ratio, "View more", then the "Best of" strip. Filter changes
 * animate with Motion layout animations (the gold underline slides to the active tab); any photo
 * opens the lightbox, stepping through the current tab (or the Best of photos).
 */
export function Gallery() {
  const [tabId, setTabId] = useState('all');
  const [expanded, setExpanded] = useState(false);
  const [viewer, setViewer] = useState<{ photos: Photo[]; index: number } | null>(null);
  const tab = galleryTabs.find((t) => t.id === tabId) ?? galleryTabs[0];
  const visible = expanded ? tab.photos : tab.photos.slice(0, INITIAL_COUNT);
  const { number, label } = sectionEyebrows.work;

  const openIn =
    (photos: Photo[]): OpenPhoto =>
    (photo) =>
      setViewer({ photos, index: Math.max(0, photos.indexOf(photo)) });

  return (
    <Section id="work" tone="surface" aria-labelledby="work-title" className="gallery">
      <Container>
        <SectionHeading
          id="work-title"
          number={number}
          eyebrow={label}
          title={taglines.gallery}
          intro={homeIntro}
          layout="split"
        />

        {/* Phones: the tab row scrolls; its right edge fades to say so. */}
        <Reveal className="-mx-(--gutter) mt-14 scrollbar-thin overflow-x-auto [mask-image:linear-gradient(to_right,#000_calc(100%-3rem),transparent)] px-(--gutter) pr-12 lg:[mask-image:none] lg:pr-(--gutter)">
          {/* The group label sits on a wrapper: role="group" on the <ul> itself would stop its
              <li>s from being list items (axe: listitem). */}
          <div
            role="group"
            aria-label={galleryFilterMode === 'theme' ? 'Filter by theme' : 'Filter by category'}
          >
            <ul className="gallery-filters flex w-max gap-x-7 border-b border-line lg:w-full lg:flex-wrap">
              {galleryTabs.map((t) => {
                const active = t.id === tab.id;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setTabId(t.id);
                        setExpanded(false);
                      }}
                      className={cn(
                        'relative flex items-baseline gap-1.5 py-4 eyebrow text-xs whitespace-nowrap lg:text-[0.68rem]',
                        active ? 'text-text' : 'text-muted hover:text-text',
                      )}
                    >
                      {t.label}
                      <span className="text-xs tracking-normal text-muted/80 lg:text-[0.6rem]">
                        {t.photos.length}
                      </span>
                      {active && (
                        <m.span
                          layoutId="gallery-tab"
                          aria-hidden="true"
                          transition={transition.base}
                          className="absolute inset-x-0 -bottom-px h-px bg-gold"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>

        {/* relative: a leaving photo is taken out of the flow (popLayout) and placed absolutely
            here while it fades, so the others can already move into the gap. */}
        <ul className="gallery-grid relative mt-10 columns-2 gap-3 sm:gap-4 md:columns-3 xl:columns-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((photo) => (
              <GridItem key={photo.id}>
                <PhotoButton photo={photo} sizes={GRID_SIZES} onOpen={openIn(tab.photos)} />
              </GridItem>
            ))}
          </AnimatePresence>
        </ul>

        {!expanded && tab.photos.length > INITIAL_COUNT && (
          <Reveal className="mt-12 flex justify-center">
            <Button variant="secondary" size="lg" onClick={() => setExpanded(true)}>
              View more · {tab.photos.length - INITIAL_COUNT}
            </Button>
          </Reveal>
        )}
      </Container>

      {bestOf.length > 0 && <BestOfStrip onOpen={openIn(bestOf)} />}

      {viewer && (
        <Suspense fallback={null}>
          <Lightbox photos={viewer.photos} index={viewer.index} onClose={() => setViewer(null)} />
        </Suspense>
      )}
    </Section>
  );
}

// Desktop with motion: the pinned horizontal strip. Mobile and reduced motion: native swipe.
const PIN_QUERY = `(min-width: 1024px) and ${MOTION_OK_QUERY}`;
/** Skew from scroll velocity: px/s per degree, and the clamp in degrees. */
const SKEW_VELOCITY = 400;
const MAX_SKEW = 3;
/** Page scroll per pixel of horizontal travel: under 1, so twelve photos don't become a scroll
 * trap (about 4 screens instead of 7.5 at 1440). */
const SCROLL_PER_PX = 0.6;
/** Each photo drifts this far (percent of its width) inside its frame across the strip. */
const DRIFT = 6;
const ITEM_HEIGHT = 'h-[clamp(320px,62svh,680px)]';

/**
 * "Best of" (spec 5 item 6; signature moment 4).
 *
 * Desktop: the block pins and vertical scroll moves the rail sideways through the featured photos,
 * each drifting slightly inside its frame, with a light skew from scroll speed that settles to
 * zero. It ends on a "See all work" card that returns to the gallery. Focusing a photo or pressing
 * the arrow keys scrolls the page to it, so the focused item is always on screen. Mouse drag
 * scrolls the page through the pin (useDragScroll), scaled by SCROLL_PER_PX so the rail still
 * moves one-to-one under the pointer.
 * Mobile and reduced motion: the native horizontal row with snap points.
 */
function BestOfStrip({ onOpen }: { onOpen: OpenPhoto }) {
  const root = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const pinned = useRef<ScrollTrigger | null>(null);
  useDragScroll(strip, pinned, SCROLL_PER_PX);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(PIN_QUERY, () => {
        const track = strip.current;
        const rail = track?.querySelector<HTMLElement>('.best-of-rail');
        if (!track || !rail) return;
        track.dataset.pinned = 'true';
        track.scrollLeft = 0;

        const visibleWidth = () => {
          const cs = getComputedStyle(track);
          return track.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        };
        const travel = () => Math.max(0, rail.scrollWidth - visibleWidth());

        const skewTo = gsap.quickTo(rail, 'skewX', { duration: duration.base, ease: ease.out });
        const move = gsap.to(rail, {
          x: () => -travel(),
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'center center',
            end: () => `+=${travel() * SCROLL_PER_PX}`,
            pin: true,
            scrub: duration.fast,
            invalidateOnRefresh: true,
            onUpdate: (self) =>
              skewTo(gsap.utils.clamp(-MAX_SKEW, MAX_SKEW, -self.getVelocity() / SKEW_VELOCITY)),
          },
        });
        pinned.current = move.scrollTrigger ?? null;
        const settle = () => skewTo(0);
        ScrollTrigger.addEventListener('scrollEnd', settle);

        // Each photo drifts inside its frame as it crosses the screen.
        for (const item of gsap.utils.toArray<HTMLElement>('.best-of-photo', rail)) {
          const img = item.querySelector('picture img');
          if (!img) continue;
          gsap.fromTo(
            img,
            { xPercent: -DRIFT, scale: 1 + (DRIFT * 2.5) / 100 },
            {
              xPercent: DRIFT,
              ease: 'none',
              scrollTrigger: {
                containerAnimation: move,
                trigger: item,
                start: 'left right',
                end: 'right left',
                scrub: true,
              },
            },
          );
        }

        // Keyboard: keep the focused photo on screen, and let the arrow keys step through.
        const scrollToX = (x: number) => {
          const st = pinned.current;
          if (!st) return;
          const p = gsap.utils.clamp(0, 1, x / Math.max(1, travel()));
          const y = st.start + p * (st.end - st.start);
          const lenis = getActiveLenis();
          if (lenis) lenis.scrollTo(y);
          else window.scrollTo({ top: y });
        };
        const onFocusIn = (event: FocusEvent) => {
          const item = (event.target as Element).closest<HTMLElement>('.best-of-item');
          if (item) scrollToX(item.offsetLeft - (visibleWidth() - item.offsetWidth) / 2);
        };
        const onKey = (event: KeyboardEvent) => {
          if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
          const first = rail.querySelector<HTMLElement>('.best-of-item');
          if (!pinned.current || !first) return;
          event.preventDefault();
          const now = -Number(gsap.getProperty(rail, 'x'));
          scrollToX(now + first.offsetWidth * (event.key === 'ArrowRight' ? 1 : -1));
        };
        track.addEventListener('focusin', onFocusIn);
        track.addEventListener('keydown', onKey);

        return () => {
          ScrollTrigger.removeEventListener('scrollEnd', settle);
          track.removeEventListener('focusin', onFocusIn);
          track.removeEventListener('keydown', onKey);
          delete track.dataset.pinned;
          pinned.current = null;
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="best-of mt-(--section-space)">
      <Reveal as={Container} className="flex items-end justify-between gap-6">
        <h3 id="best-of-title" className="eyebrow text-gold">
          {bestOfLabel}
        </h3>
        <p aria-hidden="true" className="eyebrow text-xs text-muted lg:text-[0.65rem]">
          Scroll →
        </p>
      </Reveal>
      <div
        ref={strip}
        role="region"
        aria-labelledby="best-of-title"
        tabIndex={0}
        data-cursor="drag"
        className="best-of-track mt-6 flex snap-x snap-mandatory scroll-pl-[max(var(--gutter),calc((100%_-_1440px)/2_+_var(--gutter)))] scrollbar-thin overflow-x-auto pr-(--gutter) pb-5 pl-[max(var(--gutter),calc((100%_-_1440px)/2_+_var(--gutter)))] data-pinned:snap-none data-pinned:overflow-x-clip"
      >
        <div className="best-of-rail relative flex w-max gap-3 sm:gap-4">
          {bestOf.map((photo) => (
            <PhotoButton
              key={photo.id}
              photo={photo}
              sizes="(min-width: 1024px) 45vw, 85vw"
              onOpen={onOpen}
              cursor="inherit"
              className={`best-of-item best-of-photo ${ITEM_HEIGHT} w-auto shrink-0 snap-start [&>div]:h-full [&>div]:w-auto`}
            />
          ))}
          <a
            href="#work"
            onClick={goTo('work')}
            className={`best-of-item group/more ${ITEM_HEIGHT} flex w-[clamp(240px,22vw,340px)] shrink-0 snap-start flex-col justify-between border border-gold/30 p-8 hover:border-gold/70`}
          >
            <span className="eyebrow text-xs text-gold lg:text-[0.65rem]">{bestOfLabel}</span>
            <span>
              <span className="block display text-[clamp(2rem,3vw,2.75rem)]">See all work</span>
              <ArrowUpRight
                aria-hidden="true"
                strokeWidth={1.25}
                className="mt-6 size-8 text-gold transition-[translate] duration-(--duration-base) group-hover/more:translate-x-1 group-hover/more:-translate-y-1"
              />
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
