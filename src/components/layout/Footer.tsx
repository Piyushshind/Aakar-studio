import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { taglines } from '@/data/copy';
import { navItems } from '@/data/navigation';
import { studio, studioAddressLine } from '@/data/studio';
import { formatHours } from '@/lib/format';
import { goTo } from '@/lib/scroll';
import { mailtoLink, telLink } from '@/lib/whatsapp';

const YEAR = new Date().getFullYear();

/** Site footer (spec 5, item 18). Socials appear once they are provided (spec 17.1). */
export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-bg pt-(--section-space)">
      <Container className="grid gap-12 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo variant="horizontal" tone="light" className="w-56 max-w-full" />
          <p className="mt-8 max-w-xs display text-2xl text-text/90">{taglines.footer}</p>
        </div>

        <nav aria-label="Footer" className="lg:col-span-2">
          <h2 className="eyebrow text-gold">Explore</h2>
          <ul className="mt-3 space-y-0.5">
            {navItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={goTo(item.id)}
                  className="link-draw inline-block py-2.5 text-text/80 [--link-pad:0.625rem] hover:text-gold-light"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <h2 className="eyebrow text-gold">Visit</h2>
          <address className="mt-5 space-y-4 text-text/80 not-italic">
            <p className="max-w-[28ch]">{studioAddressLine}</p>
            <ul className="space-y-1 text-sm">
              {studio.hours.map((h) => {
                const { days, time } = formatHours(h);
                return (
                  <li key={days}>
                    <span className="text-muted">{days}</span> · {time}
                  </li>
                );
              })}
            </ul>
          </address>
        </div>

        <div className="lg:col-span-3">
          <h2 className="eyebrow text-gold">Contact</h2>
          <ul className="mt-3 space-y-0.5 text-text/80">
            <li>
              <a
                href={telLink()}
                className="link-draw inline-block py-2.5 [--link-pad:0.625rem] hover:text-gold-light"
              >
                {studio.phone}
              </a>
            </li>
            <li>
              <a
                href={mailtoLink()}
                className="link-draw inline-block py-2.5 break-all [--link-pad:0.625rem] hover:text-gold-light"
              >
                {studio.email}
              </a>
            </li>
            {studio.socials.map((s) => (
              <li key={s.platform}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-draw inline-block py-2.5 [--link-pad:0.625rem] hover:text-gold-light"
                >
                  {s.platform}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <Container className="mt-20 flex flex-col gap-2 border-t border-line py-6 text-xs text-muted sm:flex-row sm:justify-between">
        <p>
          © {YEAR} {studio.name}
        </p>
        <p>
          {studio.address.locality}, {studio.address.region}
          {studio.foundedYear && <> · Since {studio.foundedYear}</>}
        </p>
      </Container>

      {/* Final flourish: a large outlined "Aakar" (decorative). */}
      <p
        aria-hidden="true"
        className="footer-flourish pointer-events-none -mb-[0.18em] text-center display text-[clamp(6rem,27vw,26rem)] leading-none text-transparent select-none [-webkit-text-stroke:1px_rgb(207_154_62/0.35)]"
      >
        Aakar
      </p>
    </footer>
  );
}
