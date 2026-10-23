import { useRef } from 'react';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { anywhereBand } from '@/data/copy';
import { useKineticTitle } from '@/hooks/useKineticTitle';
import { typographic } from '@/lib/format';

/**
 * "Anywhere you celebrate" (spec 5, item 10), typographic for now: there is no outdoor studio
 * photo yet and no stock picked. A background photo can slot in behind this later.
 */
export function AnywhereBand() {
  const title = useRef<HTMLHeadingElement>(null);
  useKineticTitle(title);

  return (
    <Section
      id="anywhere"
      spacing="none"
      aria-labelledby="anywhere-title"
      className="anywhere-band pt-[clamp(1rem,3vw,3rem)] pb-[clamp(4rem,8vw,8rem)]"
    >
      <Container className="text-center">
        {/* The two gold rules draw outwards from the centre as the band arrives. */}
        <Reveal
          variant="line"
          aria-hidden="true"
          className="anywhere-rule mx-auto h-px max-w-3xl bg-gold/40"
        />
        <h2
          ref={title}
          id="anywhere-title"
          className="section-title mx-auto mt-14 max-w-[16ch] display text-[clamp(2.375rem,7.5vw,7rem)] lg:mt-20"
        >
          {typographic(anywhereBand.statement)}
        </h2>
        <Reveal
          as="p"
          className="mx-auto mt-8 max-w-[40ch] text-body text-balance text-muted lg:mt-10"
        >
          {anywhereBand.supporting}
        </Reveal>
        {/* Phones: a 2x2 grid with no separators; wider: one dotted row. */}
        <Reveal
          as="ul"
          index={1}
          aria-label="Where we shoot"
          className="mx-auto mt-10 grid grid-cols-2 gap-x-4 gap-y-4 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-6 lg:mt-12"
        >
          {anywhereBand.places.map((place, i) => (
            <li
              key={place}
              className="flex items-center justify-center gap-6 eyebrow text-xs tracking-[0.22em] whitespace-nowrap text-gold sm:tracking-[0.32em] lg:text-[0.68rem]"
            >
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className="hidden size-1 rounded-full bg-gold/60 sm:block"
                />
              )}
              {place}
            </li>
          ))}
        </Reveal>
        <Reveal
          variant="line"
          aria-hidden="true"
          className="anywhere-rule mx-auto mt-14 h-px max-w-3xl bg-gold/40 lg:mt-20"
        />
      </Container>
    </Section>
  );
}
