import { MessageCircle } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { babyBandCta, babyTrustPoints, taglines } from '@/data/copy';
import { sectionEyebrows } from '@/data/navigation';
import { getPhoto } from '@/lib/photos';
import { whatsappLink } from '@/lib/whatsapp';
import type { Photo } from '@/types/content';

// Soft photos (spec 5, item 7): the studio's newborn photo plus soft baby-kids shoots. Tall
// portrait left, two landscapes stacked right.
const TALL_ID = 'baby-kids-teddy-theme-01';
const STACK_IDS = ['newborn-studio-01', 'baby-kids-pink-winter-02'];

/**
 * "Tiny Fingers, Big Memories" (spec 5, item 7): the cream section between the dark ones, with
 * brown text, blush accents, the four trust points (17.7) and the WhatsApp CTA.
 */
export function BabyBand() {
  const tall = getPhoto(TALL_ID);
  const stack = STACK_IDS.map(getPhoto).filter((p): p is Photo => p !== undefined);
  const { number, label } = sectionEyebrows.littleOnes;
  const hasPhotos = Boolean(tall) || stack.length > 0;

  return (
    <Section
      id="little-ones"
      tone="cream"
      aria-labelledby="little-ones-title"
      className="baby-band"
    >
      <Container className="grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading
            id="little-ones-title"
            number={number}
            eyebrow={label}
            title={taglines.babyBand}
            tone="cream"
          />
          <ul className="mt-10 space-y-5">
            {babyTrustPoints.map((point) => (
              <Reveal as="li" key={point} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="mt-[0.6em] size-2 shrink-0 rounded-full bg-blush"
                />
                <span className="max-w-[48ch] text-body text-brown">{point}</span>
              </Reveal>
            ))}
          </ul>
          <Reveal className="mt-11">
            <Button
              href={whatsappLink(babyBandCta.whatsappMessage)}
              tone="cream"
              size="lg"
              icon={<MessageCircle />}
            >
              {babyBandCta.label}
            </Button>
          </Reveal>
        </div>

        {hasPhotos && (
          <div className="baby-band-photos grid grid-cols-2 items-start gap-3 sm:gap-4 lg:col-span-7">
            {/* Gentle parallax (desktop): the two columns drift at different speeds. */}
            {tall && (
              <div data-parallax style={{ '--parallax': 'var(--parallax-soft)' } as CSSProperties}>
                <Reveal variant="photo">
                  <ResponsiveImage
                    photo={tall}
                    sizes="(min-width: 1024px) 28vw, 50vw"
                    className="baby-band-photo"
                  />
                </Reveal>
              </div>
            )}
            <div
              data-parallax
              style={{ '--parallax': 'var(--parallax-strong)' } as CSSProperties}
              className="grid gap-3 sm:gap-4"
            >
              {stack.map((photo, i) => (
                <Reveal key={photo.id} variant="photo" index={i + 1}>
                  <ResponsiveImage
                    photo={photo}
                    sizes="(min-width: 1024px) 28vw, 50vw"
                    className="baby-band-photo"
                  />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </Container>
    </Section>
  );
}
