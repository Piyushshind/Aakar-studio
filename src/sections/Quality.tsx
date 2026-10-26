import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Container } from '@/components/ui/Container';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Tag } from '@/components/ui/Tag';
import { beforeAfterPairs } from '@/data/beforeAfter';
import { qualityCopy, qualityStops } from '@/data/copy';
import { photoFocus } from '@/data/curation';
import { sectionEyebrows } from '@/data/navigation';
import { themeLabel } from '@/data/themes';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MOTION_OK_QUERY } from '@/hooks/useReducedMotion';
import { gsap, useGSAP } from '@/lib/gsap';
import { duration, ease } from '@/lib/motion';
import { getPhotos } from '@/lib/photos';

// Loaded only when real before/after pairs exist (none yet).
const BeforeAfter = lazy(() => import('@/components/quality/BeforeAfter'));

// Desktop with motion: the pinned zoom. Mobile and reduced motion: the static "Up close" layout.
const ZOOM_QUERY = `(min-width: 1024px) and ${MOTION_OK_QUERY}`;
/** Scroll distance of the pin: short enough not to feel like a trap. */
const PIN_LENGTH = '+=175%';
const PHOTO_SIZES = '(min-width: 1440px) 900px, (min-width: 1024px) 62vw, 100vw';
// The -xl layer at full zoom: about 2.2x the frame, so a 2x screen gets the 4000px file.
const XL_SIZES = '(min-width: 1440px) 1940px, 135vw';

/**
 * Photo quality, "See the difference" (spec 5 item 5; signature moment 3).
 *
 * Desktop: the section pins and scroll scrubs a zoom into the photo, pausing at three detail
 * stops (qualityStops) with a caption each, then eases back out to the full photo. The -xl master
 * mounts only as the section approaches. Mobile and reduced motion: the static photo with the
 * "Up close" loupe. The before/after block appears only when real pairs exist (none yet).
 */
export function Quality() {
  const photo = getPhotos({ kind: 'photo' }).find((p) => p.xlSrc);
  const root = useRef<HTMLDivElement>(null);
  const zoomable = useMediaQuery(ZOOM_QUERY);
  const [near, setNear] = useState(false);

  // Mount the -xl layer when the section is about a screen away (desktop zoom only).
  useEffect(() => {
    const el = root.current;
    if (!zoomable || !el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), {
      rootMargin: '100% 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [zoomable]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(ZOOM_QUERY, () => {
        const q = gsap.utils.selector(root);
        const [frame] = q('.quality-frame');
        const [zoom] = q('.quality-zoom');
        const captions = q('.quality-caption');
        if (!frame || !zoom) return;
        gsap.set(q('.quality-loupe'), { autoAlpha: 0 });
        gsap.set(zoom, { transformOrigin: '0 0' });
        gsap.set(captions, { autoAlpha: 0, y: 12 });

        // Centre the detail in the frame at this scale, clamped so the photo's edges never show.
        const target = (stop: { x: number; y: number; scale: number }) => ({
          scale: stop.scale,
          x: () => {
            const w = frame.clientWidth;
            return gsap.utils.clamp(w - stop.scale * w, 0, w / 2 - stop.scale * stop.x * w);
          },
          y: () => {
            const h = frame.clientHeight;
            return gsap.utils.clamp(h - stop.scale * h, 0, h / 2 - stop.scale * stop.y * h);
          },
        });

        const tl = gsap.timeline({
          defaults: { ease: ease.inOut },
          scrollTrigger: {
            trigger: root.current,
            start: 'center center',
            end: PIN_LENGTH,
            pin: true,
            scrub: duration.base,
            invalidateOnRefresh: true,
          },
        });
        tl.to({}, { duration: 0.3 }); // a beat on the full photo first
        qualityStops.forEach((stop, i) => {
          tl.to(zoom, { ...target(stop), duration: 1 })
            .to(captions[i], { autoAlpha: 1, y: 0, duration: 0.3, ease: ease.out }, '-=0.35')
            .to({}, { duration: 0.5 }) // hold on the detail
            .to(captions[i], { autoAlpha: 0, y: -8, duration: 0.25 });
        });
        tl.to(zoom, { scale: 1, x: 0, y: 0, duration: 1 }).to({}, { duration: 0.2 });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  if (!photo) return null;
  const focus = photoFocus[photo.id] ?? '50% 40%';
  const { number, label } = sectionEyebrows.quality;

  return (
    <Section id="quality" aria-labelledby="quality-title" className="quality">
      <Container ref={root} className="grid items-center gap-16 lg:grid-cols-12 lg:gap-12">
        <div className="relative lg:col-span-8">
          <Reveal variant="photo">
            <div className="quality-frame relative overflow-clip">
              <div className="quality-zoom">
                <ResponsiveImage photo={photo} sizes={PHOTO_SIZES} className="quality-photo" />
                {zoomable && near && (
                  <ResponsiveImage
                    photo={photo}
                    xl
                    alt=""
                    sizes={XL_SIZES}
                    className="absolute inset-0 size-full"
                  />
                )}
              </div>
              {/* Captions for the zoom stops (desktop zoom only; invisible otherwise). */}
              <ul aria-hidden="true" className="pointer-events-none absolute bottom-6 left-6">
                {qualityStops.map((stop) => (
                  <li
                    key={stop.label}
                    className="quality-caption invisible absolute bottom-0 left-0 w-max rounded-xs border border-gold/40 bg-bg/75 px-4 py-3 opacity-0 backdrop-blur-md"
                  >
                    <span className="block eyebrow text-xs text-gold lg:text-[0.62rem]">
                      {stop.label}
                    </span>
                    <span className="mt-1 block font-display text-lg text-text">{stop.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          {/* Detail loupe: the same master, cropped close (decorative). Static layout only. */}
          <Reveal
            as="figure"
            index={2}
            className="quality-loupe absolute right-4 -bottom-10 w-[40%] max-w-72 sm:right-8 lg:-right-10"
          >
            {/* object-position and transform-origin share the focal point, so the zoom lands on the face. */}
            <div
              className="aspect-square overflow-hidden border border-gold/60 bg-surface"
              style={{ '--focus': focus } as CSSProperties}
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
            <figcaption className="mt-3 eyebrow text-xs text-muted lg:text-[0.6rem]">
              Up close
            </figcaption>
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
        <Container className="mt-24">
          <Suspense fallback={null}>
            <BeforeAfter pairs={beforeAfterPairs} />
          </Suspense>
        </Container>
      )}
    </Section>
  );
}
