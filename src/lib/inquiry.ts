import { z } from 'zod';
import { services } from '@/data/services';
import { STUDIO_TIME_ZONE } from './hours';

// Contact form (spec 5, item 17): fields, validation, online submission (Web3Forms) and the
// WhatsApp message. WhatsApp stays as a second path, and the only one until a key is set.

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

// The studio's Web3Forms access key (form "aakar studio", aakardigital81@gmail.com). Public by
// design: it can only send to that inbox, so it lives here and every deploy works without host
// settings. VITE_WEB3FORMS_KEY overrides it (e.g. a test form).
const STUDIO_WEB3FORMS_KEY = '447af0d1-b579-4e21-8b7b-a6a17eb3c387';
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY?.trim() || STUDIO_WEB3FORMS_KEY;
const WEB3FORMS_URL = 'https://api.web3forms.com/submit';
const SUBMIT_TIMEOUT_MS = 15_000;

/** True when the form can send online (a Web3Forms key is configured). */
export const inquiryOnline = WEB3FORMS_KEY !== '';

/**
 * Sends the enquiry to the studio's inbox through Web3Forms. Throws on a network error, a timeout
 * or a rejected submission. `botcheck` is the honeypot: real visitors never fill it.
 */
export async function submitInquiry(values: InquiryValues, botcheck = false) {
  const response = await fetch(WEB3FORMS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
    body: JSON.stringify({
      access_key: WEB3FORMS_KEY,
      subject: `Website enquiry: ${values.shootType} (${values.name})`,
      from_name: 'Aakar website',
      botcheck,
      Name: values.name,
      Phone: values.phone,
      'Shoot type': values.shootType,
      'Preferred date': values.date ? formatDate(values.date) : 'Not given',
      Message: values.message || '(none)',
    }),
  });
  const result = (await response.json().catch(() => null)) as { success?: boolean } | null;
  if (!response.ok || !result?.success) throw new Error(`Web3Forms: ${response.status}`);
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
