import { Menu, MessageCircle } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { hero } from '@/data/copy';
import { navItems } from '@/data/navigation';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';
import { goTo } from '@/lib/scroll';
import { whatsappLink } from '@/lib/whatsapp';
import { MobileMenu } from './MobileMenu';

/** Scroll distance (px) in one direction before the header hides or shows: ignores jitter. */
const DIRECTION_THRESHOLD = 6;

/**
 * Site header (spec 5, item 2). Height is --header-offset (index.css).
 * - Background: a blurred bar whose opacity follows scroll progress through the hero, so it
 *   arrives smoothly and is fully solid by the hero's bottom edge (opacity only).
 * - After the hero it hides on scroll down and returns on scroll up (translate). It always shows
 *   while the mobile menu is open or focus is inside it, and never hides with reduced motion.
 */
export function Header() {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const background = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    let isHidden = false;
    let lastOpacity = -1;
    const hide = (next: boolean) => {
      if (next === isHidden) return; // state only changes on a direction change, not per frame
      isHidden = next;
      setHidden(next);
    };
    // Where the hero ends under the header. Measured on resize only: reading layout inside the
    // scroll handler would force a style recalc on every frame.
    let heroEnd = window.innerHeight;
    const heroEl = document.getElementById('top');
    const measure = () => {
      const headerHeight = header.current?.offsetHeight ?? 0;
      heroEnd = Math.max(1, (heroEl?.offsetHeight ?? window.innerHeight) - headerHeight);
    };
    const sizes = new ResizeObserver(() => {
      measure();
      onScroll();
    });

    // The position is read in the scroll event, before this frame's style writes: reading it
    // inside requestAnimationFrame, after GSAP has written transforms, forces a style recalc.
    let y = window.scrollY;
    const update = () => {
      frame = 0;

      // Written only when it changes (it stays at 1 for the rest of the page).
      const opacity = Math.round(Math.min(1, Math.max(0, y / heroEnd)) * 100) / 100;
      if (background.current && opacity !== lastOpacity) {
        background.current.style.opacity = String(opacity);
        lastOpacity = opacity;
      }

      if (y <= heroEnd || prefersReducedMotion()) {
        hide(false);
        lastY = y;
        return;
      }
      const delta = y - lastY;
      if (Math.abs(delta) < DIRECTION_THRESHOLD) return;
      hide(delta > 0);
      lastY = y;
    };
    const onScroll = () => {
      y = window.scrollY;
      frame ||= requestAnimationFrame(update);
    };

    measure();
    update();
    if (heroEl) sizes.observe(heroEl);
    if (header.current) sizes.observe(header.current);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      sizes.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header
      ref={header}
      data-hidden={hidden && !menuOpen}
      className="site-header fixed inset-x-0 top-0 isolate z-50 h-(--header-offset) transition-[translate] duration-(--duration-base) ease-out data-[hidden=true]:not-focus-within:-translate-y-full"
    >
      <div
        ref={background}
        aria-hidden="true"
        className="absolute inset-0 -z-10 border-b border-line bg-bg/85 opacity-0 backdrop-blur-md"
      />
      <Container className="flex h-full items-center justify-between gap-6">
        <a
          href="#top"
          onClick={goTo('top')}
          aria-label="Aakar Digital Photo Studio, back to top"
          className="shrink-0 py-1"
        >
          <Logo variant="horizontal" compact tone="light" className="h-9 w-auto lg:h-11" />
        </a>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {navItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={goTo(item.id)}
                  className="link-draw eyebrow text-xs text-text/80 hover:text-gold-light lg:text-[0.7rem]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            href={whatsappLink(hero.whatsappMessage)}
            icon={<MessageCircle />}
            className="hidden sm:inline-flex"
          >
            {hero.ctaWhatsapp}
          </Button>
          <button
            ref={menuButton}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            // Only while the menu exists: it isn't in the DOM when closed (axe: aria-valid-attr-value).
            aria-controls={menuOpen ? 'mobile-menu' : undefined}
            className="-mr-2 inline-flex size-11 items-center justify-center text-text lg:hidden"
          >
            <Menu aria-hidden="true" className="size-6" strokeWidth={1.5} />
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {menuOpen && (
          <MobileMenu
            key="mobile-menu"
            onClose={() => {
              setMenuOpen(false);
              menuButton.current?.focus();
            }}
          />
        )}
      </AnimatePresence>
    </header>
  );
}
