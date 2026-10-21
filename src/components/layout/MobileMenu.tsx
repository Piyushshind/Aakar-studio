import { MessageCircle, Phone, X } from 'lucide-react';
import { m, useIsPresent, type Variants } from 'motion/react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { hero } from '@/data/copy';
import { navItems } from '@/data/navigation';
import { studio } from '@/data/studio';
import { reveal, stagger, transition } from '@/lib/motion';
import { getActiveLenis, scrollToSection } from '@/lib/scroll';
import { telLink, whatsappLink } from '@/lib/whatsapp';

const FOCUSABLE = 'a[href], button:not([disabled])';

// Enter: the backdrop fades in, then the links rise in one after another. Exit: a quick fade.
// MotionConfig reducedMotion="user" drops the movement and keeps the fades.
const panel: Variants = {
  hidden: { opacity: 0, transition: transition.fast },
  shown: {
    opacity: 1,
    transition: { ...transition.fast, delayChildren: stagger.loose, staggerChildren: stagger.base },
  },
};
const item: Variants = {
  hidden: { opacity: 0, y: reveal.y.mobile },
  shown: { opacity: 1, y: 0, transition: transition.base },
};

/**
 * Full-screen mobile menu (spec 5, item 2): modal dialog with focus trap, Esc to close and body
 * scroll lock (Lenis too). Portalled to <body> so a transformed header never becomes its
 * containing block. While the exit animation plays it is inert, and the lock is already released.
 */
export function MobileMenu({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  const isPresent = useIsPresent();
  // The parent passes a new function each render; the effect must run only once per opening.
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!isPresent) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    getActiveLenis()?.stop();
    dialog.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close.current();
        return;
      }
      if (event.key !== 'Tab' || !dialog.current) return;
      const items = [...dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      root.style.overflow = previousOverflow;
      getActiveLenis()?.start();
    };
  }, [isPresent]);

  const navigate = (id: string) => {
    onClose();
    // Scroll after the lock is released.
    requestAnimationFrame(() => scrollToSection(id));
  };

  return createPortal(
    <m.div
      ref={dialog}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      inert={!isPresent}
      variants={panel}
      initial="hidden"
      animate="shown"
      exit="hidden"
      className="mobile-menu fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-bg lg:hidden"
    >
      <Container className="flex h-(--header-offset) shrink-0 items-center justify-between">
        <Logo variant="horizontal" compact tone="light" className="h-9 w-auto" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="-mr-2 inline-flex size-11 items-center justify-center"
        >
          <X aria-hidden="true" className="size-6" strokeWidth={1.5} />
        </button>
      </Container>

      <Container as="nav" aria-label="Main" className="flex flex-1 flex-col justify-center py-10">
        <ul className="space-y-1">
          {navItems.map((navItem, i) => (
            <m.li key={navItem.id} variants={item}>
              <a
                href={`#${navItem.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(navItem.id);
                }}
                className="mobile-menu-link flex items-baseline gap-5 py-2"
              >
                <span aria-hidden="true" className="w-6 eyebrow text-gold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="display text-[clamp(2.5rem,11vw,4rem)]">{navItem.label}</span>
              </a>
            </m.li>
          ))}
        </ul>
      </Container>

      <m.div variants={item} className="shrink-0 border-t border-line">
        <Container className="space-y-6 py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">
            <Button href={whatsappLink(hero.whatsappMessage)} icon={<MessageCircle />} size="lg">
              {hero.ctaWhatsapp}
            </Button>
            <Button href={telLink()} variant="secondary" icon={<Phone />} size="lg">
              {studio.phone}
            </Button>
          </div>
          <p className="eyebrow text-[0.65rem] text-muted">
            {studio.subTagline} · {studio.address.locality}
          </p>
        </Container>
      </m.div>
    </m.div>,
    document.body,
  );
}
