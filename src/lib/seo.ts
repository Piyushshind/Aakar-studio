import { faq } from '@/data/faq';
import { foundingDate, studio } from '@/data/studio';
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_TITLE, SITE_URL } from './site';

// Head tags, JSON-LD and crawler files (spec 11). Built at build time by scripts/prerender.mjs
// through src/entry-server.tsx, never shipped to the browser. Everything comes from src/data/.

const OG_IMAGE = { path: '/og-image.jpg', width: 1200, height: 630 };

const escapeHtml = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

/** JSON inside <script>: `<` escaped so no string can close the tag. */
const jsonLd = (data: object) =>
  `<script type="application/ld+json">${JSON.stringify(data).replaceAll('<', '\\u003c')}</script>`;

/** Profile URLs only: invite and share links are not the studio's page (spec 17.1). */
const profileLinks = () =>
  studio.socials.map((s) => s.url).filter((url) => !/\/(invites|share)\//.test(url));

function businessJsonLd(siteUrl: string) {
  const { address } = studio;
  const sameAs = profileLinks();
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${siteUrl}/#studio`,
    name: studio.name,
    description: studio.description,
    url: `${siteUrl}/`,
    image: `${siteUrl}${OG_IMAGE.path}`,
    logo: `${siteUrl}/favicon/icon-512.png`,
    telephone: studio.phoneE164,
    email: studio.email,
    founder: { '@type': 'Person', name: studio.owner },
    foundingDate,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.street,
      addressLocality: address.locality,
      addressRegion: address.region,
      postalCode: address.postalCode,
      addressCountry: address.country,
    },
    openingHoursSpecification: studio.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.dayOfWeek,
      opens: h.opens,
      closes: h.closes,
    })),
    hasMap: studio.mapLink,
    areaServed: [
      { '@type': 'City', name: address.locality },
      { '@type': 'State', name: address.region },
    ],
    ...(sameAs.length > 0 && { sameAs }),
  };
}

function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/** Meta, Open Graph, Twitter, canonical and JSON-LD tags for <head>. */
export function headTags(siteUrl = SITE_URL) {
  const url = `${siteUrl}/`;
  const image = `${siteUrl}${OG_IMAGE.path}`;
  const meta = (attr: 'name' | 'property', key: string, value: string) =>
    `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`;
  return [
    `<link rel="canonical" href="${url}" />`,
    meta('name', 'keywords', SITE_KEYWORDS.join(', ')),
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', studio.name),
    meta('property', 'og:locale', 'en_IN'),
    meta('property', 'og:url', url),
    meta('property', 'og:title', SITE_TITLE),
    meta('property', 'og:description', SITE_DESCRIPTION),
    meta('property', 'og:image', image),
    meta('property', 'og:image:width', String(OG_IMAGE.width)),
    meta('property', 'og:image:height', String(OG_IMAGE.height)),
    meta('property', 'og:image:alt', `${studio.name} logo`),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', SITE_TITLE),
    meta('name', 'twitter:description', SITE_DESCRIPTION),
    meta('name', 'twitter:image', image),
    jsonLd(businessJsonLd(siteUrl)),
    jsonLd(faqJsonLd()),
  ].join('\n    ');
}

export function robotsTxt(siteUrl = SITE_URL) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

/** One page, so one URL. `lastmod` is the build date. */
export function sitemapXml(siteUrl = SITE_URL, built = new Date()) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${built.toISOString().slice(0, 10)}</lastmod>
  </url>
</urlset>
`;
}
