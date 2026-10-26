import type { CSSProperties } from 'react';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { aboutOffer, aboutParagraphs, sectionTitles } from '@/data/copy';
import { sectionEyebrows } from '@/data/navigation';
import { studio } from '@/data/studio';
import { getPhotos } from '@/lib/photos';
import type { Photo } from '@/types/content';

/** Owner, studio and behind-the-scenes photos once the `about` category has any (spec 7.3). */
function AboutPhotos({ photos }: { photos: Photo[] }) {
  const [lead, ...rest] = photos;
  return (
    <div className="about-photos grid grid-cols-2 gap-3 sm:gap-4">
      <Reveal variant="photo" className="col-span-2">
        <ResponsiveImage photo={lead} ratio="4 / 5" sizes="(min-width: 1024px) 38vw, 100vw" />
      </Reveal>
      {rest.slice(0, 2).map((photo, i) => (
        <Reveal key={photo.id} variant="photo" index={i}>
          <ResponsiveImage photo={photo} ratio="1 / 1" sizes="(min-width: 1024px) 19vw, 50vw" />
        </Reveal>
      ))}
    </div>
  );
}

/** Until then: the logo mark in a quiet framed panel, so the layout never looks empty. */
function AboutMark() {
  return (
    <Reveal
      variant="fade"
      className="about-mark relative flex aspect-square items-center justify-center border border-gold/25 bg-bg/40 sm:aspect-[4/3] lg:aspect-[4/5]"
    >
      <div aria-hidden="true" className="absolute inset-3 border border-line sm:inset-4" />
      {/* Gentle parallax (desktop): the mark drifts inside its still frame. */}
      <div aria-hidden="true" data-parallax className="w-[42%] max-w-56">
        <Logo variant="mark" tone="light" className="w-full" />
      </div>
      <p className="absolute inset-x-0 bottom-8 text-center eyebrow text-xs text-muted sm:bottom-10 lg:text-[0.62rem]">
        {studio.subTagline} · {studio.address.locality}
        {studio.foundedYear && <> · Since {studio.foundedYear}</>}
      </p>
    </Reveal>
  );
}

/** About (spec 5, item 13; copy 17.5). Stats only with real numbers (years since 2003). */
export function About() {
  const photos = getPhotos({ category: 'about', kind: 'photo' });
  const [lead, ...paragraphs] = aboutParagraphs;
  const { number, label } = sectionEyebrows.about;

  return (
    <Section id="about" tone="surface" aria-labelledby="about-title" className="about">
      <Container className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--header-offset)+2rem)]">
            {photos.length > 0 ? <AboutPhotos photos={photos} /> : <AboutMark />}
          </div>
        </div>

        <div className="lg:col-span-7 lg:pt-4">
          <SectionHeading
            id="about-title"
            number={number}
            eyebrow={label}
            title={sectionTitles.about}
          />
          <Reveal
            as="p"
            className="mt-10 max-w-[34ch] font-display text-[clamp(1.25rem,2.2vw,1.875rem)] leading-snug text-pretty text-text/95"
          >
            {lead}
          </Reveal>
          {paragraphs.map((text) => (
            <Reveal
              as="p"
              key={text}
              className="mt-6 max-w-[60ch] text-body text-pretty text-muted"
            >
              {text}
            </Reveal>
          ))}

          <Reveal as="p" className="mt-10 flex items-center gap-4">
            <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
            <span>
              <span className="block font-display text-xl text-text italic">{studio.owner}</span>
              <span className="mt-1 block eyebrow text-xs text-muted lg:text-[0.62rem]">
                Owner, {studio.name}
              </span>
            </span>
          </Reveal>

          <Reveal as="h3" className="mt-16 eyebrow text-gold lg:mt-20">
            What we offer
          </Reveal>
          <ul className="mt-6 grid gap-x-10 sm:grid-cols-2">
            {aboutOffer.map((item, i) => (
              <Reveal
                as="li"
                key={item.title}
                style={{ '--i': i % 2 } as CSSProperties}
                className="border-t border-line py-6 sm:[--reveal-i:var(--i)]"
              >
                <p className="font-display text-xl text-text">{item.title}</p>
                <p className="mt-2 text-pretty text-muted">{item.text}</p>
              </Reveal>
            ))}
          </ul>

          {studio.stats.length > 0 && (
            <dl className="about-stats mt-12 grid grid-cols-2 gap-8 sm:grid-cols-3">
              {studio.stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="eyebrow text-xs text-muted lg:text-[0.62rem]">{stat.label}</dt>
                  <dd className="mt-2 display text-5xl text-gold">
                    {stat.value}
                    {stat.suffix}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </Container>
    </Section>
  );
}
