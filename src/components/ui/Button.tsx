import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface BaseProps {
  variant?: ButtonVariant;
  /** cream = for cream sections (brown fill / brown outline). */
  tone?: 'dark' | 'cream';
  size?: 'md' | 'lg';
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = BaseProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof BaseProps> & { href?: undefined };
type ButtonAsLink = BaseProps &
  Omit<ComponentPropsWithoutRef<'a'>, keyof BaseProps> & { href: string };

// Micro-interactions (Phase 6), transform and opacity only:
// - primary: a soft light sheen sweeps across on hover (motion-safe; plain colour otherwise)
// - secondary: a faint gold fill rises from the bottom
// - ghost: the underline redraws from the left (on the label, see GHOST_LINE)
// - all: a gentle press scale
const SHEEN =
  'before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-1/2 before:-translate-x-full before:skew-x-[-20deg] before:bg-linear-to-r before:from-transparent before:via-white/35 before:to-transparent motion-safe:hover:before:translate-x-[250%] motion-safe:hover:before:transition-[translate] motion-safe:hover:before:duration-(--duration-slow)';
const FILL =
  'before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:transition-[scale] before:duration-(--duration-base) hover:before:scale-y-100 focus-visible:before:scale-y-100';

const VARIANTS: Record<'dark' | 'cream', Record<ButtonVariant, string>> = {
  dark: {
    primary: `bg-gold text-bg motion-reduce:hover:bg-gold-light ${SHEEN}`,
    secondary: `border border-text/35 text-text before:bg-gold/12 hover:border-gold ${FILL}`,
    // Ghost: invisible vertical padding (cancelled by negative margin) for a 44px tap target.
    ghost: '-my-3.5 px-0 py-3.5 text-text hover:text-gold-light',
  },
  cream: {
    primary: `bg-brown text-cream-bg motion-reduce:hover:bg-[#4a2f1d] ${SHEEN}`,
    secondary: `border border-brown/40 text-brown before:bg-brown/8 hover:border-brown ${FILL}`,
    ghost: '-my-3.5 px-0 py-3.5 text-brown',
  },
};

/** Ghost underline: a quiet base line, and a brighter one that draws in on hover and focus. */
const GHOST_LINE = {
  dark: 'relative before:absolute before:inset-x-0 before:-bottom-2 before:h-px before:bg-gold/60 after:absolute after:inset-x-0 after:-bottom-2 after:h-px after:origin-right after:scale-x-0 after:bg-gold-light after:transition-[scale] after:duration-(--duration-base) group-hover/button:after:origin-left group-hover/button:after:scale-x-100 group-focus-visible/button:after:origin-left group-focus-visible/button:after:scale-x-100',
  cream:
    'relative before:absolute before:inset-x-0 before:-bottom-2 before:h-px before:bg-brown/40 after:absolute after:inset-x-0 after:-bottom-2 after:h-px after:origin-right after:scale-x-0 after:bg-brown after:transition-[scale] after:duration-(--duration-base) group-hover/button:after:origin-left group-hover/button:after:scale-x-100 group-focus-visible/button:after:origin-left group-focus-visible/button:after:scale-x-100',
};

// min-height, not height: on phones a long label may wrap (below) and the button grows.
const SIZES = {
  md: 'min-h-11 px-5 py-2 text-xs lg:text-[0.7rem]',
  lg: 'min-h-13 px-7 py-2.5 text-xs',
};

/**
 * CTA button (spec 5): primary gold, secondary outline, ghost text link. Renders <a> with
 * `href` (WhatsApp, tel, mailto, #anchors), otherwise <button>. Small radius, uppercase tracked.
 */
export function Button(props: ButtonAsButton | ButtonAsLink) {
  const {
    variant = 'primary',
    tone = 'dark',
    size = 'md',
    icon,
    className,
    children,
    ...rest
  } = props;
  const ghost = variant === 'ghost';
  const classes = cn(
    'group/button inline-flex items-center justify-center gap-2.5 rounded-xs font-semibold tracking-[0.2em] text-center whitespace-normal sm:whitespace-nowrap uppercase transition-[scale] duration-(--duration-fast) motion-safe:active:scale-[0.97]',
    // The sheen and fill are clipped to the button; the ghost underline sits below it.
    !ghost && 'relative isolate overflow-clip',
    SIZES[size],
    VARIANTS[tone][variant],
    ghost && 'min-h-0',
    className,
  );
  const content = (
    <>
      {icon && (
        <span aria-hidden="true" className="-ml-0.5 [&>svg]:size-4">
          {icon}
        </span>
      )}
      <span className={ghost ? GHOST_LINE[tone] : undefined}>{children}</span>
    </>
  );

  if (rest.href !== undefined) {
    const { href, ...anchor } = rest as Omit<ButtonAsLink, keyof BaseProps>;
    const external = /^https?:/.test(href);
    return (
      <a
        href={href}
        className={classes}
        {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
        {...anchor}
      >
        {content}
      </a>
    );
  }
  const { type = 'button', ...button } = rest as Omit<ButtonAsButton, keyof BaseProps>;
  return (
    <button type={type} className={classes} {...button}>
      {content}
    </button>
  );
}
