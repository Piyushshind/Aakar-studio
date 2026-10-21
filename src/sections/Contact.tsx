import { Mail, MessageCircle, Navigation, Phone, type LucideIcon } from 'lucide-react';
import { useRef } from 'react';
import { InquiryForm } from '@/components/contact/InquiryForm';
import { MapFacade } from '@/components/contact/MapFacade';
import { OpenStatus } from '@/components/contact/OpenStatus';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { contactHeadline, hero } from '@/data/copy';
import { sectionEyebrows } from '@/data/navigation';
import { studio, studioAddressLine } from '@/data/studio';
import { useKineticTitle } from '@/hooks/useKineticTitle';
import { formatHours, typographic } from '@/lib/format';
import { mailtoLink, telLink, whatsappLink } from '@/lib/whatsapp';

interface Action {
  label: string;
  value: string;
  href: string;
  icon: LucideIcon;
}

const ACTIONS: Action[] = [
  {
    label: 'WhatsApp',
    value: 'Message us',
    href: whatsappLink(hero.whatsappMessage),
    icon: MessageCircle,
  },
  { label: 'Call', value: studio.phone, href: telLink(), icon: Phone },
  { label: 'Email', value: studio.email, href: mailtoLink(), icon: Mail },
  {
    label: 'Directions',
    value: 'Open in Google Maps',
    href: studio.mapLink,
    icon: Navigation,
  },
];

function ActionTile({ action, index }: { action: Action; index: number }) {
  const external = /^https?:/.test(action.href);
  const { icon: ActionIcon } = action;
  return (
    <Reveal as="li" index={index}>
      <a
        href={action.href}
        {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
        className="contact-action group flex h-full items-center gap-5 border border-line bg-bg/40 p-5 hover:border-gold/60 sm:p-6 xl:flex-col xl:items-start xl:gap-10 xl:p-7"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold group-hover:bg-gold group-hover:text-bg">
          <ActionIcon aria-hidden="true" strokeWidth={1.25} className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block eyebrow text-[0.68rem] text-gold">{action.label}</span>
          <span className="mt-1.5 block truncate text-text/90 xl:mt-2">{action.value}</span>
        </span>
      </a>
    </Reveal>
  );
}

/**
 * Contact (spec 5, item 17): closing headline, the four direct actions, address and hours with
 * a live open/closed status, a click-to-load map and the inquiry form.
 */
export function Contact() {
  const { number, label } = sectionEyebrows.contact;
  const title = useRef<HTMLHeadingElement>(null);
  useKineticTitle(title);

  return (
    <Section id="contact" tone="surface" aria-labelledby="contact-title" className="contact">
      <Container>
        <header>
          <Reveal as="p" className="flex items-center gap-4 eyebrow text-gold">
            <span aria-hidden="true">{number}</span>
            <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
            <span>{label}</span>
          </Reveal>
          <h2
            ref={title}
            id="contact-title"
            className="section-title mt-6 max-w-[12ch] display text-[clamp(3rem,9vw,8.5rem)]"
          >
            {typographic(contactHeadline)}
          </h2>
        </header>

        <ul
          aria-label="Get in touch"
          className="mt-14 grid gap-3 sm:grid-cols-2 lg:mt-20 xl:grid-cols-4 xl:gap-4"
        >
          {ACTIONS.map((action, i) => (
            <ActionTile key={action.label} action={action} index={i} />
          ))}
        </ul>

        <div className="mt-20 grid gap-16 lg:mt-28 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <h3 className="eyebrow text-gold">Visit the studio</h3>
            <address className="mt-6 not-italic">
              <p className="max-w-[30ch] font-display text-2xl leading-snug text-pretty">
                {studioAddressLine}
              </p>
            </address>
            <OpenStatus className="mt-6" />
            <dl className="mt-8 grid gap-3">
              {studio.hours.map((h) => {
                const { days, time } = formatHours(h);
                return (
                  <div key={days} className="flex justify-between gap-6 border-b border-line pb-3">
                    <dt className="text-muted">{days}</dt>
                    <dd className="text-text/90 tabular-nums">{time}</dd>
                  </div>
                );
              })}
            </dl>
            <div className="mt-10">
              <MapFacade />
            </div>
          </Reveal>

          <Reveal index={1} className="lg:col-span-7 lg:pl-8">
            <h3 className="eyebrow text-gold">Send an enquiry</h3>
            <p className="mt-6 max-w-[48ch] text-body text-pretty text-muted">
              Tell us what you have in mind and we'll put together the right plan for you.
            </p>
            <div className="mt-10">
              <InquiryForm />
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
