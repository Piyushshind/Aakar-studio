import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { bestOfLabel, homeIntro, taglines } from '@/data/copy';
import { bestOf, galleryFilterMode, galleryTabs } from '@/data/gallery';
import { useDragScroll } from '@/hooks/useDragScroll';
import { sectionEyebrows } from '@/data/navigation';
import { cn } from '@/lib/cn';
import type { Photo } from '@/types/content';

const INITIAL_COUNT = 12;
const GRID_SIZES = '(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw';

/**
 * A gallery photo as a button, ready for the Phase 8 lightbox. Hover and keyboard focus zoom the
 * photo slowly inside its frame (the `scale` property, separate from the reveal's transform).
 */
function PhotoButton({
  photo,
  sizes,
  cursor = 'view',
  className,
}: {
  photo: Photo;
  sizes: string;
  /** Custom cursor label; 'inherit' uses the container's (the Best of strip's "Drag"). */
  cursor?: 'view' | 'inherit';
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={`View photo: ${photo.alt}`}
      data-cursor={cursor === 'inherit' ? undefined : cursor}
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
 * Gallery (spec 5, item 6), static: theme (or category) filter tabs, a masonry grid that keeps
 * portrait and landscape photos at their own ratio, "View more", then the "Best of" strip
 * (native horizontal scroll; GSAP pinning comes in Phase 7). Filtering is plain state for now;
 * Motion layout animations come in Phase 8.
 */
export function Gallery() {
  const [tabId, setTabId] = useState('all');
  const [expanded, setExpanded] = useState(false);
  const tab = galleryTabs.find((t) => t.id === tabId) ?? galleryTabs[0];
  const visible = expanded ? tab.photos : tab.photos.slice(0, INITIAL_COUNT);
  const { number, label } = sectionEyebrows.work;
  const strip = useRef<HTMLDivElement>(null);
  useDragScroll(strip);

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

        <Reveal className="-mx-(--gutter) mt-14 scrollbar-thin overflow-x-auto px-(--gutter)">
          <ul
            role="group"
            aria-label={galleryFilterMode === 'theme' ? 'Filter by theme' : 'Filter by category'}
            className="gallery-filters flex w-max gap-x-7 border-b border-line lg:w-full lg:flex-wrap"
          >
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
                      '-mb-px flex items-baseline gap-1.5 border-b py-4 eyebrow text-[0.68rem] whitespace-nowrap',
                      active
                        ? 'border-gold text-text'
                        : 'border-transparent text-muted hover:text-text',
                    )}
                  >
                    {t.label}
                    <span className="text-[0.6rem] tracking-normal text-muted/80">
                      {t.photos.length}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <ul className="gallery-grid mt-10 columns-2 gap-3 sm:gap-4 md:columns-3 xl:columns-4">
          {visible.map((photo) => (
            <Reveal
              as="li"
              variant="photo"
              key={photo.id}
              className="mb-3 break-inside-avoid sm:mb-4"
            >
              <PhotoButton photo={photo} sizes={GRID_SIZES} />
            </Reveal>
          ))}
        </ul>

        {!expanded && tab.photos.length > INITIAL_COUNT && (
          <Reveal className="mt-12 flex justify-center">
            <Button variant="secondary" size="lg" onClick={() => setExpanded(true)}>
              View more · {tab.photos.length - INITIAL_COUNT}
            </Button>
          </Reveal>
        )}
      </Container>

      {bestOf.length > 0 && (
        <div className="best-of mt-(--section-space)">
          <Reveal as={Container} className="flex items-end justify-between gap-6">
            <h3 id="best-of-title" className="eyebrow text-gold">
              {bestOfLabel}
            </h3>
            <p aria-hidden="true" className="eyebrow text-[0.65rem] text-muted">
              Scroll →
            </p>
          </Reveal>
          <div
            ref={strip}
            role="region"
            aria-labelledby="best-of-title"
            tabIndex={0}
            data-cursor="drag"
            className="best-of-track mt-6 flex snap-x snap-mandatory scroll-pl-[max(var(--gutter),calc((100%_-_1440px)/2_+_var(--gutter)))] scrollbar-thin gap-3 overflow-x-auto pr-(--gutter) pb-5 pl-[max(var(--gutter),calc((100%_-_1440px)/2_+_var(--gutter)))] sm:gap-4"
          >
            {bestOf.map((photo) => (
              <PhotoButton
                key={photo.id}
                photo={photo}
                sizes="(min-width: 1024px) 45vw, 85vw"
                cursor="inherit"
                className="h-[clamp(320px,62svh,680px)] w-auto shrink-0 snap-start [&>div]:h-full [&>div]:w-auto"
              />
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
