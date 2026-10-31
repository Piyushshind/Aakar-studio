import { MessageCircle, Phone } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { quoteBand } from '@/data/copy';
import { studio } from '@/data/studio';
import { useKineticTitle } from '@/hooks/useKineticTitle';
import { telLink, whatsappLink } from '@/lib/whatsapp';

/** Custom quote band (spec 5, item 11; copy 17.8). Replaces pricing: no prices anywhere. */
export function QuoteBand() {
  const title = useRef<HTMLHeadingElement>(null);
  useKineticTitle(title);

  return (
    <Section id="quote" spacing="none" aria-labelledby="quote-title" className="quote-band">
      <Container>
        <Reveal className="relative overflow-clip border border-gold/35 bg-surface px-5 py-12 sm:px-12 sm:py-16 lg:grid lg:grid-cols-12 lg:items-end lg:gap-12 lg:px-16 lg:py-24">
          {/* Soft gold glow in one corner: the only decoration. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-1/2 -right-1/4 size-[70%] rounded-full bg-gold/10 blur-3xl"
          />
          <div className="relative lg:col-span-7">
            <p className="flex items-center gap-4 eyebrow text-gold">
              <span aria-hidden="true" className="h-px w-6 bg-gold/60 sm:w-10" />
              Custom quote
            </p>
            <h2
              ref={title}
              id="quote-title"
              className="section-title mt-6 display text-[clamp(2.25rem,6vw,5.5rem)]"
            >
              {quoteBand.headline}
            </h2>
            <Reveal as="p" index={1} className="mt-6 max-w-[52ch] text-body text-pretty text-muted">
              {quoteBand.copy}
            </Reveal>
          </div>
          <Reveal
            index={2}
            className="quote-ctas relative mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:col-span-5 lg:mt-0 lg:flex-col lg:items-stretch [&>*]:w-full sm:[&>*]:w-auto lg:[&>*]:w-full"
          >
            <Button
              href={whatsappLink(quoteBand.whatsappMessage)}
              size="lg"
              icon={<MessageCircle />}
            >
              {quoteBand.ctaWhatsapp}
            </Button>
            <Button href={telLink()} variant="secondary" size="lg" icon={<Phone />}>
              {/* Name from the content (no aria-label), so it always matches the visible text
                  (Lighthouse: label-content-name-mismatch); the dot is hidden from screen readers. */}
              {quoteBand.ctaCall}
              <span aria-hidden="true"> · </span>
              {studio.phone}
            </Button>
          </Reveal>
        </Reveal>
      </Container>
    </Section>
  );
}
