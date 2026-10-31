// Pre-rendering (spec 11, Phase 9), the last step of `pnpm build`: renders the page with the SSR
// build of src/entry-server.ts and writes it into dist/index.html (main.tsx hydrates it), adds
// the head tags and JSON-LD, and writes dist/robots.txt and dist/sitemap.xml.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SSR_DIR = path.join(ROOT, 'node_modules/.cache/aakar-ssr');
const ROOT_DIV = '<div id="root"></div>';

const { render, headTags, robotsTxt, sitemapXml, SITE_URL } = await import(
  pathToFileURL(path.join(SSR_DIR, 'entry-server.js')).href
);

// The site's address: SITE_URL env, else Vercel's production domain, else src/lib/site.ts.
const vercelProduction =
  process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteUrl = (
  process.env.SITE_URL || (vercelProduction ? `https://${vercelProduction}` : SITE_URL)
).replace(/\/+$/, '');
if (siteUrl.includes('example.com')) {
  console.warn(
    `prerender: site URL is the placeholder ${siteUrl} (set SITE_URL in src/lib/site.ts)`,
  );
}

const template = await fs.readFile(path.join(DIST, 'index.html'), 'utf8');
if (!template.includes(ROOT_DIV))
  throw new Error(`prerender: ${ROOT_DIV} not found in dist/index.html`);
const body = await render();

// Every asset the HTML points at must exist in dist/ (the SSR build names files the same way).
const urls = [...new Set(body.match(/\/assets\/[^"'\s,)]+/g) ?? [])];
const found = await Promise.all(
  urls.map((url) =>
    fs.access(path.join(DIST, url)).then(
      () => true,
      () => false,
    ),
  ),
);
const missing = urls.filter((_, i) => !found[i]);
if (missing.length > 0) {
  throw new Error(`prerender: ${missing.length} asset(s) missing from dist/, e.g. ${missing[0]}`);
}

// Spec 9: preload the display font (the hero title, likely the LCP text) and the body font, so
// they don't wait for the CSS to be parsed first. A late body font re-flowed the whole page in
// one ~400 ms task on a throttled phone (Phase 10). Latin subsets only; Vite hashes the names.
const assets = await fs.readdir(path.join(DIST, 'assets'));
const fontPreload = [
  /^fraunces-latin-opsz-normal-.*\.woff2$/,
  /^manrope-latin-wght-normal-.*\.woff2$/,
]
  .map((pattern) => {
    const file = assets.find((f) => pattern.test(f));
    if (!file) console.warn(`prerender: no font file matches ${pattern}, so no preload for it`);
    return file
      ? `<link rel="preload" href="/assets/${file}" as="font" type="font/woff2" crossorigin />\n    `
      : '';
  })
  .join('');

const html = template
  .replace(ROOT_DIV, `<div id="root">${body}</div>`)
  .replace('</head>', `    ${fontPreload}${headTags(siteUrl)}\n  </head>`);
await fs.writeFile(path.join(DIST, 'index.html'), html);
await fs.writeFile(path.join(DIST, 'robots.txt'), robotsTxt(siteUrl));
await fs.writeFile(path.join(DIST, 'sitemap.xml'), sitemapXml(siteUrl));
await fs.rm(SSR_DIR, { recursive: true, force: true });

console.log(
  `prerender: dist/index.html (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB), robots.txt, sitemap.xml for ${siteUrl}`,
);
