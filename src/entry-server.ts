import { createElement } from 'react';
import { prerender } from 'react-dom/static';
import { Root } from './Root';

// Build-time pre-rendering (spec 11, Phase 9): scripts/prerender.mjs loads this from the SSR
// build and writes the HTML into dist/index.html, where main.tsx hydrates it.

export { headTags, robotsTxt, sitemapXml } from './lib/seo';
export { SITE_URL } from './lib/site';

/** The page body as HTML, with every Suspense boundary resolved. */
export async function render() {
  const { prelude } = await prerender(createElement(Root));
  return new Response(prelude).text();
}
