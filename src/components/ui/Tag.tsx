import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Small uppercase label (themes, event types). Quiet: hairline outline, no fill. */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xs border border-current/25 px-2 py-0.5 text-[0.65rem] font-semibold tracking-[0.2em] uppercase',
        className,
      )}
    >
      {children}
    </span>
  );
}
