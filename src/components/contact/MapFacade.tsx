import { ArrowUpRight, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { studio } from '@/data/studio';

/**
 * Click-to-load map (spec 5, item 17): a styled card until the visitor asks for the map, so the
 * page makes no Google requests on load. "Open in Google Maps" always works.
 */
export function MapFacade() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="map-facade">
      <div className="relative aspect-[4/3] overflow-hidden border border-line bg-bg sm:aspect-[16/10]">
        {loaded ? (
          <iframe
            src={studio.mapEmbedUrl}
            title={`Map: ${studio.name}, ${studio.address.locality}`}
            className="absolute inset-0 size-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8">
            {/* Quiet map-like texture: a fine grid, no imagery. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] bg-size-[2.5rem_2.5rem] opacity-60"
            />
            <MapPin aria-hidden="true" strokeWidth={1.25} className="relative size-7 text-gold" />
            <div className="relative">
              <p className="font-display text-xl text-text">{studio.name}</p>
              <p className="mt-1 text-sm text-muted">
                {studio.address.locality}, {studio.address.region}
              </p>
              <Button variant="secondary" onClick={() => setLoaded(true)} className="mt-6">
                Show map
              </Button>
            </div>
          </div>
        )}
      </div>
      <Button
        href={studio.mapLink}
        variant="ghost"
        icon={<ArrowUpRight />}
        className="mt-5 flex-row-reverse"
      >
        Open in Google Maps
      </Button>
    </div>
  );
}
