import { lazy, Suspense } from 'react';

// Dev only: the Phase 2–4 check panels (brand, images, foundation; removed in Phase 5).
// Production builds don't include them; they show the Phase 1 brand test page until the real
// sections exist. The logo isn't used in production until it is approved (spec 4.6).
const BrandCheck = import.meta.env.DEV ? lazy(() => import('./dev/BrandCheck')) : null;
const ImagesCheck = import.meta.env.DEV ? lazy(() => import('./dev/ImagesCheck')) : null;
const FoundationCheck = import.meta.env.DEV ? lazy(() => import('./dev/FoundationCheck')) : null;

function App() {
  if (BrandCheck && ImagesCheck && FoundationCheck) {
    return (
      <Suspense fallback={null}>
        <BrandCheck />
        <ImagesCheck />
        <FoundationCheck />
      </Suspense>
    );
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-xs font-semibold tracking-[0.4em] text-muted uppercase">
        Digital Photo Studio
      </p>
      <h1 className="font-display text-[clamp(3rem,10vw,10rem)] leading-none font-semibold tracking-tight">
        Aakar
      </h1>
      <p className="text-sm font-medium tracking-[0.25em] uppercase">
        Capturing <span className="text-gold">Emotions</span>, Creating{' '}
        <span className="text-gold">Memories</span>
      </p>
    </main>
  );
}

export default App;
