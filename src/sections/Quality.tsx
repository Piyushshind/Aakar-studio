import type React from 'react';
import { Container } from '@/components/ui/Container';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Tag } from '@/components/ui/Tag';
import { beforeAfterPairs } from '@/data/beforeAfter';
import { qualityCopy } from '@/data/copy';
import { photoFocus } from '@/data/curation';
import { sectionEyebrows } from '@/data/navigation';
import { themeLabel } from '@/data/themes';
import { getPhotos } from '@/lib/photos';

/**
 * Photo quality, "See the difference" (spec 5, item 5), static form: the -xl photo large with a
 * detail "loupe" showing a close crop. Phase 7 turns this into the pinned zoom. The before/after
 * block appears only when real pairs exist (none yet).
 */
export function Quality() {
  const photo = getPhotos({ kind: 'photo' }).find((p) => p.xlSrc);
  if (!photo) return null;
  const focus = photoFocus[photo.id] ?? '50% 40%';
  const { number, label } = sectionEyebrows.quality;

  return (
    <Section id="quality" aria-labelledby="quality-title" className="quality">
      <Container className="grid items-center gap-16 lg:grid-cols-12 lg:gap-12">
        <div className="relative lg:col-span-8">
          <Reveal variant="photo">
            <ResponsiveImage
              photo={photo}
              xl
              sizes="(min-width: 1440px) 900px, (min-width: 1024px) 62vw, 100vw"
              className="quality-photo"
            />
          </Reveal>
          {/* Detail loupe: the same master, cropped close (decorative). */}
          <Reveal
            as="figure"
            index={2}
            className="quality-loupe absolute right-4 -bottom-10 w-[40%] max-w-72 sm:right-8 lg:-right-10"
          >
            {/* object-position and transform-origin share the focal point, so the zoom lands on the face. */}
            <div
              className="aspect-square overflow-hidden border border-gold/60 bg-surface"
              style={{ '--focus': focus } as React.CSSProperties}
            >
              <ResponsiveImage
                photo={photo}
                xl
                alt=""
                sizes="(min-width: 1024px) 60vw, 100vw"
                objectPosition={focus}
                className="size-full"
                imgClassName="origin-(--focus) scale-[4]"
              />
            </div>
            <figcaption className="mt-3 eyebrow text-[0.6rem] text-muted">Up close</figcaption>
          </Reveal>
        </div>

        <div className="lg:col-span-4 lg:pl-8">
          <SectionHeading
            id="quality-title"
            number={number}
            eyebrow={label}
            title={qualityCopy.title}
            intro={qualityCopy.body}
            className="[&_.section-title]:text-[clamp(2.25rem,4.4vw,4rem)]"
          />
          <Reveal index={2} className="mt-8">
            <Tag className="text-muted">{themeLabel(photo.theme)}</Tag>
          </Reveal>
        </div>
      </Container>

      {beforeAfterPairs.length > 0 && (
        // Phase 8: react-compare-slider with the real pairs.
        <Container className="mt-24" />
      )}
    </Section>
  );
}
