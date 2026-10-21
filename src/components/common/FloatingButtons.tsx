import { ArrowUp, MessageCircle } from 'lucide-react';
import { hero } from '@/data/copy';
import { useAnyInView } from '@/hooks/useAnyInView';
import { cn } from '@/lib/cn';
import { scrollToSection } from '@/lib/scroll';
import { whatsappLink } from '@/lib/whatsapp';

// Fixed buttons step aside wherever they could cover a full-width mobile CTA or the footer links:
// the hero CTAs, the quote band buttons, the contact section (form and its submit button) and the
// footer. Those places all offer WhatsApp themselves.
const FAB_AVOID = '.hero-ctas, .quote-ctas, #contact, footer';
const TOP_AVOID = '.quote-ctas, .inquiry-form';

const FLOAT =
  'fixed right-4 z-40 transition-[opacity,translate] duration-(--duration-base) ease-out sm:right-6';
const HIDDEN = 'pointer-events-none translate-y-3 opacity-0';

/**
 * Floating WhatsApp button (all devices) and back-to-top (after the hero), bottom-right
 * (spec 5, global extras). Hidden buttons are inert, so they're never focusable.
 */
export function FloatingButtons() {
  const heroInView = useAnyInView('#top');
  const fabBlocked = useAnyInView(FAB_AVOID);
  const topBlocked = useAnyInView(TOP_AVOID);
  const showFab = !fabBlocked;
  const showTop = !heroInView && !topBlocked;

  return (
    <>
      <a
        href={whatsappLink(hero.whatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        inert={!showFab}
        className={cn(
          FLOAT,
          'bottom-[max(1rem,env(safe-area-inset-bottom))] flex size-14 items-center justify-center rounded-full bg-gold text-bg shadow-[0_12px_30px_-12px_rgb(0_0_0/0.8)] motion-safe:active:scale-95 sm:bottom-6',
          !showFab && HIDDEN,
        )}
      >
        <MessageCircle aria-hidden="true" className="size-6" strokeWidth={1.75} />
      </a>
      <button
        type="button"
        onClick={() => scrollToSection('top')}
        aria-label="Back to top"
        inert={!showTop}
        className={cn(
          FLOAT,
          'bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.5rem)] flex size-11 items-center justify-center rounded-full border border-line bg-bg/80 text-text backdrop-blur-md hover:border-gold/60 sm:right-7.5 sm:bottom-[6rem]',
          !showTop && HIDDEN,
        )}
      >
        <ArrowUp aria-hidden="true" className="size-4" strokeWidth={1.5} />
      </button>
    </>
  );
}
