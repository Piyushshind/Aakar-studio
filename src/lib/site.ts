import { studio } from '@/data/studio';

// Site-wide constants (spec 11). index.html carries the same title and description (keep them in
// step); src/lib/seo.ts builds the other head tags, JSON-LD, robots.txt and sitemap.xml from here.

/**
 * TBD: set once the domain is bought (spec 17.1). Used for canonical, OG and sitemap URLs. A
 * build can override it with the SITE_URL environment variable; on Vercel, production builds
 * fall back to the project's production URL (scripts/prerender.mjs).
 */
export const SITE_URL = 'https://example.com';

export const SITE_TITLE =
  'Aakar Digital Photo Studio | Newborn, Baby & Wedding Photographer in Jalgaon';

export const SITE_DESCRIPTION = `Newborn, baby, maternity, wedding, pre-wedding and family photography in Jalgaon, Maharashtra, since 2003. Wedding and event videos, studio and outdoor shoots, custom albums. Call or WhatsApp ${studio.phone}.`;

export const SITE_KEYWORDS = [
  'newborn photography Jalgaon',
  'baby photoshoot Jalgaon',
  'kids theme photoshoot Jalgaon',
  'first birthday photoshoot Jalgaon',
  'wedding photographer Jalgaon',
  'wedding videography Jalgaon',
  'pre-wedding shoot Jalgaon',
  'maternity photoshoot Jalgaon',
  'passport photo Jalgaon',
  'photo studio Jalgaon',
];

export const THEME_COLOR = '#121010';
