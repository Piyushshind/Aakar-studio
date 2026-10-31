import { createElement } from 'react';
import { prerender } from 'react-dom/static';
import { Root } from './Root';

// Build-time pre-rendering (spec 11, Phase 9): scripts/prerender.mjs loads this from the SSR
// build and writes the HTML into dist/index.html, where main.tsx hydrates it.

export { headTags, robotsTxt, sitemapXml } from './lib/seo';
export { SITE_URL } from './lib/site';

/**
 * The page body as HTML, every Suspense boundary resolved and written in place.
 * `progressiveChunkSize: Infinity`: React otherwise moves a large boundary's content out of line
 * (a fallback, the content in a hidden <div> at the end, a script to swap it in) so a stream can
 * flush sooner. Nothing streams here, and hydration would rebuild such a boundary (the contact
 * form) instead of reusing its HTML.
 */
export async function render() {
  const { prelude } = await prerender(createElement(Root), { progressiveChunkSize: Infinity });
  return new Response(prelude).text();
}
