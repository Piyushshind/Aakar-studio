import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cn } from '@/lib/cn';

type ContainerProps<T extends ElementType> = { as?: T } & ComponentPropsWithoutRef<T>;

/** Page container (spec 4.4): max ~1440px with the fluid side gutter. */
export function Container<T extends ElementType = 'div'>({
  as,
  className,
  ...props
}: ContainerProps<T>) {
  const Tag = as ?? 'div';
  return (
    <Tag className={cn('mx-auto w-full max-w-[1440px] px-(--gutter)', className)} {...props} />
  );
}
