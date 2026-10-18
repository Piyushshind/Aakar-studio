// Phase 1 test page: confirms Tailwind, theme tokens and fonts. Replaced in Phase 5.
function App() {
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
      <div className="mt-6 flex gap-3" aria-hidden="true">
        {[
          'bg-surface',
          'bg-elevated',
          'bg-gold',
          'bg-gold-light',
          'bg-gold-deep',
          'bg-brown',
          'bg-cream-bg',
          'bg-blush',
        ].map((c) => (
          <span key={c} className={`size-6 rounded-full border border-line ${c}`} />
        ))}
      </div>
    </main>
  );
}

export default App;
