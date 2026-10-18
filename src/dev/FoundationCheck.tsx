// TEMPORARY (Phase 2): dev-only foundation check. Loaded only when import.meta.env.DEV.
// Delete this folder in Phase 5 when the real sections arrive.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { albums } from '@/data/albums';
import { heroPhotoIds } from '@/data/curation';
import { galleryFilterMode, galleryTabs } from '@/data/gallery';
import { services } from '@/data/services';
import { studio, studioAddressLine } from '@/data/studio';
import { themeLabel } from '@/data/themes';
import { REDUCED_MOTION_QUERY, useReducedMotion } from '@/hooks/useReducedMotion';
import { gsap, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap';
import { duration, ease, stagger } from '@/lib/motion';
import {
  allPhotos,
  categoriesWithPhotos,
  getHeroPhotos,
  getPhoto,
  getPhotos,
  isConsentPending,
} from '@/lib/photos';
import { validateManifest } from '@/lib/photos.schema';
import { getActiveLenis, scrollToSection } from '@/lib/scroll';
import { mailtoLink, telLink, whatsappLink } from '@/lib/whatsapp';

const countBy = <T,>(items: T[], key: (item: T) => string) =>
  items.reduce<Record<string, number>>((acc, item) => {
    acc[key(item)] = (acc[key(item)] ?? 0) + 1;
    return acc;
  }, {});

const to12h = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

function Panel({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section
      id={id}
      data-reveal
      className="rounded-lg border border-line bg-surface p-5 outline-none"
    >
      <h2 className="mb-3 text-xs font-semibold tracking-[0.3em] text-gold uppercase">{title}</h2>
      <div className="space-y-1 text-sm text-text">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p>
      <span className="text-muted">{label}: </span>
      {children}
    </p>
  );
}

/** Live StrictMode diagnostics: duplicates would show as more Lenis instances or triggers. */
function useDiagnostics() {
  const [diag, setDiag] = useState({ lenis: false, lenisRoots: 0, triggers: 0 });
  useEffect(() => {
    const read = () =>
      setDiag({
        lenis: getActiveLenis() !== null,
        lenisRoots: document.documentElement.classList.contains('lenis') ? 1 : 0,
        triggers: ScrollTrigger.getAll().length,
      });
    read();
    const timer = window.setInterval(read, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return diag;
}

export default function FoundationCheck() {
  const root = useRef<HTMLDivElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);
  const reducedMotion = useReducedMotion();
  const diag = useDiagnostics();
  const manifest = validateManifest();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { reduce: REDUCED_MOTION_QUERY, full: '(prefers-reduced-motion: no-preference)' },
        (ctx) => {
          const reveals = root.current?.querySelectorAll<HTMLElement>('[data-reveal]') ?? [];

          // Reduced motion (spec 8.3): short opacity fades only.
          if (ctx.conditions?.reduce) {
            gsap.from(headline.current, { opacity: 0, duration: duration.fast });
            reveals.forEach((el) =>
              gsap.from(el, {
                opacity: 0,
                duration: duration.fast,
                scrollTrigger: { trigger: el, start: 'top 90%' },
              }),
            );
            return;
          }

          // SplitText keeps an aria-label with the full text (spec 10).
          SplitText.create(headline.current, {
            type: 'words,chars',
            mask: 'words',
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.chars, {
                yPercent: 110,
                duration: duration.slow,
                ease: ease.expo,
                stagger: stagger.tight,
              }),
          });
          reveals.forEach((el) =>
            gsap.from(el, {
              y: 48,
              opacity: 0,
              duration: duration.base,
              scrollTrigger: { trigger: el, start: 'top 90%' },
            }),
          );
        },
      );
      return () => mm.revert();
    },
    { scope: root },
  );

  const photos = getPhotos({ kind: 'photo' });
  const perCategory = countBy(getPhotos(), (p) => p.category);
  const perTheme = countBy(photos, (p) => p.theme);
  const featured = getPhotos({ featured: true });
  const pending = allPhotos.filter(isConsentPending).length;
  const enforce = import.meta.env.VITE_ENFORCE_CONSENT === 'true';

  return (
    // Bottom padding lets #fc-contact reach the top, to check the header offset.
    <div ref={root} className="mx-auto max-w-5xl space-y-6 px-6 pt-16 pb-[100vh]">
      <p className="text-xs font-semibold tracking-[0.4em] text-muted uppercase">
        Foundation check · dev only · Phase 2
      </p>
      <h1
        ref={headline}
        className="font-display text-[clamp(2.5rem,7vw,6rem)] leading-none font-semibold tracking-tight"
      >
        {studio.name}
      </h1>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => scrollToSection('fc-contact')}
          className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-bg"
        >
          scrollToSection('fc-contact')
        </button>
        <span className="self-center text-xs text-muted">
          Lenis {diag.lenis ? 'on' : 'off (native scroll)'} · html.lenis roots: {diag.lenisRoots} ·
          ScrollTriggers: {diag.triggers} · reduced motion: {String(reducedMotion)}
        </span>
      </div>

      <Panel title="Manifest">
        <Row label="Validation">
          {manifest.errors.length === 0 ? (
            <span className="text-gold">valid, {manifest.count} entries</span>
          ) : (
            <span className="text-blush">{manifest.errors.length} problem(s), see console</span>
          )}
        </Row>
        <Row label="Consent">
          {pending} of {allPhotos.length} pending · VITE_ENFORCE_CONSENT={String(enforce)}
        </Row>
        <Row label="Per category">
          {Object.entries(perCategory)
            .map(([c, n]) => `${c} ${n}`)
            .join(' · ')}
        </Row>
        <Row label="Gallery categories">{categoriesWithPhotos().join(', ')}</Row>
        <Row label="Per theme (photos)">
          {Object.entries(perTheme)
            .map(([t, n]) => `${themeLabel(t)} ${n}`)
            .join(' · ')}
        </Row>
        <Row label={`Gallery tabs (by ${galleryFilterMode})`}>
          {galleryTabs.map((t) => `${t.label} (${t.photos.length})`).join(' · ')}
        </Row>
        <Row label={`Featured (${featured.length})`}>{featured.map((p) => p.id).join(', ')}</Row>
        <Row label={`Hero (${getHeroPhotos().length} of ${heroPhotoIds.length})`}>
          {getHeroPhotos()
            .map((p) => p.id)
            .join(', ')}
        </Row>
      </Panel>

      <Panel title={`Albums (${albums.length})`}>
        {albums.map((a) => (
          <Row key={a.slug} label={a.slug}>
            “{a.title}” · {a.type} · cover {a.cover.id} ({a.cover.kind}) · {a.pages.length} pages:{' '}
            {a.pages.map((p) => p.id.replace(`${a.slug}-`, '')).join(', ')}
          </Row>
        ))}
      </Panel>

      <Panel title={`Services (${services.length})`}>
        {services.map((s) => {
          const photo = s.imageId ? getPhoto(s.imageId) : undefined;
          return (
            <Row key={s.id} label={s.title}>
              {s.icon} · {photo ? `image ${photo.id}` : 'icon card'} ·{' '}
              <a className="text-gold underline" href={whatsappLink(s.whatsappMessage)}>
                Enquire
              </a>
            </Row>
          );
        })}
      </Panel>

      {[1, 2, 3].map((n) => (
        <Panel key={n} title={`Scroll spacer ${n}`}>
          <div className="h-[40vh]">ScrollTrigger reveal block {n}.</div>
        </Panel>
      ))}

      <Panel id="fc-contact" title="Contact (via link helpers)">
        <Row label="WhatsApp">
          <a className="text-gold underline" href={whatsappLink('Hi, this is a test message.')}>
            {whatsappLink('Hi, this is a test message.')}
          </a>
        </Row>
        <Row label="Call">
          <a className="text-gold underline" href={telLink()}>
            {studio.phone} ({telLink()})
          </a>
        </Row>
        <Row label="Email">
          <a className="text-gold underline" href={mailtoLink('Photoshoot enquiry')}>
            {mailtoLink('Photoshoot enquiry')}
          </a>
        </Row>
        <Row label="Directions">
          <a className="text-gold underline" href={studio.mapLink}>
            {studio.mapLink}
          </a>
        </Row>
        <Row label="Address">{studioAddressLine}</Row>
        <Row label="Hours">
          {studio.hours.map((h) => `${h.days} ${to12h(h.opens)} – ${to12h(h.closes)}`).join('; ')}
        </Row>
      </Panel>
    </div>
  );
}
