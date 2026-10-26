import { MessageCircle, Plus } from 'lucide-react';
import { m } from 'motion/react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { faqFollowUp, sectionTitles } from '@/data/copy';
import { faq } from '@/data/faq';
import { sectionEyebrows } from '@/data/navigation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { transition } from '@/lib/motion';
import { whatsappLink } from '@/lib/whatsapp';
import type { FaqItem } from '@/types/content';

/**
 * One question: a heading with a button (aria-expanded) that opens its answer region. The answer
 * stays in the page when closed (height 0, inert), so it is in the pre-rendered HTML (Phase 9).
 * Reduced motion: it opens at once with a short fade.
 */
function FaqEntry({
  item,
  index,
  open,
  onToggle,
}: {
  item: FaqItem;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const uid = useId();
  const reducedMotion = useReducedMotion();
  const height = reducedMotion ? { duration: 0 } : transition.base;

  return (
    <Reveal className="faq-item border-t border-line">
      <h3>
        <button
          type="button"
          id={`${uid}-q`}
          aria-expanded={open}
          aria-controls={`${uid}-a`}
          onClick={onToggle}
          className="group flex w-full items-start gap-5 py-6 text-left lg:gap-8 lg:py-8"
        >
          <span
            aria-hidden="true"
            className="w-6 shrink-0 pt-2 eyebrow text-xs text-gold lg:text-[0.65rem]"
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="flex-1 font-display text-[clamp(1.25rem,2vw,1.625rem)] leading-snug text-pretty text-text group-hover:text-gold-light">
            {item.question}
          </span>
          <Plus
            aria-hidden="true"
            strokeWidth={1.25}
            className={`mt-1 size-6 shrink-0 text-gold transition-[rotate] duration-(--duration-base) ease-out ${open ? 'rotate-45' : ''}`}
          />
        </button>
      </h3>
      <m.div
        id={`${uid}-a`}
        role="region"
        aria-labelledby={`${uid}-q`}
        inert={!open}
        initial={false}
        animate={open ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ height, opacity: transition.fast }}
        className="overflow-clip"
      >
        <p className="max-w-[60ch] pr-11 pb-8 pl-11 text-body text-pretty text-muted lg:pl-14">
          {item.answer}
        </p>
      </m.div>
    </Reveal>
  );
}

/**
 * FAQ (spec 5, item 15; 17.10): a Motion accordion, one answer open at a time. The FAQPage JSON-LD
 * comes in Phase 9.
 */
export function Faq() {
  const [open, setOpen] = useState<number | null>(null);
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
            <FaqEntry
              key={item.question}
              item={item}
              index={i}
              open={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
