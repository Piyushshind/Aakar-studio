import type { StudioInfo } from '@/types/content';

// Spec 17.1. The phone number lives here once; links come from src/lib/whatsapp.ts.
const PHONE = '9890468885';
const COUNTRY_CODE = '91';

export const studio: StudioInfo = {
  name: 'Aakar Digital Photo Studio',
  shortName: 'Aakar',
  tagline: 'Capturing Emotions, Creating Memories',
  subTagline: 'Digital Photo Studio',
  description:
    'Aakar Digital Photo Studio, Jalgaon. Newborn, baby and kids themed shoots, maternity, wedding, pre-wedding and family photography, with custom albums, printing and framing. Studio and outdoor shoots.',
  owner: 'Prakash S. Suryawanshi', // TBD: spelling to confirm (spec 18.1)
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
  // TBD: AM/PM to confirm (spec 18.1)
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
  stats: [], // only real numbers; the stats block hides while empty
  // foundedYear: TBD
};

/** Single-line postal address for display. */
export const studioAddressLine = `${studio.address.street}, ${studio.address.locality}, ${studio.address.region} ${studio.address.postalCode}`;
