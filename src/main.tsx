import { startTransition, StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource-variable/manrope';
import './styles/index.css';
import './styles/animations.css';
import { Root } from './Root';

// Dev only: validate the photo manifest once (zod never ships to production), and check the CSS
// copies of the motion tokens still match src/lib/motion.ts.
if (import.meta.env.DEV) {
  void import('./lib/photos.schema').then(({ validateManifest }) => validateManifest());
  void import('./lib/motion').then(({ checkCssMotionTokens }) => checkCssMotionTokens());
}

// The build pre-renders the page into #root (scripts/prerender.mjs), so React hydrates it; the dev
// server serves an empty #root and renders from scratch. Hydration runs as a transition so React
// yields to the browser between sections (App.tsx wraps each in Suspense) instead of blocking
// the main thread for the whole page at once (Phase 10: ~1.4 s TBT on a throttled phone).
const container = document.getElementById('root')!;
const app = (
  <StrictMode>
    <Root />
  </StrictMode>
);
if (container.hasChildNodes()) startTransition(() => void hydrateRoot(container, app));
else createRoot(container).render(app);
