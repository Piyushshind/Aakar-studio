import { studio } from '@/data/studio';

// Site-wide constants (spec 11). index.html carries the same title and description for now;
// pre-rendering (Phase 9) will generate them from here.

/** TBD: replace once the domain is decided (spec 17.1). Used for canonical, OG and sitemap URLs. */
export const SITE_URL = 'https://example.com';

export const SITE_TITLE =
  'Aakar Digital Photo Studio | Newborn, Baby & Wedding Photographer in Jalgaon';

export const SITE_DESCRIPTION = `Newborn, baby, maternity, wedding, pre-wedding and family photography in Jalgaon, Maharashtra. Studio and outdoor shoots, custom albums. Call or WhatsApp ${studio.phone}.`;

export const SITE_KEYWORDS = [
  'newborn photography Jalgaon',
  'baby photoshoot Jalgaon',
  'kids theme photoshoot Jalgaon',
  'first birthday photoshoot Jalgaon',
  'wedding photographer Jalgaon',
  'pre-wedding shoot Jalgaon',
  'maternity photoshoot Jalgaon',
  'passport photo Jalgaon',
  'photo studio Jalgaon',
];

export const THEME_COLOR = '#121010';
