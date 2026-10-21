// TEMPORARY (Phase 4): dev-only images check. Loaded only when import.meta.env.DEV.
// Delete this folder in Phase 5 when the real sections arrive.
import { useState, type SyntheticEvent } from 'react';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { excludedPhotos } from '@/data/curation';
import { themeLabel } from '@/data/themes';
import { getPhotoSources } from '@/lib/images';
import { allPhotos, isConsentPending, isPublishable } from '@/lib/photos';
import type { Photo } from '@/types/content';

const GRID_SIZES = '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw';

function Tile({ photo, priority }: { photo: Photo; priority: boolean }) {
  const [picked, setPicked] = useState<string>();
  const sources = getPhotoSources(photo);
  const formats = sources ? [sources.avif && 'AVIF', sources.webp && 'WebP'].filter(Boolean) : [];
  // naturalWidth of a srcset image is density-corrected, not the file's width: probe the file.
  const onLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const probe = new Image();
    probe.onload = () => setPicked(`${probe.naturalWidth}px`);
    probe.src = e.currentTarget.currentSrc;
  };

  return (
    <figure data-photo={photo.id} className="space-y-2">
      <ResponsiveImage
        photo={photo}
        sizes={GRID_SIZES}
        priority={priority}
        onLoad={onLoad}
        className="rounded-md"
        fallback={
          <div className="flex aspect-[3/2] items-center justify-center rounded-md border border-dashed border-line p-3 text-center text-xs text-blush">
            Not publishable: {excludedPhotos[photo.id] ? 'excluded' : 'consent pending'}
          </div>
        }
      />
      <figcaption className="space-y-0.5 text-[11px] leading-snug text-muted">
        <p className="font-semibold text-text">{photo.id}</p>
        <p>
          {photo.width}×{photo.height} · {themeLabel(photo.theme)} · {photo.kind}
          {priority && ' · priority'}
        </p>
        <p>
          {sources
            ? `${formats.join(' + ')} @ ${sources.widths.join(', ')}${sources.placeholder ? ' · blur' : ''}`
            : 'no file'}
        </p>
        {picked && <p className="text-gold">loaded {picked}</p>}
      </figcaption>
    </figure>
  );
}

export default function ImagesCheck() {
  const [simulateLaunch, setSimulateLaunch] = useState(false);
  const shown = allPhotos.filter(
    (p) => !simulateLaunch || isPublishable(p, { enforceConsent: true }),
  );
  const pending = allPhotos.filter(isConsentPending).length;
  const spread = allPhotos.find((p) => p.id === 'wedding-01-02');
  const xlPhoto = allPhotos.find((p) => p.xlSrc);

  return (
    <div id="images-check" className="space-y-10 py-16">
      <div className="mx-auto max-w-6xl space-y-6 px-6">
        <p className="text-xs font-semibold tracking-[0.4em] text-muted uppercase">
          Images check · dev only · Phase 4
        </p>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={simulateLaunch}
              onChange={(e) => setSimulateLaunch(e.target.checked)}
            />
            Simulate VITE_ENFORCE_CONSENT=true
          </label>
          <span className="text-muted">
            Showing {shown.length} of {allPhotos.length} · {pending} consent pending ·{' '}
            {Object.keys(excludedPhotos).length} excluded
          </span>
        </div>
        <div id="images-grid" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((p, i) => (
            <Tile key={p.id} photo={p} priority={i < 4} />
          ))}
        </div>

        <h2 className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">
          Missing file / unknown id (neutral placeholder)
        </h2>
        <div className="w-64">
          <ResponsiveImage photo="does-not-exist-01" sizes="256px" className="rounded-md" />
        </div>
      </div>

      {spread && (
        <section className="space-y-2">
          <h2 className="mx-auto max-w-6xl px-6 text-xs font-semibold tracking-[0.3em] text-gold uppercase">
            Album spread, full width ({spread.id}, {spread.width}×{spread.height})
          </h2>
          <ResponsiveImage photo={spread} sizes="100vw" />
        </section>
      )}
      {xlPhoto && (
        <section className="space-y-2">
          <h2 className="mx-auto max-w-6xl px-6 text-xs font-semibold tracking-[0.3em] text-gold uppercase">
            -xl master, full width ({xlPhoto.id})
          </h2>
          <ResponsiveImage photo={xlPhoto} xl sizes="100vw" />
        </section>
      )}
    </div>
  );
}
