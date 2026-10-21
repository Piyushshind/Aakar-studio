import { Camera } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from 'react';
import { cn } from '@/lib/cn';
import { getPhotoSources } from '@/lib/images';
import { findPhoto, isConsentPending, isPublishable } from '@/lib/photos';
import type { Photo } from '@/types/content';

const warnedIds = new Set<string>();

interface ResponsiveImageProps {
  /** A manifest photo, or its id. */
  photo: Photo | string;
  /** Required: the rendered width per breakpoint, e.g. "(min-width: 1024px) 33vw, 100vw". */
  sizes: string;
  /** Above the fold (hero): eager, fetchpriority=high, no fade. */
  priority?: boolean;
  /** Use the `-xl` master when the photo has one (zoom section). */
  xl?: boolean;
  /** Wrapper classes (size, rounding, position). */
  className?: string;
  /** Classes for the <img> itself. */
  imgClassName?: string;
  fit?: 'cover' | 'contain';
  objectPosition?: string;
  /** Rare: override the manifest alt text (e.g. "" when purely decorative). */
  alt?: string;
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
  /** Rendered instead when the photo is not publishable (excluded or consent pending at launch). */
  fallback?: ReactNode;
}

/**
 * The only way photos are rendered (spec 7.2): <picture> with AVIF and WebP sources, manifest
 * width/height (no layout shift), alt from the manifest, lazy by default, and a blurred inline
 * placeholder that cross-fades to the image. A missing file renders a same-size neutral
 * placeholder, never a broken image. Not publishable: renders `fallback` (default nothing).
 */
export function ResponsiveImage({
  photo,
  sizes,
  priority = false,
  xl = false,
  className,
  imgClassName,
  fit = 'cover',
  objectPosition,
  alt,
  onLoad,
  fallback = null,
}: ResponsiveImageProps) {
  const entry = typeof photo === 'string' ? findPhoto(photo) : photo;
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // An image served from the cache can finish before React attaches onLoad.
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true);
  }, []);

  if (!entry) {
    if (import.meta.env.DEV && !warnedIds.has(String(photo))) {
      warnedIds.add(String(photo));
      console.warn(`ResponsiveImage: no manifest photo "${String(photo)}"`);
    }
    return <MissingImage ratio="3 / 2" alt={alt ?? ''} className={className} />;
  }
  if (!isPublishable(entry)) return fallback;

  const ratio = `${entry.width} / ${entry.height}`;
  const sources = getPhotoSources(entry, { xl });
  const label = alt ?? entry.alt;
  if (!sources) {
    return <MissingImage ratio={ratio} alt={label} className={className} badge={entry} />;
  }

  const shown = priority || loaded;
  const objectStyle = { objectFit: fit, objectPosition };

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ aspectRatio: ratio }}>
      {sources.placeholder && !priority && (
        <img
          src={sources.placeholder}
          alt=""
          aria-hidden="true"
          className={cn(
            'absolute inset-0 size-full scale-110 blur-xl transition-opacity duration-500 motion-reduce:transition-none',
            shown ? 'opacity-0' : 'opacity-100',
          )}
          style={objectStyle}
        />
      )}
      <picture>
        {sources.avif && <source type="image/avif" srcSet={sources.avif} sizes={sizes} />}
        {sources.webp && <source type="image/webp" srcSet={sources.webp} sizes={sizes} />}
        <img
          ref={imgRef}
          src={sources.src}
          sizes={sizes}
          width={entry.width}
          height={entry.height}
          alt={label}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'auto' : 'async'}
          fetchPriority={priority ? 'high' : undefined}
          onLoad={(event) => {
            setLoaded(true);
            onLoad?.(event);
          }}
          className={cn(
            'relative block size-full',
            !priority && 'transition-opacity duration-500 ease-out motion-reduce:transition-none',
            shown ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
          style={objectStyle}
        />
      </picture>
      <ConsentBadge photo={entry} />
    </div>
  );
}

/** Same-size neutral stand-in when the file is missing (e.g. a fresh clone without photos). */
function MissingImage({
  ratio,
  alt,
  className,
  badge,
}: {
  ratio: string;
  alt: string;
  className?: string;
  badge?: Photo;
}) {
  return (
    <div
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn('relative flex items-center justify-center bg-surface', className)}
      style={{ aspectRatio: ratio }}
    >
      <Camera aria-hidden="true" className="size-6 text-muted opacity-60" strokeWidth={1.5} />
      {badge && <ConsentBadge photo={badge} />}
    </div>
  );
}

/** Dev only (spec 6): marks photos whose consent isn't confirmed yet. */
function ConsentBadge({ photo }: { photo: Photo }) {
  if (!import.meta.env.DEV || !isConsentPending(photo)) return null;
  return (
    <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-bg/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-blush uppercase">
      Consent pending
    </span>
  );
}
