import { ArrowUpRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { sectionTitles } from '@/data/copy';
import { sectionEyebrows } from '@/data/navigation';
import { services, studioExtras, studioExtrasWhatsappMessage } from '@/data/services';
import { FINE_POINTER_QUERY, MOTION_OK_QUERY } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import { gsap, useGSAP } from '@/lib/gsap';
import { duration, ease } from '@/lib/motion';
import { getPhoto } from '@/lib/photos';
import { whatsappLink } from '@/lib/whatsapp';
import type { Photo, Service } from '@/types/content';

const number = (i: number) => String(i + 1).padStart(2, '0');

// Hover preview: desktop, fine pointer, motion allowed. It sits this far right of the cursor (clear
// of the cursor ring) and always stops this far short of the description column, so it never
// covers the Enquire link.
const PREVIEW_QUERY = `${FINE_POINTER_QUERY} and ${MOTION_OK_QUERY} and (min-width: 1024px)`;
const PREVIEW_OFFSET = 48;
const PREVIEW_GAP = 24;

const withPhotos = services
  .map((service) => ({ service, photo: service.imageId ? getPhoto(service.imageId) : undefined }))
  .filter((s): s is { service: Service; photo: Photo } => s.photo !== undefined);

/**
 * A service's real photo, or an icon tile of the same shape when it has none (spec 5, item 9:
 * no stock photos). Same frame and hairline either way, so the set reads as one.
 */
function ServiceMedia({
  service,
  sizes,
  className,
  iconClassName,
}: {
  service: Service;
  sizes: string;
  className?: string;
  iconClassName?: string;
}) {
  const photo = service.imageId ? getPhoto(service.imageId) : undefined;
  return (
    <div className={cn('service-media overflow-clip border border-gold/25', className)}>
      {photo ? (
        <ResponsiveImage photo={photo} ratio="4 / 3" sizes={sizes} alt="" />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center bg-elevated/60">
          <Icon
            name={service.icon}
            strokeWidth={0.75}
            className={cn('size-16 text-gold/90', iconClassName)}
          />
        </div>
      )}
    </div>
  );
}

/**
 * The row's one real link. On desktop its ::after stretches over the whole row (the row is its
 * positioning box), so clicking anywhere on the row enquires without a second, nested or
 * duplicate link. The link itself stays unpositioned there so the pseudo-element reaches the row.
 */
function EnquireLink({ service }: { service: Service }) {
  return (
    <Button
      href={whatsappLink(service.whatsappMessage)}
      variant="ghost"
      icon={<ArrowUpRight />}
      aria-label={`Enquire about ${service.title} on WhatsApp`}
      className="flex-row-reverse lg:after:absolute lg:after:inset-0 lg:after:content-['']"
    >
      Enquire
    </Button>
  );
}

/**
 * Editorial numbered list, one row per service. Hover or keyboard focus nudges the title and
 * brightens the number; on desktop pointers a row with a photo also shows a larger floating
 * preview that follows the cursor (GSAP quickTo), and the whole row opens the WhatsApp enquiry.
 */
function ServiceList() {
  const list = useRef<HTMLOListElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(PREVIEW_QUERY, () => {
        const ol = list.current;
        const box = preview.current;
        if (!ol || !box) return;
        gsap.set(box, { autoAlpha: 0, scale: 0.92 });
        const xTo = gsap.quickTo(box, 'x', { duration: duration.base, ease: ease.out });
        const yTo = gsap.quickTo(box, 'y', { duration: duration.base, ease: ease.out });
        let row: HTMLElement | null = null;

        const place = (event: PointerEvent, instant: boolean) => {
          if (!row) return;
          const area = ol.getBoundingClientRect();
          const title = row.querySelector('h3')?.getBoundingClientRect();
          const text = row.querySelector('.service-text')?.getBoundingClientRect();
          if (!title || !text) return;
          const minX = title.left - area.left;
          const maxX = Math.max(minX, text.left - area.left - box.offsetWidth - PREVIEW_GAP);
          const x = gsap.utils.clamp(minX, maxX, event.clientX - area.left + PREVIEW_OFFSET);
          const y = gsap.utils.clamp(
            0,
            area.height - box.offsetHeight,
            event.clientY - area.top - box.offsetHeight / 2,
          );
          xTo(x, instant ? x : undefined);
          yTo(y, instant ? y : undefined);
        };

        const rows = [...ol.querySelectorAll<HTMLElement>('[data-preview]')];
        const enter = (event: PointerEvent) => {
          const shown = row !== null;
          row = event.currentTarget as HTMLElement;
          setActiveId(row.dataset.preview ?? null);
          place(event, !shown);
          gsap.to(box, { autoAlpha: 1, scale: 1, duration: duration.fast, overwrite: 'auto' });
        };
        const leave = () => {
          row = null;
          gsap.to(box, { autoAlpha: 0, scale: 0.92, duration: duration.fast, overwrite: 'auto' });
        };
        const move = (event: PointerEvent) => place(event, false);

        for (const r of rows) {
          r.addEventListener('pointerenter', enter);
          r.addEventListener('pointerleave', leave);
          r.addEventListener('pointermove', move);
        }
        return () => {
          for (const r of rows) {
            r.removeEventListener('pointerenter', enter);
            r.removeEventListener('pointerleave', leave);
            r.removeEventListener('pointermove', move);
          }
        };
      });
      return () => mm.revert();
    },
    { scope: list },
  );

  return (
    <ol ref={list} className="services-list relative mt-16 border-b border-line lg:mt-24">
      {services.map((service, i) => {
        return (
          <Reveal
            as="li"
            key={service.id}
            data-cursor="enquire"
            data-preview={service.imageId && getPhoto(service.imageId) ? service.id : undefined}
            className="service-row group relative grid grid-cols-[2.5rem_1fr_5rem] items-start gap-x-4 gap-y-5 border-t border-line py-8 sm:grid-cols-[3.5rem_1fr_7rem] sm:gap-x-6 lg:grid-cols-12 lg:gap-x-10 lg:py-10"
          >
            <span
              aria-hidden="true"
              className="pt-2 eyebrow text-gold opacity-60 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 lg:col-span-1 lg:pt-3"
            >
              {number(i)}
            </span>
            {/* Title and thumbnail let clicks through to the stretched Enquire link on desktop. */}
            <h3 className="display text-[clamp(1.75rem,3vw,2.75rem)] transition-[translate] duration-(--duration-base) ease-out motion-safe:group-focus-within:translate-x-3 motion-safe:group-hover:translate-x-3 lg:pointer-events-none lg:col-span-4">
              {service.title}
            </h3>
            <ServiceMedia
              service={service}
              sizes="(min-width: 1440px) 220px, (min-width: 1024px) 15vw, 7rem"
              iconClassName="size-8 sm:size-10"
              className="col-start-3 row-start-1 lg:pointer-events-none lg:col-span-2 lg:col-start-11"
            />
            <div className="service-text col-span-3 sm:col-span-2 sm:col-start-2 lg:col-span-5 lg:col-start-6 lg:row-start-1 lg:pt-2">
              <p className="max-w-[46ch] text-body text-pretty text-muted">{service.description}</p>
              <div className="mt-5">
                <EnquireLink service={service} />
              </div>
            </div>
          </Reveal>
        );
      })}

      {/* Floating hover preview (decorative; the thumbnail in the row carries the photo). */}
      {withPhotos.length > 0 && (
        <div
          ref={preview}
          aria-hidden="true"
          className="service-preview pointer-events-none invisible absolute top-0 left-0 z-20 hidden w-[clamp(220px,19vw,300px)] opacity-0 lg:block"
        >
          <div className="relative aspect-[4/3] overflow-clip border border-gold/40 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)]">
            {withPhotos.map(({ service, photo }) => (
              <ResponsiveImage
                key={service.id}
                photo={photo}
                ratio="4 / 3"
                sizes="300px"
                alt=""
                className={cn(
                  'absolute inset-0 transition-opacity duration-(--duration-fast)',
                  activeId === service.id ? 'opacity-100' : 'opacity-0',
                )}
              />
            ))}
          </div>
        </div>
      )}
    </ol>
  );
}

