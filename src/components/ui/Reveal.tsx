import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
} from 'react';
import { observeReveal } from '@/lib/reveal';

export type RevealVariant = 'up' | 'fade' | 'photo' | 'line';

type RevealProps<T extends ElementType> = {
  as?: T;
  /** up = fade and slide (text, cards); photo = clip-path wipe with a scale settle; line = draw. */
  variant?: RevealVariant;
  /** Position among items that enter together (a row of cards): each step reveals a bit later. */
  index?: number;
} & Omit<ComponentPropsWithoutRef<T>, 'as'>;

/**
 * Scroll reveal (spec 3, 13). The animation is pure CSS (src/styles/animations.css): scroll-driven
 * where supported, otherwise a one-off IntersectionObserver transition. Nothing is hidden unless
 * html.motion-ok is set, so content is always visible without JS and with reduced motion.
 */
export function Reveal<T extends ElementType = 'div'>({
  as,
  variant = 'up',
  index = 0,
  style,
  ...props
}: RevealProps<T>) {
  const ref = useRef<HTMLElement>(null);
  const Tag: ElementType = as ?? 'div';

  useEffect(() => (ref.current ? observeReveal(ref.current) : undefined), []);

  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      style={index ? ({ '--reveal-i': index, ...style } as CSSProperties) : style}
      {...props}
    />
  );
}
