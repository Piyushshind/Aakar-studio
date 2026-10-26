// Content types (spec 6). `Photo` mirrors the entries that scripts/images/export.mjs writes to
// src/data/photos.manifest.json; the zod schema in src/lib/photos.schema.ts must stay in sync.

export type Category =
  | 'newborn'
  | 'baby-kids'
  | 'maternity'
  | 'wedding'
  | 'pre-wedding'
  | 'family'
  | 'portrait'
  | 'events'
  | 'product'
  | 'about';

/** Album entries use `albums/<slug>` instead of a category. */
export type PhotoCategory = Category | `albums/${string}`;

export type PhotoSource = 'studio' | 'stock'; // no AI-generated photos, ever
export type PhotoKind = 'photo' | 'album-cover' | 'album-page';
export type QualityTier = 'hero' | 'fullbleed' | 'grid' | 'small';
export type Orientation = 'portrait' | 'landscape' | 'square';

export interface Photo {
  id: string;
  src: string; // WebP master, e.g. src/assets/photos/baby-kids/baby-kids-farm-theme-03.webp
  xlSrc?: string; // extra-large master for the zoom section
  alt: string;
  category: PhotoCategory;
  orientation: Orientation;
  width: number;
  height: number;
  source: PhotoSource;
  theme: string; // always written by the pipeline, e.g. 'farm-theme'; album pages too
  kind: PhotoKind;
  album: string | null; // album slug
  albumOrder: number | null; // 0 = front cover
  qualityTier: QualityTier;
  featured: boolean;
  consent: boolean | null; // null = not yet confirmed
  requiresConsent: boolean; // child or identifiable private event
  credit?: string; // stock only
  licenseUrl?: string; // stock only
  originalFile: string;
}

export interface Album {
  slug: string;
  title: string;
  subtitle?: string; // other text printed on the pages, to tell same-titled albums apart
  type: string;
  cover: Photo; // lowest-ordered album-cover, or the first page if none
  pages: Photo[]; // sorted by albumOrder; excludes `cover` when it is an album-cover
}

/** Any lucide-react export name; typos fail the typecheck. */
export type IconName = keyof typeof import('lucide-react');

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  imageId?: string; // manifest id; omit for icon-only cards
  whatsappMessage: string;
}

export interface StudioExtra {
  title: string;
  icon: IconName;
}

export interface Testimonial {
  id: string;
  name: string;
  event: string;
  quote: string;
  rating?: number;
  sourceUrl?: string;
}

export interface BeforeAfterPair {
  id: string;
  beforeId: string; // manifest id
  afterId: string; // manifest id
  caption?: string;
}

export interface ProcessStep {
  title: string;
  description: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export type DayOfWeek =
  'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface OpeningHours {
  days: string; // display label, e.g. 'Monday to Saturday'
  dayOfWeek: DayOfWeek[]; // for JSON-LD openingHoursSpecification
  opens: string; // 24h 'HH:MM'
  closes: string; // 24h 'HH:MM'
}

export interface StudioInfo {
  name: string;
  shortName: string;
  tagline: string;
  subTagline: string;
  description: string;
  owner: string;
  team: string;
  address: {
    street: string;
    locality: string;
    region: string;
    postalCode: string;
    country: string;
  };
  phone: string; // display form
  phoneE164: string; // for tel: links and JSON-LD
  whatsapp: string; // digits only, with country code
  email: string;
  hours: OpeningHours[];
  mapLink: string;
  mapEmbedUrl: string;
  socials: { platform: string; url: string }[];
  stats: { label: string; value: number; suffix?: string }[];
  foundedYear?: number;
}
