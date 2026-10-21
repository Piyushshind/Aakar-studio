import { useRef, type CSSProperties } from 'react';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { sectionTitles } from '@/data/copy';
import { sectionEyebrows } from '@/data/navigation';
import { processSteps } from '@/data/process';
import { MOTION_OK_QUERY } from '@/hooks/useReducedMotion';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { duration } from '@/lib/motion';

// The desktop line runs from the first marker's centre to the last one's: four column widths
// plus four 2.5rem gaps, where a column is (100% - 4 gaps) / 5.
const LINE_WIDTH = 'w-[calc((100%_-_10rem)*0.8_+_10rem)]';
// Paths are drawn in real pixels, far longer than any screen, and clipped by their <svg> box: the
// full line shows without JS, and DrawSVG draws exactly the visible length (measured on refresh).
const LONG = 4000;

/**
 * DrawSVG end value: the visible length of the clipped path, re-measured on every refresh
 * (invalidateOnRefresh). GSAP accepts function-based values for any property; its DrawSVG types
 * just don't say so.
 */
const visibleLength = (svg: SVGSVGElement, axis: 'width' | 'height') =>
  (() => `0 ${svg.getBoundingClientRect()[axis]}`) as unknown as string;

/** Where a step "arrives": the drawing line reaches it as it crosses this viewport height. */
const ARRIVE = '65%';

/** How it works (spec 5, item 12; steps 17.9): horizontal on desktop, vertical on mobile. */
export function Process() {
  const { number, label } = sectionEyebrows.process;
  const list = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const ol = list.current;
      if (!ol) return;
      const markers = gsap.utils.toArray<HTMLElement>('.process-marker', ol);
      const light = (marker: HTMLElement, on: boolean) => marker.classList.toggle('is-active', on);
      const mm = gsap.matchMedia();

      // Desktop: one line, scrubbed across the row; each circle lights as the line reaches it.
      mm.add(`(min-width: 1024px) and ${MOTION_OK_QUERY}`, () => {
        const svg = ol.querySelector<SVGSVGElement>('.process-line-h');
        const path = svg?.querySelector('path');
        if (!svg || !path) return;
        const last = markers.length - 1;
        gsap.fromTo(
          path,
          { drawSVG: '0 0' },
          {
            drawSVG: visibleLength(svg, 'width'),
            ease: 'none',
            scrollTrigger: {
              trigger: ol,
              start: `top ${ARRIVE}`,
              end: 'bottom 45%',
              scrub: duration.fast,
              invalidateOnRefresh: true,
              onUpdate: (self) =>
                markers.forEach((m, i) => light(m, self.progress > 0 && self.progress >= i / last)),
            },
          },
        );
        return () => markers.forEach((m) => light(m, false));
      });

      // Mobile: a segment per step draws down to the next circle, which lights as it arrives.
      mm.add(`(max-width: 1023.98px) and ${MOTION_OK_QUERY}`, () => {
        for (const step of gsap.utils.toArray<HTMLElement>('.process-step', ol)) {
          const svg = step.querySelector<SVGSVGElement>('.process-line-v');
          const path = svg?.querySelector('path');
          const marker = step.querySelector<HTMLElement>('.process-marker');
          if (marker) {
            ScrollTrigger.create({
              trigger: marker,
              start: `center ${ARRIVE}`,
              onEnter: () => light(marker, true),
              onLeaveBack: () => light(marker, false),
            });
          }
          if (!svg || !path) continue;
          gsap.fromTo(
            path,
            { drawSVG: '0 0' },
            {
              drawSVG: visibleLength(svg, 'height'),
              ease: 'none',
              scrollTrigger: {
                trigger: svg,
                start: `top ${ARRIVE}`,
                end: `bottom ${ARRIVE}`,
                scrub: duration.fast,
                invalidateOnRefresh: true,
              },
            },
          );
        }
        return () => markers.forEach((m) => light(m, false));
      });

      return () => mm.revert();
    },
    { scope: list },
  );

  return (
    <Section id="process" aria-labelledby="process-title" className="process">
      <Container>
        <SectionHeading
          id="process-title"
          number={number}
          eyebrow={label}
          title={sectionTitles.process}
        />
        <ol ref={list} className="relative mt-16 lg:mt-24 lg:grid lg:grid-cols-5 lg:gap-10">
          <svg
            aria-hidden="true"
            className={`process-line-h absolute top-6 left-6 hidden h-px text-gold/50 lg:block ${LINE_WIDTH}`}
          >
            <path className="process-line" d={`M0 0.5H${LONG}`} stroke="currentColor" fill="none" />
          </svg>
          {processSteps.map((step, i) => {
            const last = i === processSteps.length - 1;
            return (
              // Desktop steps share a row, so they stagger; on mobile each enters on its own.
              <Reveal
                as="li"
                key={step.title}
                style={{ '--i': i } as CSSProperties}
                className="process-step relative grid grid-cols-[3rem_1fr] gap-x-6 pb-12 last:pb-0 lg:block lg:pb-0 lg:[--reveal-i:var(--i)]"
              >
                {!last && (
                  <svg
                    aria-hidden="true"
                    className="process-line-v absolute top-12 left-6 h-[calc(100%_-_3rem)] w-px text-gold/50 lg:hidden"
                  >
                    <path
                      className="process-line"
                      d={`M0.5 0V${LONG}`}
                      stroke="currentColor"
                      fill="none"
                    />
                  </svg>
                )}
                <span
                  aria-hidden="true"
                  className="process-marker group/marker relative flex size-12 items-center justify-center rounded-full border border-gold/60 bg-bg font-display text-lg text-gold"
                >
                  {i + 1}
                  {/* Lights up gold when the line arrives (opacity and scale only). */}
                  <span className="absolute inset-0 flex scale-75 items-center justify-center rounded-full bg-gold text-bg opacity-0 transition-[opacity,scale] duration-(--duration-base) ease-out group-[.is-active]/marker:scale-100 group-[.is-active]/marker:opacity-100">
                    {i + 1}
                  </span>
                </span>
                <div className="pt-2.5 lg:pt-0">
                  <h3 className="display text-[clamp(1.625rem,2.2vw,2rem)] lg:mt-8">
                    <span className="sr-only">Step {i + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-[40ch] text-body text-pretty text-muted lg:mt-4">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </Container>
    </Section>
  );
}
