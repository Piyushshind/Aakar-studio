import { MessageCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { faqFollowUp, sectionTitles } from '@/data/copy';
import { faq } from '@/data/faq';
import { sectionEyebrows } from '@/data/navigation';
import { whatsappLink } from '@/lib/whatsapp';

/**
 * FAQ (spec 5, item 15; 17.10): native details/summary, keyboard and screen-reader friendly with
 * no script. The shared `name` makes it one-open-at-a-time where supported. Motion's animated
 * accordion and the FAQPage JSON-LD come later (Phases 8 and 9).
 */
export function Faq() {
  if (faq.length === 0) return null;
  const { number, label } = sectionEyebrows.faq;

  return (
    <Section id="faq" aria-labelledby="faq-title" className="faq">
      <Container className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--header-offset)+2rem)]">
            <SectionHeading
              id="faq-title"
              number={number}
              eyebrow={label}
              title={sectionTitles.faq}
            />
            <Reveal className="mt-10">
              <p className="text-body text-muted">{faqFollowUp.text}</p>
              <Button
                href={whatsappLink(faqFollowUp.whatsappMessage)}
                variant="secondary"
                icon={<MessageCircle />}
                className="mt-5"
              >
                {faqFollowUp.cta}
              </Button>
            </Reveal>
          </div>
        </div>

        <div className="faq-list border-b border-line lg:col-span-8">
          {faq.map((item, i) => (
            <Reveal
              as="details"
              key={item.question}
              name="faq"
              className="faq-item group border-t border-line"
            >
              <summary className="flex cursor-pointer list-none items-start gap-5 py-6 lg:gap-8 lg:py-8 [&::-webkit-details-marker]:hidden">
                <span
                  aria-hidden="true"
                  className="w-6 shrink-0 pt-2 eyebrow text-[0.65rem] text-gold"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 font-display text-[clamp(1.25rem,2vw,1.625rem)] leading-snug text-pretty text-text group-hover:text-gold-light">
                  {item.question}
                </span>
                <Plus
                  aria-hidden="true"
                  strokeWidth={1.25}
                  className="mt-1 size-6 shrink-0 text-gold transition-[rotate] duration-(--duration-base) ease-out group-open:rotate-45"
                />
              </summary>
              <p className="max-w-[60ch] pr-11 pb-8 pl-11 text-body text-pretty text-muted lg:pl-14">
                {item.answer}
              </p>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
