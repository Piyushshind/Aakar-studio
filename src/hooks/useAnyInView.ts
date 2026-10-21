import { useEffect, useState } from 'react';

/**
 * True while any element matching `selectors` intersects the viewport. Elements are looked up
 * once on mount, so use it for fixed page landmarks (hero, sections, footer).
 */
export function useAnyInView(selectors: string) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const targets = document.querySelectorAll(selectors);
    if (targets.length === 0) return;
    const visible = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setInView(visible.size > 0);
    });
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [selectors]);

  return inView;
}
