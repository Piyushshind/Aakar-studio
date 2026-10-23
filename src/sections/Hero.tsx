import { MessageCircle, Pause, Play } from 'lucide-react';
import { useEffect, useEffectEvent, useRef, useState, type CSSProperties } from 'react';
import { preload } from 'react-dom';
import type { HeroGL } from '@/components/webgl/heroGL';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { HighlightedText } from '@/components/ui/HighlightedText';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Section } from '@/components/ui/Section';
import { hero } from '@/data/copy';
import { heroSlideIds, photoFocus } from '@/data/curation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { FINE_POINTER_QUERY, MOTION_OK_QUERY, useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';
import { getPhotoSources, getPreloadLinks } from '@/lib/images';
import { introDone } from '@/lib/intro';
import { duration, ease, loop, reveal, stagger } from '@/lib/motion';
import { getHeroPhotos, getPhoto } from '@/lib/photos';
import { goTo } from '@/lib/scroll';
import { whatsappLink } from '@/lib/whatsapp';
import type { Photo } from '@/types/content';

const SIZES = '(min-width: 1024px) 62vw, 100vw';
// The WebGL transition: desktop, fine pointer, motion allowed (spec 8.4: none on mobile).
const WEBGL_QUERY = `(min-width: 1024px) and ${FINE_POINTER_QUERY} and ${MOTION_OK_QUERY}`;

const slidePhotos: Photo[] = (() => {
  const picked = heroSlideIds.map(getPhoto).filter((p): p is Photo => p !== undefined);
  return picked.length > 0 ? picked : getHeroPhotos().slice(0, 5);
})();

const focusOf = (photo: Photo): [number, number] => {
  const [x = '50%', y = '50%'] = (photoFocus[photo.id] ?? '').split(' ');
  return [parseFloat(x) / 100, parseFloat(y) / 100];
};

/** Low-power hints: no shader transition there, the CSS crossfade instead. */
function lowPowerDevice() {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  return (
    nav.connection?.saveData === true ||
    (nav.deviceMemory !== undefined && nav.deviceMemory < 4) ||
    (nav.hardwareConcurrency ?? 8) < 4
  );
}

