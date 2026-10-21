import { z } from 'zod';
import { services } from '@/data/services';
import { STUDIO_TIME_ZONE } from './hours';

// Contact form (spec 5, item 17): fields, validation and the WhatsApp fallback message. The
// online submission (Web3Forms or Formspree) is wired in Phase 8; WhatsApp stays as a second path.

export const shootTypes = [
  ...services.map((s) => s.title),
  'Passport, printing or framing',
  'Something else',
];

/** Today's date as YYYY-MM-DD in the studio's timezone (the date input's `min`). */
export function todayInStudio(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: STUDIO_TIME_ZONE }).format(date);
}

// 10 digits, optionally after +91, 91 or a leading 0; spaces and dashes ignored.
const PHONE_RE = /^(?:\+?91|0)?[1-9]\d{9}$/;

export const inquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Please enter your name.')
    .min(2, 'Please enter at least 2 letters.')
    .max(80, 'Please shorten your name.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Please enter your phone number.')
    .refine(
      (v) => PHONE_RE.test(v.replace(/[\s-]/g, '')),
      'Please enter a valid 10-digit phone number.',
    ),
  shootType: z.string().min(1, 'Please choose a shoot type.'),
  date: z
    .string()
    .refine((v) => v === '' || v >= todayInStudio(), 'Please choose a date from today onwards.'),
  message: z.string().trim().max(1000, 'Please keep your message under 1,000 characters.'),
});

export type InquiryInput = z.input<typeof inquirySchema>;
export type InquiryValues = z.output<typeof inquirySchema>;

export const emptyInquiry: InquiryInput = {
  name: '',
  phone: '',
  shootType: '',
  date: '',
  message: '',
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** The WhatsApp message pre-filled from whatever the visitor has typed; empty fields are left out. */
export function inquiryWhatsappMessage(values: Partial<InquiryInput>) {
  const v = (key: keyof InquiryInput) => values[key]?.trim() ?? '';
  const lines = [
    v('shootType') && v('shootType') !== 'Something else'
      ? `Hi Aakar Digital Photo Studio, I'd like to enquire about: ${v('shootType')}.`
      : "Hi Aakar Digital Photo Studio, I'd like to enquire about a photoshoot.",
  ];
  if (v('name')) lines.push(`Name: ${v('name')}`);
  if (v('phone')) lines.push(`Phone: ${v('phone')}`);
  if (v('date')) lines.push(`Preferred date: ${formatDate(v('date'))}`);
  if (v('message')) lines.push('', v('message'));
  return lines.join('\n');
}
