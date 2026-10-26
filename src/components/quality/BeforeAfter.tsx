import { ReactCompareSlider } from 'react-compare-slider';
import { Reveal } from '@/components/ui/Reveal';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { getPhoto } from '@/lib/photos';
import type { BeforeAfterPair, Photo } from '@/types/content';

const SIZES = '(min-width: 1024px) 45vw, 100vw';

function Labelled({ photo, label, side }: { photo: Photo; label: string; side: 'left' | 'right' }) {
  return (
    <div className="relative size-full">
      <ResponsiveImage photo={photo} sizes={SIZES} alt="" className="size-full" />
      <span
        className={`pointer-events-none absolute top-3 rounded-full bg-bg/70 px-3 py-1 eyebrow text-xs text-text backdrop-blur-sm lg:text-[0.62rem] ${side === 'left' ? 'left-3' : 'right-3'}`}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * Before/after (spec 5 item 5): raw versus edited pairs in react-compare-slider (drag, click or
 * use the arrow keys on the handle). Lazy-loaded by the Quality section, and only when real pairs
 * exist (src/data/beforeAfter.ts); pairs with a missing or unpublishable photo are skipped.
 */
export default function BeforeAfter({ pairs }: { pairs: BeforeAfterPair[] }) {
  const ready = pairs
    .map((pair) => ({ pair, before: getPhoto(pair.beforeId), after: getPhoto(pair.afterId) }))
    .filter((p): p is { pair: BeforeAfterPair; before: Photo; after: Photo } =>
      Boolean(p.before && p.after),
    );
  if (ready.length === 0) return null;

  return (
    <ul className="grid gap-12 lg:grid-cols-2 lg:gap-10">
      {ready.map(({ pair, before, after }, i) => (
        <Reveal as="li" key={pair.id} index={i % 2}>
          <figure>
            <div
              data-cursor="drag"
              className="overflow-clip border border-line"
              style={{ aspectRatio: `${after.width} / ${after.height}` }}
            >
              <ReactCompareSlider
                className="size-full"
                keyboardIncrement="5%"
                itemOne={<Labelled photo={before} label="Before" side="left" />}
                itemTwo={<Labelled photo={after} label="After" side="right" />}
              />
            </div>
            <figcaption className="mt-4 text-sm text-muted">
              {pair.caption ?? `${after.alt}: before and after editing.`}
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </ul>
  );
}
