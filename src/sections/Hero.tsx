import { MessageCircle } from 'lucide-react';
import { preload } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { HighlightedText } from '@/components/ui/HighlightedText';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Section } from '@/components/ui/Section';
import { hero } from '@/data/copy';
import { heroLeadPhotoId } from '@/data/curation';
import { cn } from '@/lib/cn';
import { getPhotoSources, getPreloadLinks } from '@/lib/images';
import { getHeroPhotos, getPhoto } from '@/lib/photos';
import { goTo } from '@/lib/scroll';
import { whatsappLink } from '@/lib/whatsapp';

type HeroLayout = 'split' | 'full';

/** Dev only: `?hero=full` shows the full-bleed alternative for comparison. */
function heroLayout(): HeroLayout {
  if (!import.meta.env.DEV || typeof window === 'undefined') return 'split';
  return new URLSearchParams(window.location.search).get('hero') === 'full' ? 'full' : 'split';
}

const SIZES: Record<HeroLayout, string> = {
  split: '(min-width: 1024px) 62vw, 100vw',
  full: '100vw',
};

/**
 * Hero (spec 5, item 3), static. Split layout: the photo fills the right ~62% on desktop and
 * blends into the dark page on its left edge, so the headline sits on calm dark space and never on
 * the busy set or the child's face. On mobile the photo sits on top and fades into the text.
 * The crossfade between hero photos and the kinetic headline come in Phase 7.
 */
export function Hero() {
  const layout = heroLayout();
  const photo = getPhoto(heroLeadPhotoId) ?? getHeroPhotos()[0];
  const sizes = SIZES[layout];

  if (photo) {
    const href = getPhotoSources(photo)?.src;
    for (const link of getPreloadLinks(photo, sizes)) {
      if (href) {
        preload(href, {
          as: 'image',
          type: link.type,
          imageSrcSet: link.imageSrcSet,
          imageSizes: link.imageSizes,
          fetchPriority: 'high',
        });
      }
    }
  }

  const full = layout === 'full';

  return (
    <Section
      id="top"
      spacing="none"
      aria-labelledby="hero-title"
      data-layout={layout}
      className="hero isolate flex min-h-svh flex-col overflow-hidden lg:block"
    >
      {photo && (
        <div
          className={cn(
            'hero-media relative w-full',
            full
              ? 'absolute inset-0'
              : 'h-[46svh] sm:h-[54svh] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[62%] 2xl:w-[58%]',
          )}
        >
          <ResponsiveImage
            photo={photo}
            priority
            sizes={sizes}
            className="absolute inset-0 size-full"
          />
          {/* Blend the photo into the page: bottom on mobile, left edge on desktop. */}
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0',
              full
                ? 'bg-[linear-gradient(to_top,var(--color-bg)_0%,rgb(18_16_16/0.75)_35%,rgb(18_16_16/0.15)_70%),linear-gradient(to_right,rgb(18_16_16/0.85)_0%,transparent_55%)]'
                : 'bg-[linear-gradient(to_top,var(--color-bg)_0%,rgb(18_16_16/0.6)_22%,transparent_50%)] lg:bg-[linear-gradient(to_right,var(--color-bg)_0%,rgb(18_16_16/0.55)_16%,transparent_42%),linear-gradient(to_top,rgb(18_16_16/0.55)_0%,transparent_30%)]',
            )}
          />
          {/* Keeps the transparent header readable over the photo. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-bg/70 to-transparent"
          />
        </div>
      )}

      <Container
        className={cn(
          'relative z-10 flex flex-1 flex-col justify-end pb-12',
          'lg:min-h-svh lg:justify-center lg:pt-(--header-offset) lg:pb-28',
          full && 'min-h-svh pt-(--header-offset)',
        )}
      >
        <div className="hero-copy max-w-[40rem] lg:max-w-[44%]">
          <h1 id="hero-title" className="hero-title">
            <span className="block display text-[clamp(4.75rem,14vw,11.5rem)] leading-[0.82]">
              Aakar
            </span>
            <span className="mt-5 flex items-center gap-4 eyebrow text-text/85 lg:mt-7">
              <span aria-hidden="true" className="h-px w-10 bg-gold" />
              Digital Photo Studio
            </span>
          </h1>
          <p className="hero-tagline mt-8 max-w-[18ch] display text-[clamp(1.75rem,3.2vw,2.75rem)] leading-[1.08] lg:mt-10">
            <HighlightedText line={hero.tagline} />
          </p>
          <p className="hero-subline mt-5 max-w-[44ch] text-body text-pretty text-muted">
            {hero.subLine}
          </p>
          <div className="hero-ctas mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">
            <Button href={whatsappLink(hero.whatsappMessage)} size="lg" icon={<MessageCircle />}>
              {hero.ctaWhatsapp}
            </Button>
            <Button href="#work" onClick={goTo('work')} variant="secondary" size="lg">
              {hero.ctaWork}
            </Button>
          </div>
        </div>
      </Container>

      {/* Aligned to the content container, not the viewport edge. */}
      <Container className="hero-scroll pointer-events-none absolute inset-x-0 bottom-8 z-10 hidden lg:block">
        <a
          href="#quality"
          onClick={goTo('quality')}
          className="pointer-events-auto inline-flex items-center gap-4"
          aria-label="Scroll to the next section"
        >
          <span aria-hidden="true" className="h-px w-12 bg-gold/70" />
          <span className="eyebrow text-[0.65rem] text-text/70">Scroll</span>
        </a>
      </Container>
    </Section>
  );
}
