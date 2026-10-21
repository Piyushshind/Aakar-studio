import { useRef, type ReactNode } from 'react';
import { useKineticTitle } from '@/hooks/useKineticTitle';
import { cn } from '@/lib/cn';
import { Reveal } from './Reveal';

interface SectionHeadingProps {
  /** Id for the h2, referenced by the section's aria-labelledby. */
  id: string;
  /** "01" in "01 — Our work". */
  number?: string;
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: 'left' | 'center';
  /** split = title left, intro right (bottom-aligned) from lg up. */
  layout?: 'stacked' | 'split';
  /** cream = brown text for cream sections. */
  tone?: 'dark' | 'cream';
  className?: string;
}

/**
 * Eyebrow (number, hairline rule, label), a large Fraunces h2 and an optional intro.
 * The title is kinetic (SplitText lines, useKineticTitle); eyebrow and intro reveal on scroll.
 */
export function SectionHeading({
  id,
  number,
  eyebrow,
  title,
  intro,
  align = 'left',
  layout = 'stacked',
  tone = 'dark',
  className,
}: SectionHeadingProps) {
  const cream = tone === 'cream';
  const split = layout === 'split';
  const titleRef = useRef<HTMLHeadingElement>(null);
  useKineticTitle(titleRef);
  return (
    <header
      className={cn(
        'section-heading',
        layout === 'split' ? 'lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-12' : 'max-w-4xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      <Reveal
        as="p"
        className={cn(
          'flex items-center gap-4 eyebrow',
          split && 'lg:col-span-12',
          align === 'center' && 'justify-center',
          cream ? 'text-gold-deep' : 'text-gold',
        )}
      >
        {number && <span aria-hidden="true">{number}</span>}
        {number && (
          <span
            aria-hidden="true"
            className={cn('h-px w-10', cream ? 'bg-gold-deep/50' : 'bg-gold/60')}
          />
        )}
        <span>{eyebrow}</span>
      </Reveal>
      <h2
        ref={titleRef}
        id={id}
        className={cn(
          'section-title mt-6 display text-[clamp(2.5rem,6.2vw,5.75rem)]',
          split && 'lg:col-span-7',
          cream ? 'text-brown' : 'text-text',
        )}
      >
        {title}
      </h2>
      {intro && (
        <Reveal
          as="p"
          index={1}
          className={cn(
            'mt-6 max-w-[60ch] text-body text-pretty',
            split && 'lg:col-span-5 lg:col-start-8 lg:mt-0 lg:pb-2',
            align === 'center' && 'mx-auto',
            cream ? 'text-brown/85' : 'text-muted',
          )}
        >
          {intro}
        </Reveal>
      )}
    </header>
  );
}