/**
 * Hero (spec 5 item 3; signature moment 2). Split layout: the photo fills the right ~62% on
 * desktop and blends into the page on its left edge; on mobile it sits on top.
 *
 * Photos: a crossfade through `heroSlideIds` every `loop.heroSlide` seconds, with a gentle Ken
 * Burns scale; on capable desktops a WebGL liquid wipe and a faint pointer ripple draw over it
 * (src/components/webgl/heroGL.ts, lazy-loaded after the intro). Pause/play and position dots
 * (WCAG 2.2.2); only the current photo is exposed to screen readers; the next photo mounts one
 * slide ahead. Reduced motion: the first photo only, static.
 *
 * Intro: after the preloader opens (or at once), the headline rises in masked characters, then
 * the tagline, sub-line, CTAs, scroll cue and controls.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const slides = reducedMotion ? slidePhotos.slice(0, 1) : slidePhotos;
  const lead = slidePhotos[0];

  if (lead) {
    const href = getPhotoSources(lead)?.src;
    for (const link of getPreloadLinks(lead, SIZES)) {
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

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ wide: '(min-width: 768px)', motion: MOTION_OK_QUERY }, (ctx) => {
        if (!ctx.conditions?.motion) return;
        const q = gsap.utils.selector(root);
        const split = SplitText.create(q('.hero-title-main'), {
          type: 'chars,lines',
          mask: 'lines',
          linesClass: 'kinetic-line',
          aria: 'none', // the h1 carries a screen-reader copy of the name instead
        });
        const items = q('.hero-intro');
        const distance = ctx.conditions.wide ? reveal.y.desktop : reveal.y.mobile;
        gsap.set(split.chars, { yPercent: 115 });
        gsap.set(items, { autoAlpha: 0, y: distance });
        gsap.set(q('.hero-media'), { scale: 1.06 });

        const intro = gsap
          .timeline({ paused: true, defaults: { ease: ease.expo } })
          .to(
            q('.hero-media'),
            // clearProps: no leftover transform, which would trap the controls in their own
            // stacking layer under the copy.
            { scale: 1, duration: duration.slow * 1.5, ease: ease.out, clearProps: 'transform' },
            0,
          )
          .to(split.chars, { yPercent: 0, duration: duration.slow, stagger: stagger.tight }, 0.1)
          .to(
            items,
            { autoAlpha: 1, y: 0, duration: duration.base, ease: ease.out, stagger: stagger.loose },
            duration.base,
          );
        let alive = true;
        void introDone.then(() => {
          if (alive) intro.play();
        });
        return () => {
          alive = false;
          split.revert();
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <Section
      ref={root}
      id="top"
      spacing="none"
      aria-labelledby="hero-title"
      className="hero isolate flex min-h-svh flex-col overflow-hidden lg:block"
    >
      {lead && <HeroMedia slides={slides} />}

      <Container className="pointer-events-none relative z-10 flex flex-1 flex-col justify-end pb-12 lg:min-h-svh lg:justify-center lg:pt-(--header-offset) lg:pb-28">
        <div className="hero-copy pointer-events-auto max-w-[40rem] lg:max-w-[44%]">
          <h1 id="hero-title" className="hero-title">
            {/* Split into characters for the intro; screen readers read the plain copy. */}
            <span className="sr-only">Aakar</span>
            <span
              aria-hidden="true"
              className="hero-title-main block display text-[clamp(4.75rem,14vw,11.5rem)] leading-[0.82]"
            >
              Aakar
            </span>
            <span className="hero-intro mt-5 flex items-center gap-4 eyebrow text-text/85 lg:mt-7">
              <span aria-hidden="true" className="h-px w-10 bg-gold" />
              Digital Photo Studio
            </span>
          </h1>
          <p className="hero-intro hero-tagline mt-8 max-w-[18ch] display text-[clamp(1.75rem,3.2vw,2.75rem)] leading-[1.08] lg:mt-10">
            <HighlightedText line={hero.tagline} />
          </p>
          <p className="hero-intro hero-subline mt-5 max-w-[44ch] text-body text-pretty text-muted">
            {hero.subLine}
          </p>
          <div className="hero-intro hero-ctas mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">
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
          className="hero-intro pointer-events-auto inline-flex items-center gap-4"
          aria-label="Scroll to the next section"
        >
          <span aria-hidden="true" className="h-px w-12 bg-gold/70" />
          <span className="eyebrow text-xs text-text/70 lg:text-[0.65rem]">Scroll</span>
        </a>
      </Container>
    </Section>
  );
}

