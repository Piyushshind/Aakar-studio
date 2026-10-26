import { useEffect, useMemo, useRef } from 'react';
import YARL, { type SlideImage } from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import './lightbox.css';
import { photoCaption } from '@/data/gallery';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getPhotoSrcSet, getPhotoSources } from '@/lib/images';
import { duration } from '@/lib/motion';
import { getActiveLenis } from '@/lib/scroll';
import type { Photo } from '@/types/content';

export interface LightboxProps {
  photos: Photo[];
  index: number;
  onClose: () => void;
}

const ms = (s: number) => Math.round(s * 1000);

function toSlide(photo: Photo): SlideImage {
  return {
    src: getPhotoSources(photo)?.src ?? '',
    alt: photo.alt,
    width: photo.width,
    height: photo.height,
    srcSet: getPhotoSrcSet(photo),
    title: photoCaption(photo),
  };
}

/**
 * Photo lightbox (spec 5 item 6, 10): yet-another-react-lightbox with Zoom (pinch, double tap,
 * wheel), Captions and Counter. Lazy-loaded with its CSS, so it costs nothing until first opened.
 * The library handles swipe, the arrow keys, Esc, scroll lock and `inert` on the page behind;
 * this wrapper adds the theme, pauses Lenis and returns focus to the photo that was last viewed
 * (or the one that opened it) on close.
 */
export default function Lightbox({ photos, index, onClose }: LightboxProps) {
  const reducedMotion = useReducedMotion();
  // Desktop: room around the photo for the caption, counter and buttons. Phones: edge to edge.
  const roomy = useMediaQuery('(min-width: 1024px)');
  const slides = useMemo(() => photos.map(toSlide), [photos]);
  const opener = useRef<Element | null>(null);
  const viewed = useRef(index);

  useEffect(() => {
    opener.current = document.activeElement;
    const lenis = getActiveLenis();
    lenis?.stop();
    return () => {
      lenis?.start();
      // The grid button of the photo last viewed, if it's on the page; otherwise the opener.
      const id = photos[viewed.current]?.id;
      const target =
        (id && document.querySelector<HTMLElement>(`[data-photo-id="${CSS.escape(id)}"]`)) ||
        opener.current;
      if (target instanceof HTMLElement) target.focus({ preventScroll: true });
    };
  }, [photos]);

  return (
    <YARL
      open
      close={onClose}
      index={index}
      slides={slides}
      plugins={[Captions, Counter, Zoom]}
      on={{ view: ({ index: i }) => (viewed.current = i) }}
      animation={
        reducedMotion
          ? { fade: ms(duration.fast) / 2, swipe: 0, navigation: 0, zoom: 0 }
          : { fade: ms(duration.fast), swipe: ms(duration.base) * 0.75 }
      }
      carousel={{ finite: photos.length < 3, preload: 2, padding: roomy ? '64px' : '0px' }}
      controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
      captions={{ showToggle: false }}
      counter={{ separator: ' / ' }}
      zoom={{ maxZoomPixelRatio: 2, scrollToZoom: true }}
      labels={{ Previous: 'Previous photo', Next: 'Next photo', Close: 'Close photo viewer' }}
      className="aakar-lightbox"
      styles={{ root: { '--yarl__portal_zindex': 90 } }}
    />
  );
}
