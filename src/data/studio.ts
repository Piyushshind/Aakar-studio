import type { StudioInfo } from '@/types/content';

// Spec 17.1. The phone number lives here once; links come from src/lib/whatsapp.ts.
const PHONE = '9890468885';
const COUNTRY_CODE = '91';

// The studio opened in October 2003 (confirmed by the owner, 2026-10-24).
const FOUNDED = { year: 2003, month: 10 };

/** Whole years since a month, so the count stays right without editing. */
function yearsSince(year: number, month: number, now = new Date()) {
  return now.getFullYear() - year - (now.getMonth() + 1 < month ? 1 : 0);
}

export const studio: StudioInfo = {
  name: 'Aakar Digital Photo Studio',
  shortName: 'Aakar',
  tagline: 'Capturing Emotions, Creating Memories',
  subTagline: 'Digital Photo Studio',
  description:
    'Aakar Digital Photo Studio, Jalgaon, since 2003. Newborn, baby and kids themed shoots, maternity, wedding, pre-wedding and family photography, wedding and event video coverage, with custom albums, printing and framing. Studio and outdoor shoots.',
  owner: 'Prakash S. Suryawanshi', // spelling confirmed 2026-10-24
  team: 'A team of photographers, videographers, album designers and support staff',
  address: {
    street: 'Shop No. 6, Om Chamber, in front of Jalgaon Court',
    locality: 'Jalgaon',
    region: 'Maharashtra',
    postalCode: '425001',
    country: 'IN',
  },
  phone: PHONE,
  phoneE164: `+${COUNTRY_CODE}${PHONE}`,
  whatsapp: `${COUNTRY_CODE}${PHONE}`,
  email: 'aakardigital81@gmail.com',
  // 10 AM – 8 PM, Sunday 10 AM – 3 PM (confirmed 2026-10-24).
  hours: [
    {
      days: 'Monday to Saturday',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '10:00',
      closes: '20:00',
    },
    { days: 'Sunday', dayOfWeek: ['Sunday'], opens: '10:00', closes: '15:00' },
  ],
  mapLink: 'https://maps.app.goo.gl/WQSiiJc4WbKtbNfx6',
  // Placeholder until the official Google Maps embed code is provided (spec 17.1).
  mapEmbedUrl: 'https://www.google.com/maps?q=Om+Chamber+Jalgaon+Court+Jalgaon+425001&output=embed',
  // Spec 17.1. Facebook: where the owner's share link resolves (a personal profile).
  // Instagram: the invite link as given; replace with the profile URL (instagram.com/<handle>/)
  // once the handle is known. YouTube: TBD.
  socials: [
    {
      platform: 'Instagram',
      url: 'https://www.instagram.com/invites/contact/?utm_source=ig_contact_invite&utm_medium=copy_link&utm_content=x0anqvb',
    },
    { platform: 'Facebook', url: 'https://www.facebook.com/prakash.sonawane.165' },
  ],
  stats: [{ label: 'Years of experience', value: yearsSince(FOUNDED.year, FOUNDED.month) }],
  foundedYear: FOUNDED.year,
};

/** For JSON-LD `foundingDate` (spec 11): YYYY-MM. */
export const foundingDate = `${FOUNDED.year}-${String(FOUNDED.month).padStart(2, '0')}`;

/** Single-line postal address for display. */
export const studioAddressLine = `${studio.address.street}, ${studio.address.locality}, ${studio.address.region} ${studio.address.postalCode}`;