/** The photo panel: slides, the optional WebGL layer, blend gradients and the controls. */
function HeroMedia({ slides }: { slides: Photo[] }) {
  const media = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const gl = useRef<HeroGL | null>(null);
  const [current, setCurrent] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  // Slides [0, mounted) are in the DOM: everything shown so far plus the next one, so each photo
  // has loaded by its turn. A dot can jump further ahead; that photo then mounts at once.
  const [furthest, setFurthest] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [focusInside, setFocusInside] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);
  const [glOn, setGlOn] = useState(false);
  const webglCapable = useMediaQuery(WEBGL_QUERY);
  const count = slides.length;
  // The WebGL effect reads the live slide index without re-running.
  const currentRef = useRef(current);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  const auto = count > 1 && playing && inView && tabVisible && !focusInside && introFinished;

  const mounted = Math.min(count, Math.max(furthest, current) + 2);

  const imgAt = (i: number) =>
    media.current?.querySelector<HTMLImageElement>(`[data-slide="${i}"] picture img`) ?? null;
  const loaded = (img: HTMLImageElement | null) => !!img && img.complete && img.naturalWidth > 0;

  useEffect(() => {
    let alive = true;
    void introDone.then(() => alive && setIntroFinished(true));
    return () => {
      alive = false;
    };
  }, []);

  // Pause off-screen and in hidden tabs.
  useEffect(() => {
    const el = media.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(el);
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const show = (next: number) => {
    if (next === current) return;
    const from = current;
    setLeaving(from);
    setCurrent(next);
    setFurthest((f) => Math.max(f, next));
    const g = gl.current;
    const a = imgAt(from);
    const b = imgAt(next);
    if (g && a && b && loaded(a) && loaded(b)) {
      const t = { p: 0 };
      const fromSlide = { img: a, focus: focusOf(slides[from]) };
      const toSlide = { img: b, focus: focusOf(slides[next]) };
      gsap.killTweensOf(t);
      gsap.to(t, {
        p: 1,
        duration: duration.slow * 1.5,
        ease: ease.inOut,
        onUpdate: () => g.draw(fromSlide, toSlide, t.p, performance.now() / 1000),
        onComplete: () => g.draw(toSlide, null, 0, performance.now() / 1000),
      });
    } else if (g && b && loaded(b)) {
      g.draw({ img: b, focus: focusOf(slides[next]) }, null, 0, performance.now() / 1000);
    }
  };

  // Autoplay: advance after loop.heroSlide, once the next photo has loaded. The timer restarts
  // only when the slide or the play state changes; showNext always sees the latest state.
  const showNext = useEffectEvent(() => show((current + 1) % count));
  useEffect(() => {
    if (!auto) return;
    const next = (current + 1) % count;
    let timer = 0;
    let img: HTMLImageElement | null = null;
    const onLoad = () => showNext();
    timer = window.setTimeout(() => {
      img = imgAt(next);
      if (!img || loaded(img)) showNext();
      else img.addEventListener('load', onLoad, { once: true });
    }, loop.heroSlide * 1000);
    return () => {
      window.clearTimeout(timer);
      img?.removeEventListener('load', onLoad);
    };
  }, [auto, current, count]);

  // WebGL layer: desktop only, after the intro, in idle time, off the critical path.
  useEffect(() => {
    if (!webglCapable || count < 2 || lowPowerDevice()) return;
    const el = canvas.current;
    if (!el) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    const ripple = { s: 0 };
    let pointer: [number, number] = [0.5, 0.5];

    const off = () => {
      gl.current?.destroy();
      gl.current = null;
      setGlOn(false);
    };
    const drawCurrent = () => {
      const g = gl.current;
      const img = imgAt(currentRef.current);
      if (g && img && loaded(img)) {
        g.setPointer(pointer[0], pointer[1], ripple.s);
        g.draw(
          { img, focus: focusOf(slides[currentRef.current]) },
          null,
          0,
          performance.now() / 1000,
        );
      }
    };
    const onMove = (e: PointerEvent) => {
      const g = gl.current;
      if (!g || e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      pointer = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
      ripple.s = 1;
      gsap.to(ripple, {
        s: 0,
        duration: duration.slow,
        ease: ease.out,
        overwrite: true,
        onUpdate: drawCurrent,
      });
    };

    void introDone.then(() => {
      const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
      idle(() => {
        if (cancelled) return;
        void import('@/components/webgl/heroGL').then(({ createHeroGL }) => {
          if (cancelled) return;
          const g = createHeroGL(el, off);
          if (!g) return; // no WebGL2: the CSS crossfade simply continues
          gl.current = g;
          const first = imgAt(currentRef.current);
          const start = () => {
            drawCurrent();
            setGlOn(true);
          };
          if (!first) return; // nothing to draw: keep the canvas hidden
          if (loaded(first)) start();
          else first.addEventListener('load', start, { once: true });
          resizeObserver = new ResizeObserver(() => {
            g.resize();
            drawCurrent();
          });
          resizeObserver.observe(el);
          el.parentElement?.addEventListener('pointermove', onMove);
        });
      });
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      el.parentElement?.removeEventListener('pointermove', onMove);
      gsap.killTweensOf(ripple);
      off();
    };
  }, [webglCapable, count, slides]);

  return (
    <div
      ref={media}
      data-gl={glOn ? 'on' : 'off'}
      style={{ '--hero-slide': `${loop.heroSlide}s` } as CSSProperties}
      className="hero-media relative h-[46svh] w-full sm:h-[54svh] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[62%] 2xl:w-[58%]"
    >
      {/* Clipped: the Ken Burns scale must not push a photo past the blend gradients. */}
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured photos"
        className="absolute inset-0 overflow-clip"
        onFocus={() => setFocusInside(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusInside(false);
        }}
      >
        {slides.slice(0, mounted).map((photo, i) => {
          const active = i === current;
          return (
            <div
              key={photo.id}
              data-slide={i}
              data-hero-lead={i === 0 ? '' : undefined}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              className={cn(
                'hero-slide absolute inset-0 transition-opacity duration-(--duration-slow) ease-in-out',
                active ? 'is-active opacity-100' : 'opacity-0',
                i === leaving && !active && 'is-leaving',
              )}
            >
              <div className="hero-kb absolute inset-0">
                <ResponsiveImage
                  photo={photo}
                  priority={i === 0}
                  sizes={SIZES}
                  alt={active ? undefined : ''}
                  className="absolute inset-0 size-full"
                />
              </div>
            </div>
          );
        })}

        {count > 1 && (
          <canvas
            ref={canvas}
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0 size-full transition-opacity duration-(--duration-base)',
              glOn ? 'opacity-100' : 'opacity-0',
            )}
          />
        )}

        {/* The copy layer above lets the pointer through except over the text and buttons, so
            these controls and the WebGL ripple get real mouse events on desktop. */}
        {count > 1 && (
          <div className="hero-intro hero-controls absolute right-4 bottom-4 z-20 flex items-center rounded-full border border-line bg-bg/60 pr-2 pl-0.5 backdrop-blur-md lg:right-[max(var(--gutter),calc((100vw_-_1440px)/2_+_var(--gutter)))] lg:bottom-8">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
              className="flex size-11 items-center justify-center rounded-full text-text hover:text-gold-light"
            >
              {playing ? (
                <Pause aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
              ) : (
                <Play aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
              )}
            </button>
            {slides.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => show(i)}
                aria-label={`Show photo ${i + 1} of ${count}`}
                aria-current={i === current ? 'true' : undefined}
                className="group/dot flex h-11 w-6 items-center justify-center"
              >
                {/* A fixed pill that stretches on X when current (scale and opacity only). */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-1.5 w-4 rounded-full transition-[scale,opacity] duration-(--duration-base)',
                    i === current
                      ? 'scale-x-100 bg-gold opacity-100'
                      : 'scale-x-[0.375] bg-text opacity-40 group-hover/dot:opacity-80',
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Blend the photo into the page: bottom on mobile, left edge on desktop. Outside the
          clipped slide box, and on phones 2px past the photo's bottom edge: the photo layer
          (scaled by the Ken Burns zoom) and the clip can round a fractional edge differently on
          the GPU, which left a one-pixel line of photo flickering under the panel. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -bottom-0.5 bg-[linear-gradient(to_top,var(--color-bg)_0%,var(--color-bg)_2px,rgb(18_16_16/0.6)_22%,transparent_50%)] lg:bottom-0 lg:bg-[linear-gradient(to_right,var(--color-bg)_0%,rgb(18_16_16/0.55)_16%,transparent_42%),linear-gradient(to_top,rgb(18_16_16/0.55)_0%,transparent_30%)]"
      />
      {/* Keeps the transparent header readable over the photo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-bg/70 to-transparent"
      />
    </div>
  );
}
