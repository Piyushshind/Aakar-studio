import { useLayoutEffect, useRef, useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { INTRO_SESSION_KEY, introWillPlay, markIntroDone } from '@/lib/intro';
import { gsap, useGSAP } from '@/lib/gsap';
import { duration, ease, preloader, stagger } from '@/lib/motion';
import { getActiveLenis } from '@/lib/scroll';

/**
 * Logo preloader (spec 5 item 1; signature moment 1). Plays only when index.html set html.intro:
 * JS running, motion allowed, first visit this session. Never in no-JS or pre-rendered HTML.
 *
 * The mark draws in (camera outline, then the gold A), the lens rim turns once like an
 * aperture, and the overlay opens from the lens to reveal the hero. It opens once the hero image
 * has loaded and `preloader.min` has passed, and by `preloader.max` whatever happens, so the whole
 * thing stays under 2 s. The hero image loads underneath in parallel (its request is never
 * delayed). Scroll and focus are locked while it plays; the overlay is aria-hidden.
 */
export function Preloader() {
  // A slow start (e.g. a slow phone) skips it: the page has waited long enough already.
  // In dev, ?intro replays it even though the dev server mounts slowly.
  const [active, setActive] = useState(
    () =>
      introWillPlay &&
      (performance.now() < preloader.lateMount * 1000 ||
        (import.meta.env.DEV && /[?&]intro/.test(window.location.search))),
  );
  useLayoutEffect(() => {
    if (active || !introWillPlay) return;
    document.documentElement.classList.remove('intro');
    markIntroDone();
  }, [active]);
  return active ? <Overlay onDone={() => setActive(false)} /> : null;
}

/** Overlay with a circular hole of radius r around (cx, cy): even-odd path, so it can open. */
const aperture = (w: number, h: number, cx: number, cy: number, r: number) =>
  `path(evenodd, "M0 0H${w}V${h}H0Z M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z")`;

function heroImageReady(): Promise<void> {
  const img = document.querySelector<HTMLImageElement>('.hero-media [data-hero-lead] picture img');
  if (!img || (img.complete && img.naturalWidth > 0)) return Promise.resolve();
  return new Promise((resolve) => {
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
  });
}

function Overlay({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const overlay = root.current;
      if (!overlay) return;
      const html = document.documentElement;
      try {
        sessionStorage.setItem(INTRO_SESSION_KEY, '1');
      } catch {
        // Storage blocked: it just plays again next time.
      }
      // This overlay now covers the page, so the CSS cover from index.html can go.
      html.classList.remove('intro');

      // Lock scroll (native and Lenis) and take the page out of the focus order.
      const previousOverflow = html.style.overflow;
      html.style.overflow = 'hidden';
      let lenisFrame = 0;
      const stopLenis = (tries = 0) => {
        const lenis = getActiveLenis();
        if (lenis) lenis.stop();
        else if (tries < 30) lenisFrame = requestAnimationFrame(() => stopLenis(tries + 1));
      };
      stopLenis();
      const others = [...(overlay.parentElement?.children ?? [])].filter((el) => el !== overlay);
      others.forEach((el) => el.setAttribute('inert', ''));
      const release = () => {
        cancelAnimationFrame(lenisFrame);
        html.style.overflow = previousOverflow;
        getActiveLenis()?.start();
        others.forEach((el) => el.removeAttribute('inert'));
      };

      const q = gsap.utils.selector(overlay);
      const [letter] = q('.a-letter');
      const gold = letter?.getAttribute('fill') ?? 'currentColor';
      const aParts = q('.a-strokes, .a-swash');
      const [rim] = q('.lens-rim');
      const [mark] = q('.preloader-mark');

      // Filled shapes get a temporary gold outline that draws on, then the fill fades in.
      gsap.set(aParts, { attr: { stroke: gold, 'stroke-width': 1.2 }, fillOpacity: 0 });

      const draw = gsap
        .timeline({ defaults: { ease: ease.inOut } })
        .from(q('.camera-body'), { drawSVG: '0%', duration: duration.base })
        .from(
          aParts,
          { drawSVG: '0%', duration: duration.base, stagger: stagger.loose },
          stagger.base,
        )
        // The rim draws while it turns a full circle, so its gold gradient sweeps like an aperture.
        .from(
          rim,
          {
            drawSVG: '0%',
            rotation: -360,
            svgOrigin: '72 114',
            duration: duration.base + duration.fast,
          },
          duration.fast,
        )
        .from(
          q('.camera-barrel, .camera-flash, .lens > :not(.lens-rim)'),
          { opacity: 0, duration: duration.fast, stagger: stagger.tight },
          duration.base,
        )
        .to(
          aParts,
          { fillOpacity: 1, strokeOpacity: 0, duration: duration.fast },
          duration.base + stagger.loose,
        );

      const start = performance.now();
      const minWait = new Promise<void>((r) => window.setTimeout(r, preloader.min * 1000));
      const maxWait = new Promise<void>((r) => window.setTimeout(r, preloader.max * 1000));
      let cancelled = false;

      void Promise.race([Promise.all([minWait, heroImageReady()]), maxWait]).then(() => {
        if (cancelled) return;
        draw.progress(1); // never cut the drawing off half-way if the cap arrives first
        const box = rim?.getBoundingClientRect();
        const w = window.innerWidth;
        const h = window.innerHeight;
        const cx = box ? box.left + box.width / 2 : w / 2;
        const cy = box ? box.top + box.height / 2 : h / 2;
        const radius = { r: 0 };
        const far = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));

        markIntroDone(); // the hero intro starts as the aperture opens
        gsap
          .timeline({
            onComplete: () => {
              release();
              onDone();
            },
          })
          .to(radius, {
            r: far,
            duration: duration.base + duration.fast,
            ease: ease.inOut,
            onUpdate: () => {
              overlay.style.clipPath = aperture(w, h, cx, cy, radius.r);
            },
          })
          .to(mark, { scale: 1.25, opacity: 0, duration: duration.base, ease: ease.out }, 0);
        if (import.meta.env.DEV) {
          console.debug(`preloader: opened after ${Math.round(performance.now() - start)} ms`);
        }
      });

      return () => {
        cancelled = true;
        release();
      };
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="preloader fixed inset-0 z-[210] flex items-center justify-center bg-bg"
    >
      <div className="preloader-mark w-28 sm:w-36">
        <Logo variant="mark" tone="light" className="w-full" />
      </div>
    </div>
  );
}
