// Reveal lifecycle for [data-reveal] elements (src/styles/animations.css). Nothing here runs
// without html.motion-ok (no JS or reduced motion: everything is simply visible).
//
// Scroll-driven browsers (html.sdt): a live view timeline makes the browser restyle its element
// on every scroll frame, finished or not. So timelines are attached only near the viewport
// (.is-near) and dropped once the reveal is complete (.is-revealed, which is also the final
// look). At most a screenful of reveals is ever live, and a revealed element never rewinds.
// Measured at 4x CPU throttle scrolling the gallery and services: average frame 19 ms with every
// timeline live, 17 ms (the same as no reveals at all) with this.
//
// Fallback (no scroll-driven support): .is-revealed starts a one-off CSS transition.

type Mode = 'scroll' | 'fallback' | 'off';

function mode(): Mode {
  const root = document.documentElement.classList;
  if (!root.contains('motion-ok')) return 'off';
  return root.contains('sdt') ? 'scroll' : 'fallback';
}

const done = (el: Element) => {
  el.classList.add('is-revealed');
  el.classList.remove('is-near');
  near?.unobserve(el);
  complete?.unobserve(el);
  fallback?.unobserve(el);
};

let near: IntersectionObserver | null = null;
let complete: IntersectionObserver | null = null;
let fallback: IntersectionObserver | null = null;

function scrollObservers() {
  // Attach the timeline a little before the element reaches the viewport (its range starts as
  // it enters), so the hand-over from the static "before" state is seamless.
  near ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) e.target.classList.toggle('is-near', e.isIntersecting);
    },
    { rootMargin: '0px 0px 20% 0px' },
  );
  // Complete once its top is 35% of the viewport above the bottom edge: past the end of its
  // range (--reveal-range 24vh plus up to 3 stagger steps of 3vh). Anything already above the
  // viewport (a jump via a nav link) counts as complete too.
  complete ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting || e.boundingClientRect.bottom < 0) done(e.target);
      }
    },
    { rootMargin: '0px 0px -35% 0px' },
  );
  return [near, complete];
}

function fallbackObserver() {
  fallback ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting || e.boundingClientRect.bottom < 0) done(e.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  return [fallback];
}

/** Track a [data-reveal] element; returns the cleanup. */
export function observeReveal(el: Element) {
  const m = mode();
  if (m === 'off') return () => {};
  const observers = m === 'scroll' ? scrollObservers() : fallbackObserver();
  observers.forEach((io) => io.observe(el));
  return () => observers.forEach((io) => io.unobserve(el));
}
