import type { DayOfWeek, OpeningHours } from '@/types/content';
import { formatTime } from './format';

// "Open now" is always worked out in the studio's timezone, whatever the visitor's clock says.
export const STUDIO_TIME_ZONE = 'Asia/Kolkata';

const DAYS: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Weekday and minutes since midnight at `date`, in `timeZone`. */
export function zonedClock(date: Date, timeZone = STUDIO_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return {
    day: get('weekday') as DayOfWeek,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

export type OpenStatus =
  | { open: true; closes: string }
  | { open: false; opens: string; day: DayOfWeek; daysAhead: number }
  | { open: false; opens: null };

/** Open or closed at `date` in the studio's timezone, with the closing or next opening time. */
export function getOpenStatus(hours: OpeningHours[], date: Date): OpenStatus {
  const { day, minutes } = zonedClock(date);
  const forDay = (d: DayOfWeek) => hours.find((h) => h.dayOfWeek.includes(d));

  const today = forDay(day);
  if (today && minutes >= toMinutes(today.opens) && minutes < toMinutes(today.closes)) {
    return { open: true, closes: today.closes };
  }

  const start = DAYS.indexOf(day);
  for (let ahead = 0; ahead <= 7; ahead++) {
    const next = DAYS[(start + ahead) % 7];
    const h = forDay(next);
    if (!h || (ahead === 0 && minutes >= toMinutes(h.opens))) continue;
    return { open: false, opens: h.opens, day: next, daysAhead: ahead };
  }
  return { open: false, opens: null };
}

/** "Open now · until 8:00 PM", "Closed · opens tomorrow at 10:00 AM". */
export function describeOpenStatus(status: OpenStatus) {
  if (status.open) return { label: 'Open now', detail: `until ${formatTime(status.closes)}` };
  if (status.opens === null) return { label: 'Closed', detail: '' };
  const when = status.daysAhead === 0 ? 'today' : status.daysAhead === 1 ? 'tomorrow' : status.day;
  return { label: 'Closed', detail: `opens ${when} at ${formatTime(status.opens)}` };
}
