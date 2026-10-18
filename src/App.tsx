import { lazy, Suspense } from 'react';

// Dev only: the Phase 2 foundation check panel (removed in Phase 5). Production builds don't
// include it; they show the Phase 1 brand test page until the real sections exist.
const FoundationCheck = import.meta.env.DEV ? lazy(() => import('./dev/FoundationCheck')) : null;

function App() {
  if (FoundationCheck) {
    return (
      <Suspense fallback={null}>
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
