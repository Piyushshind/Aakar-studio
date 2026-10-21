import { lazy, Suspense } from 'react';
import { FloatingButtons } from '@/components/common/FloatingButtons';
import { ScrollProgress } from '@/components/common/ScrollProgress';
import { CustomCursor } from '@/components/cursor/CustomCursor';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { About } from '@/sections/About';
import { Albums } from '@/sections/Albums';
import { AnywhereBand } from '@/sections/AnywhereBand';
import { BabyBand } from '@/sections/BabyBand';
import { Contact } from '@/sections/Contact';
import { Faq } from '@/sections/Faq';
import { Gallery } from '@/sections/Gallery';
import { Hero } from '@/sections/Hero';
import { Marquee } from '@/sections/Marquee';
import { Process } from '@/sections/Process';
import { Quality } from '@/sections/Quality';
import { QuoteBand } from '@/sections/QuoteBand';
import { Services } from '@/sections/Services';
import { Social } from '@/sections/Social';
import { Testimonials } from '@/sections/Testimonials';

// Dev only: the brand, images and foundation check panels at `?dev`. Production builds never
// include them (import.meta.env.DEV is false, so the dynamic import is dropped).
const DevPanels = import.meta.env.DEV ? lazy(() => import('./dev/DevPanels')) : null;
const showDevPanels = DevPanels !== null && new URLSearchParams(window.location.search).has('dev');

function App() {
  if (DevPanels && showDevPanels) {
    return (
      <Suspense fallback={null}>
        <DevPanels />
      </Suspense>
    );
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[100] bg-gold px-4 py-3 text-sm font-semibold text-bg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        {/* Spec 5 order. Sections with no content (testimonials, social) render nothing. */}
        <Hero />
        <Marquee />
        <Quality />
        <Gallery />
        <BabyBand />
        <Albums />
        <Services />
        <AnywhereBand />
        <QuoteBand />
        <Process />
        <About />
        <Testimonials />
        <Faq />
        <Social />
        <Contact />
      </main>
      <Footer />
      {/* Global extras (spec 5): progress line, WhatsApp and back-to-top buttons, cursor. */}
      <ScrollProgress />
      <FloatingButtons />
      <CustomCursor />
    </>
  );
}

export default App;
