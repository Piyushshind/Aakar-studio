import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, LoaderCircle, MessageCircle, RotateCcw, Send } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { useId, useState, type BaseSyntheticEvent, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import {
  emptyInquiry,
  inquiryOnline,
  inquirySchema,
  inquiryWhatsappMessage,
  shootTypes,
  submitInquiry,
  todayInStudio,
  type InquiryInput,
  type InquiryValues,
} from '@/lib/inquiry';
import { transition } from '@/lib/motion';
import { whatsappLink } from '@/lib/whatsapp';

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; name: string }
  | { kind: 'error' }
  /** No Web3Forms key configured: the enquiry goes by WhatsApp instead. */
  | { kind: 'offline'; name: string };

const FIELD =
  'w-full rounded-none border-0 border-b border-text/20 bg-transparent px-0 py-3 text-body text-text placeholder:text-muted/60 hover:border-text/40 focus:border-gold focus:shadow-[0_1px_0_0_var(--color-gold)] focus:outline-none focus-visible:outline-none aria-invalid:border-[#e8a39b]';

function Field({
  id,
  label,
  optional = false,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="eyebrow text-xs text-text/80 lg:text-[0.65rem]">
        {label}
        {optional && (
          <span className="ml-2 tracking-[0.12em] text-muted normal-case">(optional)</span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-[#efb3ab]">
          {error}
        </p>
      )}
    </div>
  );
}

/** A gold ring and tick that draw in (Motion pathLength), for the "sent" message. */
function SentMark() {
  const reducedMotion = useReducedMotion();
  const draw = (delay: number) =>
    reducedMotion
      ? { initial: false as const }
      : {
          initial: { pathLength: 0 },
          animate: { pathLength: 1 },
          transition: { ...transition.slow, delay },
        };
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className="size-12 shrink-0 text-gold"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <m.circle cx="24" cy="24" r="22" {...draw(0)} />
      <m.path d="M15 24.5l6 6 12-13" {...draw(0.35)} />
    </svg>
  );
}

/**
 * Inquiry form (spec 5, item 17): react-hook-form + zod with inline errors, sent to the studio's
 * inbox through Web3Forms, with animated sending, sent and error states. "Send on WhatsApp
 * instead" is permanent: it opens WhatsApp with whatever has been typed so far, no validation
 * needed. If no Web3Forms key is configured, the form says so and offers WhatsApp.
 */
