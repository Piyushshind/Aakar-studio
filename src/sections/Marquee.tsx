import { useRef } from 'react';
import { marqueeWords } from '@/data/copy';
import { MOTION_OK_QUERY } from '@/hooks/useReducedMotion';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { duration, ease, loop } from '@/lib/motion';

function Row({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden || undefined} className="marquee-row flex shrink-0 items-center">
      {marqueeWords.map((word) => (
        <li key={word} className="flex items-center">
          <span className="px-6 display text-[clamp(1.75rem,4vw,3.25rem)] whitespace-nowrap text-text/90 lg:px-9">
            {word}
          </span>
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-gold" />
        </li>
      ))}
    </ul>
  );
}

/** Scroll velocity (px/s) that adds one extra multiple of the base speed. */
const VELOCITY_PER_BOOST = 400;

/**
 * Keyword strip (spec 5, item 4; words in 17.3). Two identical rows move left forever: shifting
 * the track by -50% lands exactly where it started. Scrolling speeds it up in the scroll
 * direction, then it eases back to the calm base speed. Paused off-screen and in hidden tabs;
 * static with reduced motion. The section clips the track, so it never widens the page.
 */
export function Marquee() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK_QUERY, () => {
        const track = root.current?.querySelector('.marquee-track');
        if (!track) return;
        const tween = gsap.to(track, {
          xPercent: -50,
          duration: loop.marquee,
          ease: 'none',
          repeat: -1,
          paused: true,
        });
        // An infinite tween stops when a reverse reaches time 0: start many cycles in, so scrolling
        // up (negative timeScale) can run backwards for as long as anyone scrolls.
        tween.totalTime(loop.marquee * 1000);

        const speed = { value: 1 };
        const apply = () => tween.timeScale(speed.value);
        let visible = false;

        const trigger = ScrollTrigger.create({
          trigger: root.current,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => {
            visible = self.isActive;
            if (visible && !document.hidden) tween.play();
            else tween.pause();
          },
          onUpdate: (self) => {
            const direction = self.direction;
            const boost = Math.min(
              loop.marqueeBoost,
              Math.abs(self.getVelocity()) / VELOCITY_PER_BOOST,
            );
            gsap.to(speed, {
              value: direction * (1 + boost),
              duration: duration.fast,
              ease: ease.out,
              overwrite: true,
              onUpdate: apply,
              onComplete: () => {
                gsap.to(speed, {
                  value: direction,
                  duration: duration.slow,
                  ease: ease.out,
                  onUpdate: apply,
                });
              },
            });
          },
        });

        const onVisibility = () => {
          if (document.hidden) tween.pause();
          else if (visible) tween.play();
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
          document.removeEventListener('visibilitychange', onVisibility);
          trigger.kill();
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-label="What we photograph"
      className="marquee overflow-hidden border-y border-line bg-bg py-7 lg:py-9"
    >
      <div className="marquee-track flex w-max">
        <Row />
        <Row hidden />
      </div>
    </section>
  );
}
