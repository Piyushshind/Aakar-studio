// Hand-off between the logo preloader and the hero intro (spec 5 items 1 and 3).
// index.html decides before first paint whether the preloader plays (html.intro). Read once at
// startup, so every component agrees even after the Preloader removes the class.

export const introWillPlay =
  typeof document !== 'undefined' && document.documentElement.classList.contains('intro');

let resolveDone: () => void = () => {};
/** Resolves when the preloader has opened onto the hero (immediately when it doesn't play). */
export const introDone: Promise<void> = introWillPlay
  ? new Promise((resolve) => {
      resolveDone = resolve;
    })
  : Promise.resolve();

export function markIntroDone() {
  resolveDone();
}

export const INTRO_SESSION_KEY = 'aakar-intro';
