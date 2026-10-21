import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, MessageCircle, Send } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import {
  emptyInquiry,
  inquirySchema,
  inquiryWhatsappMessage,
  shootTypes,
  todayInStudio,
  type InquiryInput,
  type InquiryValues,
} from '@/lib/inquiry';
import { whatsappLink } from '@/lib/whatsapp';

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
      <label htmlFor={id} className="eyebrow text-[0.65rem] text-text/80">
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

/**
 * Inquiry form (spec 5, item 17): react-hook-form + zod with inline errors. Online submission is
 * a stub until Phase 8 (Web3Forms or Formspree). "Send on WhatsApp instead" is permanent: it
 * opens WhatsApp with whatever has been typed so far, no validation needed.
 */
export function InquiryForm() {
  const uid = useId();
  const id = (name: keyof InquiryInput) => `${uid}-${name}`;
  const [minDate] = useState(() => todayInStudio());
  const [sentName, setSentName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
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

  const onSubmit = (data: InquiryValues) => {
    // Phase 8: post to Web3Forms or Formspree and show the animated success / error states.
    setSentName(data.name);
  };

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

      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">
        <Button type="submit" size="lg" icon={<Send />}>
          Send enquiry
        </Button>
        <Button href={whatsappHref} variant="secondary" size="lg" icon={<MessageCircle />}>
          Send on WhatsApp instead
        </Button>
      </div>

      <div role="status" aria-live="polite" className="empty:hidden sm:col-span-2">
        {sentName !== null && (
          <div className="border border-gold/40 bg-gold/5 p-5 sm:p-6">
            <p className="text-text">
              Thank you, {sentName}. Online enquiries aren't connected yet, so this form hasn't been
              sent.
            </p>
            <p className="mt-2 text-muted">
              Please send it on WhatsApp instead: your details are already filled in.
            </p>
            <Button href={whatsappHref} icon={<MessageCircle />} className="mt-5">
              Send on WhatsApp
            </Button>
            {import.meta.env.DEV && (
              <p className="mt-4 text-xs text-muted">
                Dev: submission is stubbed. Web3Forms or Formspree is wired in Phase 8.
              </p>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