/** "Also at the studio": passport and ID photos, printing, framing (spec 17.6). */
function StudioExtras() {
  return (
    <Reveal className="studio-extras mt-16 flex flex-col gap-8 border border-line bg-surface/40 p-6 sm:p-8 lg:mt-20 lg:flex-row lg:items-center lg:justify-between lg:px-10">
      <h3 className="eyebrow text-gold">Also at the studio</h3>
      <ul className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:gap-x-10">
        {studioExtras.map((extra) => (
          <li key={extra.title} className="flex items-center gap-3 text-text/90">
            <Icon name={extra.icon} strokeWidth={1.25} className="size-5 text-gold" />
            {extra.title}
          </li>
        ))}
      </ul>
      <Button
        href={whatsappLink(studioExtrasWhatsappMessage)}
        variant="secondary"
        aria-label="Enquire about passport photos, printing or framing on WhatsApp"
        className="self-start lg:self-auto"
      >
        Enquire
      </Button>
    </Reveal>
  );
}

/** Services (spec 5, item 9): the eight services from 17.6 and the "Also at the studio" row. */
export function Services() {
  const { number: eyebrowNumber, label } = sectionEyebrows.services;

  return (
    <Section id="services" aria-labelledby="services-title">
      <Container>
        <SectionHeading
          id="services-title"
          number={eyebrowNumber}
          eyebrow={label}
          title={sectionTitles.services}
        />
        <ServiceList />
        <StudioExtras />
      </Container>
    </Section>
  );
}