export function InquiryForm() {
  const uid = useId();
  const id = (name: keyof InquiryInput) => `${uid}-${name}`;
  const [minDate] = useState(() => todayInStudio());
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<InquiryInput, unknown, InquiryValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: emptyInquiry,
    mode: 'onTouched',
  });
  const values = useWatch({ control });
  const whatsappHref = whatsappLink(inquiryWhatsappMessage(values));

  // Shared props: aria-invalid plus the error id, so screen readers read the message.
  const a11y = (name: keyof InquiryInput) => ({
    id: id(name),
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${id(name)}-error` : undefined,
  });

  const onSubmit = async (data: InquiryValues, event?: BaseSyntheticEvent) => {
    const form = event?.target instanceof HTMLFormElement ? event.target : null;
    // Bring the result into view afterwards (on phones it can be below the fold).
    const showResult = () =>
      requestAnimationFrame(() =>
        form?.querySelector('[role="status"]')?.scrollIntoView({ block: 'nearest' }),
      );
    if (!inquiryOnline) {
      setStatus({ kind: 'offline', name: data.name });
      showResult();
      return;
    }
    setStatus({ kind: 'sending' });
    try {
      await submitInquiry(data, form ? new FormData(form).has('botcheck') : false);
      setStatus({ kind: 'sent', name: data.name });
      reset(emptyInquiry);
    } catch {
      setStatus({ kind: 'error' });
    }
    showResult();
  };
  const sending = status.kind === 'sending';

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      aria-label="Send an enquiry"
      className="inquiry-form grid gap-x-8 gap-y-9 sm:grid-cols-2"
    >
      <Field id={id('name')} label="Your name" error={errors.name?.message}>
        <input
          {...register('name')}
          {...a11y('name')}
          type="text"
          autoComplete="name"
          required
          className={FIELD}
        />
      </Field>

      <Field id={id('phone')} label="Phone" error={errors.phone?.message}>
        <input
          {...register('phone')}
          {...a11y('phone')}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98xxxxxxxx"
          required
          className={FIELD}
        />
      </Field>

      <Field id={id('shootType')} label="Shoot type" error={errors.shootType?.message}>
        <div className="relative">
          <select
            {...register('shootType')}
            {...a11y('shootType')}
            required
            className={cn(
              FIELD,
              'cursor-pointer appearance-none pr-8 [&>option]:bg-surface',
              !values.shootType && 'text-muted/80',
            )}
          >
            <option value="" disabled>
              Choose one
            </option>
            {shootTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            strokeWidth={1.5}
            className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 text-gold"
          />
        </div>
      </Field>

      <Field id={id('date')} label="Preferred date" optional error={errors.date?.message}>
        <input
          {...register('date')}
          {...a11y('date')}
          type="date"
          min={minDate}
          className={cn(FIELD, '[color-scheme:dark]', !values.date && 'text-muted/80')}
        />
      </Field>

      <Field
        id={id('message')}
        label="Tell us about your shoot"
        optional
        error={errors.message?.message}
        className="sm:col-span-2"
      >
        <textarea
          {...register('message')}
          {...a11y('message')}
          rows={4}
          placeholder="Occasion, theme, location, anything you have in mind"
          className={cn(FIELD, 'resize-y')}
        />
      </Field>

      {/* Honeypot (Web3Forms botcheck): off-screen and skipped by keyboard and screen readers. */}
      <input
        type="checkbox"
        name="botcheck"
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        className="absolute -left-[9999px] size-px opacity-0"
      />

      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">
        <Button
          type="submit"
          size="lg"
          disabled={sending}
          aria-disabled={sending || undefined}
          icon={sending ? <LoaderCircle className="motion-safe:animate-spin" /> : <Send />}
          className="disabled:cursor-progress disabled:opacity-80"
        >
          {sending ? 'Sending…' : 'Send enquiry'}
        </Button>
        <Button href={whatsappHref} variant="secondary" size="lg" icon={<MessageCircle />}>
          Send on WhatsApp instead
        </Button>
      </div>

      <div role="status" aria-live="polite" className="sm:col-span-2">
        <AnimatePresence mode="wait" initial={false}>
          {(status.kind === 'sent' || status.kind === 'error' || status.kind === 'offline') && (
            <m.div
              key={status.kind}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: transition.fast }}
              className={cn(
                'border p-5 sm:p-6',
                status.kind === 'error'
                  ? 'border-[#e8a39b]/50 bg-[#e8a39b]/5'
                  : 'border-gold/40 bg-gold/5',
              )}
            >
              {status.kind === 'sent' && (
                <div className="flex items-start gap-5">
                  <SentMark />
                  <div>
                    <p className="font-display text-xl text-text">Thank you, {status.name}.</p>
                    <p className="mt-2 text-muted">
                      Your enquiry has reached the studio. We'll call or WhatsApp you soon.
                    </p>
                    <Button
                      variant="ghost"
                      icon={<RotateCcw />}
                      className="mt-5"
                      onClick={() => setStatus({ kind: 'idle' })}
                    >
                      Send another enquiry
                    </Button>
                  </div>
                </div>
              )}
              {status.kind === 'error' && (
                <>
                  <p className="text-text">Sorry, your enquiry couldn't be sent.</p>
                  <p className="mt-2 text-muted">
                    Please check your connection and try again, or send it on WhatsApp: your details
                    are already filled in.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button type="submit" icon={<RotateCcw />}>
                      Try again
                    </Button>
                    <Button href={whatsappHref} variant="secondary" icon={<MessageCircle />}>
                      Send on WhatsApp
                    </Button>
                  </div>
                </>
              )}
              {status.kind === 'offline' && (
                <>
                  <p className="text-text">
                    Thank you, {status.name}. Online enquiries aren't connected yet, so this form
                    hasn't been sent.
                  </p>
                  <p className="mt-2 text-muted">
                    Please send it on WhatsApp instead: your details are already filled in.
                  </p>
                  <Button href={whatsappHref} icon={<MessageCircle />} className="mt-5">
                    Send on WhatsApp
                  </Button>
                </>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
