import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export type SectionTone = 'dark' | 'surface' | 'cream';

const TONES: Record<SectionTone, string> = {
  dark: 'bg-bg text-text',
  surface: 'bg-surface text-text',
  cream: 'bg-cream-bg text-brown',
};

interface SectionProps extends ComponentProps<'section'> {
  id: string;
  tone?: SectionTone;
  /** Vertical rhythm: 'none' for sections that manage their own spacing (hero, bands). */
  spacing?: 'default' | 'none';
}

/**
 * A page section with a stable id (navigation, scrollToSection) and the shared vertical rhythm.
 * Sections are labelled by their heading: pass aria-labelledby with the SectionHeading id.
 */
export function Section({ tone = 'dark', spacing = 'default', className, ...props }: SectionProps) {
  return (
    <section
      data-tone={tone}
      className={cn(
        'relative',
        TONES[tone],
        spacing === 'default' && 'py-(--section-space)',
        className,
      )}
      {...props}
    />
  );
}
