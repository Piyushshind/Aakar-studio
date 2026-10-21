import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { testimonials } from '@/data/testimonials';

/**
 * Testimonials (spec 5, item 14): real client reviews only. Renders nothing at all, not even a
 * heading, while there are none. Phase 8 turns the list into the Embla slider and adds the
 * "Read our Google reviews" link.
 */
export function Testimonials() {
  if (testimonials.length === 0) return null;

  return (
    <Section id="testimonials" aria-labelledby="testimonials-title" className="testimonials">
      <Container>
        <SectionHeading id="testimonials-title" eyebrow="Kind words" title="What families say." />
        <ul className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <li key={t.id} className="border-t border-gold/40 pt-8">
              <figure>
                <blockquote className="font-display text-xl leading-snug text-pretty">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6">
                  <span className="block text-text">{t.name}</span>
                  <span className="mt-1 block eyebrow text-[0.62rem] text-muted">{t.event}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
