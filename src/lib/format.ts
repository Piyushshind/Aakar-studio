import type { OpeningHours } from '@/types/content';

/** '20:00' → '8:00 PM'. */
export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** 'Monday to Saturday', '10:00 AM – 8:00 PM'. */
export function formatHours(hours: OpeningHours) {
  return { days: hours.days, time: `${formatTime(hours.opens)} – ${formatTime(hours.closes)}` };
}

/** Curly apostrophes for display type ("we'll" → "we’ll"); data files keep plain ASCII. */
export function typographic(text: string) {
  return text.replaceAll("'", '’');
}
