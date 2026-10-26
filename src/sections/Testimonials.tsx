import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { studio } from '@/data/studio';
import { testimonials } from '@/data/testimonials';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import { loop } from '@/lib/motion';
import type { Testimonial } from '@/types/content';

const CONTROL =
  'flex size-11 items-center justify-center rounded-full border border-line text-text hover:border-gold/60 hover:text-gold-light disabled:pointer-events-none disabled:opacity-30';

function Review({ review, index, count }: { review: Testimonial; index: number; count: number }) {
  return (
    <figure
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${count}`}
      className="flex h-full flex-col border-t border-gold/40 pt-8"
    >
      {review.rating !== undefined && (
        <p className="mb-5 flex gap-1 text-gold">
          <span className="sr-only">Rated {review.rating} out of 5</span>
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              aria-hidden="true"
              strokeWidth={1.5}
              className={cn('size-4', i < (review.rating ?? 0) && 'fill-current')}
            />
          ))}
        </p>
      )}
      <blockquote className="font-display text-xl leading-snug text-pretty">
        “{review.quote}”
      </blockquote>
      <figcaption className="mt-auto pt-6">
        <span className="block text-text">{review.name}</span>
        <span className="mt-1 block eyebrow text-xs text-muted lg:text-[0.62rem]">
          {review.event}
        </span>
        {review.sourceUrl && (
          <a
            href={review.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="link-draw mt-3 inline-block text-sm text-muted hover:text-text"
          >
            Read the review<span className="sr-only"> by {review.name} (opens in a new tab)</span>
          </a>
        )}
      </figcaption>
    </figure>
  );
}

/**
 * Testimonials (spec 5, item 14): real client reviews in an Embla slider, one per view on phones,
 * two on tablets, three on desktop. Autoplay (not with reduced motion) pauses on hover and focus
 * and has its own pause button; previous / next are always visible. Renders nothing at all, not
 * even a heading, while there are no reviews.
 */
export function Testimonials() {
  if (testimonials.length === 0) return null;
  return <TestimonialSlider />;
}

function TestimonialSlider() {
  const reducedMotion = useReducedMotion();
  const [viewport, api] = useEmblaCarousel({ align: 'start', loop: testimonials.length > 3 }, [
    Autoplay({
      delay: loop.heroSlide * 1000,
      playOnInit: !reducedMotion,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      stopOnFocusIn: true,
    }),
  ]);
  const [playing, setPlaying] = useState(!reducedMotion);
  // Re-render on every slide change and re-init, then read the arrows' state from the API.
  const [, setRevision] = useState(0);
  const canPrev = api?.canScrollPrev() ?? false;
  const canNext = api?.canScrollNext() ?? testimonials.length > 1;

  useEffect(() => {
    if (!api) return;
    const bump = () => setRevision((r) => r + 1);
    api.on('select', bump).on('reInit', bump);
    return () => {
      api.off('select', bump).off('reInit', bump);
    };
  }, [api]);

  const togglePlay = () => {
    const autoplay = api?.plugins().autoplay;
    if (!autoplay) return;
    if (playing) autoplay.stop();
    else autoplay.play();
    setPlaying(!playing);
  };

  return (
    <Section id="testimonials" aria-labelledby="testimonials-title" className="testimonials">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading id="testimonials-title" eyebrow="Kind words" title="What families say." />
          <Reveal className="flex items-center gap-3">
            {!reducedMotion && (
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? 'Pause reviews' : 'Play reviews'}
                className={CONTROL}
              >
                {playing ? (
                  <Pause aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
                ) : (
                  <Play aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => api?.scrollPrev()}
              disabled={!canPrev}
              aria-label="Previous review"
              className={CONTROL}
            >
              <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => api?.scrollNext()}
              disabled={!canNext}
              aria-label="Next review"
              className={CONTROL}
            >
              <ChevronRight aria-hidden="true" className="size-5" strokeWidth={1.5} />
            </button>
          </Reveal>
        </div>

        <Reveal
          role="region"
          aria-roledescription="carousel"
          aria-label="Client reviews"
          className="mt-14 overflow-clip lg:mt-16"
        >
          <div ref={viewport} data-cursor="drag">
            <ul className="-ml-8 flex touch-pan-y">
              {testimonials.map((review, i) => (
                <li
                  key={review.id}
                  className="min-w-0 shrink-0 grow-0 basis-full pl-8 md:basis-1/2 lg:basis-1/3"
                >
                  <Review review={review} index={i} count={testimonials.length} />
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal className="mt-12">
          <a
            href={studio.mapLink}
            target="_blank"
            rel="noreferrer"
            className="group link-draw inline-flex items-center gap-2 text-text hover:text-gold-light"
          >
            Read our Google reviews
            <ArrowUpRight
              aria-hidden="true"
              strokeWidth={1.5}
              className="size-4 text-gold transition-[translate] duration-(--duration-base) group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Reveal>
      </Container>
    </Section>
  );
}
