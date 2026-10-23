import { useEffect, useState } from 'react';
import { studio } from '@/data/studio';
import { cn } from '@/lib/cn';
import { describeOpenStatus, getOpenStatus, type OpenStatus as Status } from '@/lib/hours';

/**
 * "Open now" / "Closed" pill, worked out in Asia/Kolkata from studio.hours and refreshed every
 * minute. Renders nothing until mounted, so a pre-rendered page (Phase 9) never bakes in a stale
 * status.
 */
export function OpenStatus({ className }: { className?: string }) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    const update = () => setStatus(getOpenStatus(studio.hours, new Date()));
    const first = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  if (!status) return null;
  const { label, detail } = describeOpenStatus(status);

  return (
    <p
      className={cn(
        'open-status inline-flex flex-wrap items-center gap-x-2.5 gap-y-0.5 rounded-2xl border px-3.5 py-1.5 text-sm',
        status.open ? 'border-[#8fbf8f]/40 text-text' : 'border-line text-muted',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-2 rounded-full', status.open ? 'bg-[#8fbf8f]' : 'bg-muted/70')}
      />
      <span className="font-semibold">{label}</span>
      {detail && <span className="whitespace-nowrap text-muted">· {detail}</span>}
    </p>
  );
}
