# PROJECT_SPEC — Aakar Digital Photo Studio Website

Last updated: 2026-10-23

## Instructions for the AI developer

This file is the single source of truth for building the Aakar Digital Photo Studio website. Read it fully before writing code. Start with section 0, then build phase by phase (section 14).

- Check the latest stable versions and official setup docs before installing or configuring anything. Setup steps change between major versions, especially Tailwind v4, Vite, GSAP, Lenis and pnpm.
- Anything marked TBD is not yet known. Use clearly fake placeholder content and keep it in `src/data/` so it is easy to replace.
- Never invent phone numbers, prices, years in business, stats or reviews.
- Never use AI-generated photos anywhere. Never present stock photos as the studio's own work (section 7.1).
- The site must adapt to the photos that actually exist (section 7.3). Sections and filters are data-driven and hide themselves when they have no real content.
- Ask the user before making architectural changes not described here.
- Photos are the hero. Every animation and effect must make the photos look better, never compete with them.

## 0. Setup status and first task

### 0.1 What has already been done

- Project created with pnpm using the Vite `react-ts` template, with git.
- Tailwind CSS v4 and the dependencies in 0.3 installed (plus `react-lite-youtube-embed`, which must be removed).
- **Image processing is complete** (2026-10-17). Scripts live in `scripts/images/` (`analyze`, `dedupe`, `contact-sheets`, `classify`, `export`, `report`, `lib`), with pnpm scripts `images:analyze`, `images:dedupe`, `images:sheets`, `images:classify`, `images:export`, `images:report`. Output WebP masters are in `src/assets/photos/` and the manifest is `src/data/photos.manifest.json`. See section 7.3. Do not re-run the image pipeline unless asked.
- The user is an experienced React developer. Keep explanations short and technical.

### 0.2 Package manager

Use **pnpm only**. Never run npm or yarn, and never create `package-lock.json` or `yarn.lock`. Use `pnpm add`, `pnpm add -D`, `pnpm remove` and `pnpm dlx`.

### 0.3 Required packages

Verify each of these against `package.json`. Install any that are missing. Do not upgrade installed packages unless there is a real compatibility problem, and report it if so.

| Type | Packages |
| --- | --- |
| Styling | `tailwindcss`, `@tailwindcss/vite` |
| Animation | `gsap`, `@gsap/react`, `lenis`, `motion` |
| WebGL | `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` |
| Gallery and UI | `embla-carousel-react`, `embla-carousel-autoplay`, `yet-another-react-lightbox`, `react-compare-slider`, `lucide-react` |
| Utilities | `clsx`, `tailwind-merge` |
| Forms | `react-hook-form`, `zod`, `@hookform/resolvers` |
| Fonts | `@fontsource-variable/fraunces`, `@fontsource-variable/manrope` |
| Dev | `@types/three`, `prettier`, `prettier-plugin-tailwindcss`, `vite-imagetools`, `sharp`, `rollup-plugin-visualizer` |

Remove: `react-lite-youtube-embed` (the studio does not offer cinematic films).

Do not install yet: `vite-react-ssg` (added in the SEO phase), `@rive-app/react-canvas` and `react-pageflip` (only if needed later).

### 0.4 Setup tasks, in order

1. **Audit:** Read `package.json`, compare against 0.3, install anything missing and remove `react-lite-youtube-embed`.
2. **pnpm build scripts:** Make sure `esbuild` and `sharp` are allowed to build, using the method the installed pnpm version supports. If it needs the interactive `pnpm approve-builds`, ask the user to run it.
3. **Vite config:** Confirm `vite.config.ts` has `react()` and `tailwindcss()`. Add `imagetools()` from `vite-imagetools`. Add a `@` alias pointing to `src`, mirrored in `tsconfig.app.json`. Add `rollup-plugin-visualizer` behind an `ANALYZE` environment flag only.
4. **TypeScript:** Confirm `strict: true`. Add type declarations for `vite-imagetools` imports if needed. Enable `resolveJsonModule` for the photo manifest.
5. **Clean boilerplate:** Remove the Vite demo content (counter, logos, `App.css`, demo assets). Leave a minimal `App.tsx`.
6. **CSS:** `src/styles/index.css` starts with `@import "tailwindcss";` followed by the `@theme` tokens from section 4.2. Create `src/styles/animations.css` and import both from `main.tsx`.
7. **Fonts:** Import Fraunces and Manrope from `@fontsource-variable` in `main.tsx` and map them to Tailwind font tokens in `@theme`.
8. **index.html:** Set `lang="en"`, the title and meta description from section 11, and `<meta name="theme-color" content="#121010">`.
9. **Prettier:** `.prettierrc` with `prettier-plugin-tailwindcss`. `.prettierignore` already exists; keep its entries.
10. **Linting (oxlint):** Keep the template's oxlint setup (`.oxlintrc.json`). `react/rules-of-hooks` is an error and `react/exhaustive-deps` a warning.
11. **Scripts:** Add `format`, `format:check`, `typecheck` and `analyze` to `package.json`, keeping the existing `images:*` scripts.
12. **Git:** `.gitignore` must cover `node_modules`, `dist`, `.env*`, OS files, `src/haveToProcessImages/`, `scripts/images/out/` and, while the repo is public, `src/assets/photos/`. `src/data/photos.manifest.json` is committed (it holds no image data). The originals stay in the owner's Google Drive as backup, and the masters can be regenerated with the `images:*` scripts.
13. **Verify:** Run `pnpm dev`, `pnpm build`, `pnpm lint` and `pnpm typecheck`. Fix every error before moving on.
14. **Report:** Tell the user what was already installed, what you added or removed, what you configured, and anything you were unsure about. Then wait for the go-ahead before Phase 2.

## 1. Project overview

A fully static, fully animated single-page marketing website for Aakar Digital Photo Studio in Jalgaon, built as a gift for the owner, Prakash S. Suryawanshi. No backend, no database, no logins.

| Item | Detail |
| --- | --- |
| Studio | Aakar Digital Photo Studio |
| Owner | Prakash S. Suryawanshi |
| Address | Shop No. 6, Om Chamber, in front of Jalgaon Court, Jalgaon, Maharashtra 425001 |
| Team | Photographers, videographers, album designers and support staff (no names or photos shown) |
| Specialities | Newborn, baby and kids, maternity, weddings, pre-wedding, family, birthdays and ceremonies, custom albums |
| Strongest portfolio today | Themed baby and kids studio shoots, and custom-designed albums (section 7.3) |
| Coverage | In-studio and outdoor shoots, anywhere the customer wants |
| Audience | Parents, families, couples and local businesses in and around Jalgaon |
| Language | English only |
| Type | Single long-scroll page plus album viewer overlays |

Goals, in priority order:

1. Impress instantly: the first screen must make photo quality obvious.
2. Show the work: galleries and albums, filtered by category or theme.
3. Explain the services clearly. No prices are shown; every service leads to contact.
4. Build trust: owner and team story, real reviews, flexible delivery.
5. Convert: make contacting the studio effortless through WhatsApp, call, map and an inquiry form.

## 2. Tech stack

Use one tool per job, and never animate the same property of the same element with two libraries.

| Layer | Library | Rules |
| --- | --- | --- |
| Package manager | pnpm | Only pnpm (section 0.2) |
| Framework | React 19 + TypeScript (strict) | Function components and hooks only |
| Build | Vite, `react-ts` template | Outputs a static `dist/` folder |
| Styling | Tailwind CSS v4 | Official `@tailwindcss/vite` plugin, CSS-first config with `@theme`, no `tailwind.config.js`, no PostCSS setup |
| Custom CSS | Plain CSS files | Keyframes, masks, clip-paths, 3D transforms, scroll-driven CSS |
| Scroll and timelines | GSAP + ScrollTrigger | All plugins are free, including commercial use |
| GSAP plugins | SplitText, Flip, CustomEase, DrawSVG, MorphSVG, ScrollToPlugin | Register once in `src/lib/gsap.ts` |
| GSAP in React | `@gsap/react` (`useGSAP`) | Always with a `scope` ref, never raw `useEffect` |
| Smooth scroll | Lenis (`lenis/react`) | One instance at app root, synced with ScrollTrigger |
| UI motion | Motion (`motion`, import from `motion/react`) | Hover, tap, menus, lightbox, accordion, layout and exit animations; use `LazyMotion` + `m` |
| Simple scroll effects | Native CSS scroll-driven animations | Reveals, progress bar, light parallax; wrap in `@supports` with a fallback |
| WebGL | Hand-written WebGL2 module (`src/components/webgl/heroGL.ts`) | Hero transition only, lazy-loaded. Chosen over three + R3F by measurement (2026-10-23): lazy chunk 2.1 KB gz versus 335.6 KB (three alone 135.1 KB) for one full-screen plane. three / R3F stay installed but unused |
| Post-processing | none | Not needed for one shader |
| Interactive vector | Rive (`@rive-app/react-canvas`) | Optional, e.g. camera shutter loader |
| Carousels | embla-carousel-react (+ autoplay plugin) | |
| Lightbox | yet-another-react-lightbox (Zoom, Thumbnails, Captions) | Or custom Motion + GSAP Flip |
| Before/after | react-compare-slider | Only when real pairs exist |
| Flip-book album | Custom GSAP + CSS 3D | `react-pageflip` as fallback |
| Icons | lucide-react | |
| Fonts | @fontsource-variable | Self-hosted, max two families |
| Class helpers | clsx + tailwind-merge | A `cn()` utility |
| Forms | react-hook-form + zod, sent to Web3Forms or Formspree | No backend |
| Images | vite-imagetools (responsive sizes from the WebP masters) | Section 7.2 |
| Logo and brand assets | Hand-built SVG, exported with sharp (Node) or Pillow/cairosvg (Python) | Section 4.6 |
| Pre-rendering | vite-react-ssg or equivalent | Real HTML for SEO, added in the SEO phase |
| PWA | vite-plugin-pwa | Optional |
| Code quality | oxlint, Prettier, prettier-plugin-tailwindcss | |
| Bundle check | rollup-plugin-visualizer | |

Division of labour:

- **CSS scroll-driven:** simple fades, reveals, reading progress bar, light parallax.
- **GSAP:** preloader, hero intro, pinned sections, horizontal gallery, kinetic headlines.
- **Motion:** UI interactions and component enter/exit.
- **WebGL:** hero photo effect only, with a static fallback on mobile, low-power devices and reduced motion. Cap `dpr` at `[1, 1.75]` and pause rendering off-screen.

## 3. Design trends to implement

These five trends are required, not optional.

| Trend | How the site applies it |
| --- | --- |
| Scroll-driven animation | CSS scroll-driven animations (supported in Chrome, Edge, Firefox and Safari) for simple effects; GSAP ScrollTrigger only for complex sequences |
| Purposeful motion | Every animation guides attention to a photo, a service or a CTA. Scroll reveals, rich hover effects, custom cursor on desktop. No decoration for its own sake |
| Typography and dark mode | Warm dark theme by default, which makes photos look richer. Oversized display headlines with kinetic type via GSAP SplitText |
| Performance and accessibility | Treated as requirements. Subtle scroll animations on mobile, full `prefers-reduced-motion` support, WCAG 2.2 AA contrast, keyboard navigation |
| Modern image formats | AVIF and WebP, responsive `srcset`, lazy-loaded below the fold |

## 4. Visual design system

The mood is warm cinematic, matching the studio banner: metallic gold, deep brown and soft cream. Premium enough for weddings, soft enough for babies. The studio's identity is emotional ("Capturing Emotions, Creating Memories"), so the site must feel warm, never cold or edgy. The real photos are rich and colourful (saffron, teal, pink, sky blue), so the UI around them stays restrained and lets them carry the colour.

### 4.1 Theme

- Warm dark by default: espresso-charcoal, not pure black.
- Baby and soft-themed areas use a **light cream section** (`--color-cream-bg`) with deep brown text, echoing the banner. This gives the page a deliberate dark-light-dark rhythm.
- Gold is the brand accent for CTAs, highlights and the logo. Blush is a small secondary accent for baby areas only.
- No light-mode toggle.

### 4.2 Colour tokens

Define in `src/styles/index.css` with `@theme`. Gold and brown are taken from the studio banner (`src/assets/brand/reference-banner.jpg`); fine-tune against it when building the logo.

| Token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#121010` | Page background |
| `--color-surface` | `#1a1716` | Cards, sections |
| `--color-elevated` | `#241f1d` | Raised elements |
| `--color-text` | `#f6efe6` | Main text on dark (cream) |
| `--color-muted` | `#a39a90` | Secondary text on dark |
| `--color-gold` | `#cf9a3e` | Brand gold: CTAs, highlights |
| `--color-gold-light` | `#e9c46a` | Gold highlight, gradient top |
| `--color-gold-deep` | `#8c5a1e` | Gold shadow, gradient bottom |
| `--color-gold-soft` | `#cf9a3e33` | Gold tints, glows |
| `--color-brown` | `#5a3a24` | Wordmark brown, text on cream |
| `--color-cream-bg` | `#f3ebe1` | Light baby sections |
| `--color-cream-muted` | `#8a7666` | Secondary text on cream |
| `--color-blush` | `#e8b4b8` | Small accent in baby areas |
| `--color-line` | `#ffffff14` | Borders, dividers on dark |

Gold gradient for the logo, large headings and button borders: `linear-gradient(135deg, #e9c46a 0%, #cf9a3e 45%, #8c5a1e 100%)`. Check WCAG contrast for every text and background pair, including brown on cream.

### 4.3 Typography

- **Display:** Fraunces (variable). Its high-contrast serif matches the "akar" wordmark on the banner.
- **Body and UI:** Manrope (variable). Uppercase Manrope with wide tracking matches the banner's "DIGITAL PHOTO STUDIO" line.
- Fluid sizes with `clamp()`; hero headline about `clamp(3rem, 10vw, 10rem)`.
- Wide letter-spacing on small uppercase labels, tight tracking on huge headlines.
- Highlight key words in gold, as the banner does with "EMOTIONS" and "MEMORIES".

### 4.4 Layout

- Mobile-first: most local visitors use phones.
- Max content width about 1440px; full-bleed photos may break the grid.
- Generous dark space around photos.
- Mix masonry, bento grid, full-bleed and horizontal scroll strips.
- Many photos are portrait (2:3). Design grids and the hero so portrait photos look intentional, e.g. split layouts or tall bento cells, never awkward crops of faces.

### 4.5 Motion tokens

Define once in `src/lib/motion.ts` and use everywhere.

```ts
export const ease = { out: 'power3.out', inOut: 'power2.inOut', expo: 'expo.out' };
export const duration = { fast: 0.3, base: 0.6, slow: 1.2 };
export const stagger = { tight: 0.04, base: 0.08, loose: 0.15 };
```

### 4.6 Logo and brand assets (to be created)

The studio has no logo file. The only reference is a low-resolution banner photo, saved as `src/assets/brand/reference-banner.jpg` (cropped from the logo badge on one of the owner's originals). It contains a baby photo, so it is **git-ignored** and never committed while the repo is public; the dev-only brand check loads it only if present. **Redraw the logo as clean vector SVG.** Do not crop or auto-trace the banner photo, and never display the banner on the site.

What the banner logo contains:

- A large gold "A". A camera body outline in brown wraps around its lower left, and a round camera lens with gold rim sits inside the bottom of the "A", forming its counter.
- "akar" in a dark brown high-contrast serif, following the gold "A" to read "Aakar".
- "DIGITAL PHOTO STUDIO" in widely tracked uppercase sans, with a thin horizontal rule on each side.
- Tagline "CAPTURING EMOTIONS, CREATING MEMORIES" in uppercase sans, with "EMOTIONS" and "MEMORIES" in gold.

Deliverables in `src/assets/brand/`:

| File | Content |
| --- | --- |
| `logo-mark.svg` (+ `-light`) | Gold "A" with camera and lens only; `-light` has a cream camera for dark backgrounds |
| `logo-mark-simple.svg` (+ `-light`) | Simplified mark for 32–48 px: thicker strokes, fewer lens details |
| `logo-mark-tiny.svg` | Gold "A" and lens only, no camera, for 16–24 px (favicons) |
| `logo-horizontal-light.svg` | Full logo with cream text, for dark backgrounds |
| `logo-horizontal-dark.svg` | Full logo with brown text, for cream backgrounds |
| `logo-stacked-light.svg` / `-dark.svg` | Mark above wordmark, for the preloader and footer |
| `logo-tagline-light.svg` / `-dark.svg` | Horizontal logo with the tagline underneath |
| `png/` | Transparent PNG exports of each at 512, 1024 and 2048 px wide |
| Favicon set in `public/favicon/` | `favicon.svg`: square, camera cream on dark browser themes, and at 24 px or smaller it hides the camera and shows the A and lens only (an SVG media query on its rendered size). `favicon.ico`: 16 and 24 from `logo-mark-tiny`, 32 and 48 from `logo-mark-simple`. From 32 px up every icon keeps the camera: `favicon-32.png`, `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`; plus `public/site.webmanifest` |
| `public/og-image.jpg` | 1200×630 share image: logo on a dark background. **Logo-only until consent is confirmed** (it is public on social shares); a featured studio photo can be added after that |

Rules:

- Use an SVG `linearGradient` for the metallic gold (section 4.2).
- Convert all text to paths so exports look identical everywhere, for example with `opentype.js` or Python `fonttools`, using Fraunces and Manrope.
- Export PNGs with sharp (Node) or cairosvg/Pillow (Python).
- Keep `logo-mark.svg` readable at 32 px. Simplify lens details if needed. Below 32 px use the tiny mark (no camera).
- Camera outline weight: 2.75 (full mark) and 9.6 (simple mark) in banner pixels, about 20% heavier than the first draft, closer to the banner and balancing the gold A.
- **Approved** by the user and the owner on 2026-10-21, after the favicon and camera-weight tweaks. The logo may now be used on the site.
- Everything is generated by `pnpm brand:build` (`scripts/brand/`): the SVGs, PNGs, favicons, manifest, OG image and the inline art for the `Logo` component. Text outlines come from `outline_text.py` (Python: fontTools, uharfbuzz, brotli) and are cached in `scripts/brand/outlines.json`, so Python is only needed when logo text changes.
- Show the logo to the user for approval before using it anywhere. Keep the 2048 px exports crisp for print use.

## 5. Site structure

One long-scroll page in this order, each section its own component in `src/sections/`. Copy for every section is in section 17. Every section that depends on photos reads from `src/data/photos.manifest.json` and follows the "current state" notes, which reflect the inventory in section 7.3.

1. **Preloader** — Max about 2 seconds: the logo mark draws in (DrawSVG), the lens rim spins once like an aperture, then opens into the hero. Preloads the hero image. Skipped on repeat visits (sessionStorage) and for reduced-motion users.
2. **Header** — Light logo on the left. Transparent over the hero, then a blurred dark bar. Hides on scroll down, shows on scroll up. Links: Work, Services, Albums, About, FAQ, Contact. Gold "Book on WhatsApp" button. Mobile: full-screen Motion menu with staggered links.
3. **Hero** — Full-viewport crossfade between hero photos: WebGL crossfade with a subtle cursor-following ripple on desktop, simple crossfade on mobile. Kinetic SplitText headline, tagline with gold key words, sub-line, two CTAs and a scroll indicator. *Current state:* use the baby-kids hero candidates from section 7.3 (pick 4 to 5 with varied colour palettes). Portrait photos: use a split or offset layout on desktop rather than cropping faces. When wedding or newborn photos arrive, mix them in.
4. **Marquee** — Infinite keyword strip reacting to scroll velocity (words in section 17.3).
5. **Photo quality ("See the difference")** — Two parts, each shown only when its content exists:
   - **Zoom into detail:** a pinned section where scrolling zooms into one photo to reveal detail (eyes, embroidery, jewellery, tiny fingers). Uses the photo with an `xlSrc` (extra-large master). *Current state:* live.
   - **Before/after slider:** raw versus edited pairs. *Current state:* hidden, no pairs yet.
6. **Gallery** — Masonry or bento grid with hover zoom, parallax shift, caption reveal and a "View" cursor. Click opens the lightbox. Then a GSAP-pinned horizontal "Best of" strip of the featured photos.
   - **Filter logic:** if two or more categories have photos, filter by category (tabs for categories with photos only). If only one category has photos, filter by **theme** within it, using the labels in section 7.3. Motion layout animations on filter change.
   - *Current state:* only `baby-kids` has photos, so tabs are All plus the nine themes.
7. **"Tiny Fingers, Big Memories" band** — Cream section with brown text, 3 to 5 large photos, gentle parallax, newborn and baby trust points and a "Plan Your Baby's Shoot" WhatsApp CTA. *Current state:* the newborn photo (`newborn-studio-01`) with soft baby-kids photos (teddy, pink-winter themes).
8. **Albums** — Grid of album covers, each a real client album. Clicking opens a viewer: GSAP + CSS 3D flip-book on desktop, Embla swipe slider on mobile, with a GSAP Flip cover-to-viewer transition. Album spreads are wide (about 3:1); show them full-width in the viewer. Short note that every album is custom-designed. *Current state:* four albums (section 7.3). If an album has no `album-cover`, use its first page as the cover.
9. **Services** — Eight animated cards (section 17.6) with icon, title, description and an "Enquire" button opening WhatsApp pre-filled with that service. Hover reveals a photo with a gold glow; staggered scroll reveal. Below the cards, a compact "Also at the studio" row: passport and ID photos, photo printing, photo framing.
   - **Card images:** only real studio photos. A card without one is an elegant icon card, not a stock photo. *Current state:* Newborn, Maternity and Pre-Wedding use the 2026-10-23 photos; Baby & Kids uses a featured kids photo; Birthdays & Ceremonies uses a first-birthday photo; Wedding and Custom Photo Albums use album pages; Family is an icon card.
10. **"Anywhere you celebrate" band** — Short full-width statement: in-studio or outdoor, in Jalgaon or wherever the customer wants. Background: studio photo preferred; a licensed real stock landscape is acceptable here because it is atmosphere, not portfolio.
11. **Custom quote band** — Replaces pricing. No prices anywhere on the site. Headline and copy from section 17.8 with WhatsApp and Call buttons.
12. **How it works** — Five steps from section 17.9. A DrawSVG line connects them as you scroll.
13. **About** — Owner and team story (section 17.5), owner photo, studio photos, behind-the-scenes shots. Animated stats counters only when real numbers exist. *Current state:* no owner or studio photos yet; build the layout so it works text-only with the logo mark, and adds photos when the `about` category is filled.
14. **Testimonials** — Embla slider of real client reviews with event type; autoplay pauses on hover and focus, visible controls. Includes a "Read our Google reviews" link to the Maps listing. Hidden until real reviews are provided.
15. **FAQ** — Accordion (Motion) with the questions in section 17.10. Also output as `FAQPage` JSON-LD.
16. **Social grid** — Static grid of locally saved recent posts linking to the studio's Instagram. Hidden until a profile is provided.
17. **Contact** — Closing headline, WhatsApp, Call, Email and Directions buttons, inquiry form (name, phone, shoot type, preferred date, message) with animated success and error states, lazy-loaded Google Map, address and opening hours.
18. **Footer** — Light logo, "Digital Photo Studio", quick links, socials, address, hours, phone, email, copyright, and a large outlined "Aakar" as a final flourish.

Global extras: floating WhatsApp button on all devices, custom cursor on pointer devices only (dot plus ring, labels like "View" and "Drag"), CSS scroll progress bar and a back-to-top button.

## 6. Content and data architecture

All content lives in `src/data/`: `photos.manifest.json` (generated by the image pipeline, do not hand-edit except `consent` and `featured`), `studio.ts`, `services.ts`, `gallery.ts`, `albums.ts`, `testimonials.ts`, `process.ts`, `faq.ts`, `beforeAfter.ts`, `themes.ts`.

`gallery.ts` and `albums.ts` derive their data from the manifest; they do not duplicate it. `themes.ts` holds the theme label map from section 7.3.

Types live in `src/types/content.ts`:

```ts
export type Category =
  | 'newborn' | 'baby-kids' | 'maternity' | 'wedding'
  | 'pre-wedding' | 'family' | 'events' | 'product' | 'about';

export type PhotoSource = 'studio' | 'stock';   // no AI-generated photos, ever
export type PhotoKind = 'photo' | 'album-cover' | 'album-page';
export type QualityTier = 'hero' | 'fullbleed' | 'grid' | 'small';

// Matches entries in src/data/photos.manifest.json
export interface Photo {
  id: string;
  src: string;                // WebP master, e.g. src/assets/photos/baby-kids/baby-kids-farm-theme-03.webp
  xlSrc?: string;             // extra-large master for the zoom section
  alt: string;
  category: Category | `albums/${string}`;
  orientation: 'portrait' | 'landscape' | 'square';
  width: number;
  height: number;
  source: PhotoSource;
  theme?: string;             // e.g. 'farm-theme'
  kind: PhotoKind;
  album: string | null;       // album slug
  albumOrder: number | null;  // 0 = cover
  qualityTier: QualityTier;
  featured: boolean;
  consent: boolean | null;    // null = not yet confirmed
  requiresConsent?: boolean;  // child or identifiable private event
  credit?: string;            // stock only
  licenseUrl?: string;        // stock only
  originalFile?: string;
}

export interface Album {
  slug: string;
  title: string;
  subtitle?: string;          // other text printed on the pages
  type: string;
  cover: Photo;               // album-cover, or first page if none
  pages: Photo[];             // sorted by albumOrder
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;               // lucide-react icon name
  imageId?: string;           // manifest id; omit for icon-only cards
  whatsappMessage: string;
}

export interface Testimonial {
  id: string;
  name: string;
  event: string;
  quote: string;
  rating?: number;
  sourceUrl?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
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
  phone: string;
  whatsapp: string;           // digits only, with country code
  email: string;
  hours: { days: string; opens: string; closes: string }[];
  mapLink: string;
  mapEmbedUrl: string;
  socials: { platform: string; url: string }[];
  stats: { label: string; value: number; suffix?: string }[];
  foundedYear?: number;
}
```

**Consent gate:** a helper `isPublishable(photo)` returns false when `requiresConsent` is true and `consent` is not `true`. In development, show such photos with a small "consent pending" badge. In production builds, an environment flag `VITE_ENFORCE_CONSENT=true` hides them. The flag must be on for the final launch build.

A section whose data is empty (stats, testimonials, socials, before/after, about photos) hides itself or renders its fallback. It never shows invented content.

## 7. Images

### 7.1 Photo sources (mandatory rules)

All photos on the site are real photographs. **No AI-generated images anywhere**, including placeholders and decoration. Customers book based on the portfolio, so it must show only the studio's own work.

| Source | Where it comes from | Allowed use | Not allowed |
| --- | --- | --- | --- |
| `studio` | Photos supplied by the owner, and all photos on the studio's Google Maps listing (uploaded by the owner) | Everywhere: hero, gallery, albums, before/after, About, services, OG image | — |
| `stock` | Real photographs from free-licensed sites whose licence allows commercial use (e.g. Unsplash, Pexels); check each licence | Backgrounds, textures, section backdrops, atmosphere shots (e.g. behind the "Anywhere you celebrate" band) | Gallery, albums, before/after, hero, service card photos, testimonials, or anywhere that implies it is the studio's work |

- Never use photos from Google image search or other photographers' websites.
- Keep a `CREDITS.md` listing every stock image, its source page and licence.

### 7.2 Pipeline

**Stage 1, done:** `scripts/images/` turned the owner's originals into WebP masters in `src/assets/photos/`: sRGB, all metadata stripped, long edge capped at 2560px for photos and 3840px for album spreads, plus one `-xl.webp` up to 4000px for the zoom section. New photos from the owner go through the same scripts (`images:*`), never by hand.

**Stage 2, website build:** generate responsive sizes from the masters with `vite-imagetools`:

1. Widths 480, 768, 1200, 1920 and 2560 (album pages and covers also 3840, `-xl` masters also 3200 and 4000), never above the master's own width; the master width itself is added when it is more than 10% above the last step. Rules live in `src/lib/imagePolicy.ts`.
2. AVIF plus WebP output.
3. Render every image through one `ResponsiveImage` component using `picture`, `srcset`, `sizes`, and the manifest's width/height to prevent layout shift. Below the fold: `loading="lazy"` and `decoding="async"`.
4. Hero image: `loading="eager"`, `fetchpriority="high"`, preloaded.
5. A tiny base64 blur placeholder (20 px WebP, inlined at build time, never committed) fades into the full image.
6. `alt` text comes from the manifest.
7. No watermarks.
8. `src/lib/images.ts` resolves the masters with `import.meta.glob` (`?responsive` and `?placeholder` queries; `_review` is excluded). A missing file (fresh clone) resolves to `undefined` and `ResponsiveImage` shows a same-size neutral placeholder; the build never fails.
9. A build-time photo gate in `vite.config.ts` stops excluded photos, photos missing from the manifest, and (with `VITE_ENFORCE_CONSENT=true`) consent-pending photos from being encoded or emitted into `dist/`, so they are never reachable by URL.
10. Encoded images are cached in `node_modules/.cache/imagetools`. Production builds encode AVIF at effort 3, quality 53 (same measured quality as sharp's default effort 4, quality 50, at about a quarter of the time): measured 2026-10-21 on all 53 published photos: cold build 138 s, warm build 18 s (before tuning: 603 s and 58 s); AVIF output 23.4 MB (was 21.6 MB). The width set stays as listed in step 1 (no 1024 step).
11. `pnpm dev` encodes WebP only, at 768 and 1920 px (plus the photo's own width if smaller), so a first dev load takes about 25 s. Builds always use the full width set and both formats. Both rules live in `src/lib/imagePolicy.ts`.

Folders: `src/assets/photos/<category>/`, `src/assets/photos/albums/<slug>/`, `src/assets/photos/about/`, `src/assets/photos/stock/`, and `src/assets/photos/_review/` (never imported by the site). The originals in `src/haveToProcessImages/` are git-ignored and never imported.

### 7.3 Current photo inventory (2026-10-17, updated 2026-10-23)

73 originals (760 MB) became 56 WebP masters (23.9 MB). 17 duplicates were skipped. 54 are in the manifest and 2 are in `_review`.

**Added 2026-10-23:** 7 originals delivered in `scripts/new_added_photos/` (git-ignored), category taken from the file names. 6 were added with `pnpm images:add` (`scripts/images/add-new.mjs`: same encoding as `images:export`; it only appends to the manifest, so hand-edited `consent` and `featured` stay as they are; re-run it after any `images:export`). The manifest now has 60 entries. `family.jpg` was not added: it carries another studio's branding ("Krishna Kids Photography" logo and phone numbers).

| Category | Count | Notes |
| --- | --- | --- |
| `baby-kids` | 39 | All themed studio shoots |
| `albums/wedding-01` | 7 | Designed wedding album pages; show the couple's names, date and guests including children |
| `albums/little-farmer` | 3 | Designed album pages |
| `albums/little-farmer-green` | 3 | Designed album pages |
| `albums/beach-baby` | 2 | No cover; use the first page as cover |
| `_review` | 2 | DSC00006 and DSC00008, a woman in a floral-arch portrait; category to be confirmed by the owner |
| `newborn` | 1 | `newborn-studio-01` (2026-10-23) |
| `maternity` | 1 | `maternity-portrait-01` (2026-10-23) |
| `pre-wedding` | 4 | `pre-wedding-outdoor-01` to `-03` and `pre-wedding-ring-ceremony-01` (engagement ring close-up, hands only) (2026-10-23) |
| `wedding` (photos), `family`, `events`, `about` | 0 | Requested from the owner |

With four categories the gallery filters by category (section 5, item 6): All, Newborn, Baby & Kids, Maternity, Pre-Wedding.

**Theme labels** (for gallery filters and captions, in `src/data/themes.ts`):

| Theme id | Label |
| --- | --- |
| `traditional-flowers` | Traditional Florals |
| `krishna-theme` | Little Krishna |
| `kutchi-traditional` | Kutchi Traditional |
| `farm-theme` | Little Farmer |
| `beach-theme` | Beach Baby |
| `teddy-theme` | Teddy Time |
| `first-birthday` | First Birthday |
| `blue-sky` | Blue Skies |
| `pink-winter` | Pink Winter |

**Featured (12)**, all in `src/assets/photos/baby-kids/`: traditional-flowers-02, traditional-flowers-03, krishna-theme-01, teddy-theme-01, farm-theme-01, farm-theme-04, beach-theme-04, first-birthday-01, kutchi-traditional-01, kutchi-traditional-06, blue-sky-03, pink-winter-01.

**Hero candidates (8):** traditional-flowers-01, traditional-flowers-03, krishna-theme-01, farm-theme-01, beach-theme-04, kutchi-traditional-01, blue-sky-01, pink-winter-01.

**Consent status:** `consent` is `null` on every entry. 49 of 54 photos show children, and the wedding album shows a private couple and guests. The 2026-10-23 newborn, maternity and couple photos show identifiable private clients; only the ring close-up does not. All of these have `requiresConsent: true` and must be confirmed by the owner before launch (section 6, consent gate).

**Excluded:** `wedding-01-06` (album back cover) shows an older blue Aakar logo. It is listed in `excludedPhotos` in `src/data/curation.ts`, so no getter returns it and the build never emits it, until the owner confirms which logo is current.

## 8. Animation specification

### 8.1 Signature moments

1. Logo preloader into hero reveal
2. Hero WebGL photo crossfade and kinetic headline
3. Zoom-into-detail quality section (plus before/after when pairs exist)
4. Horizontal "Best of" gallery
5. Album cover into flip-book transition (built in Phase 8 with the album viewer; moments 1 to 4 are Phase 7)

Everything else is polished but restrained.

### 8.2 Rules

- Animate only `transform` and `opacity`; use `clip-path` and filters sparingly. Never animate layout properties with GSAP.
- Always scope GSAP with `useGSAP({ scope: ref })` so cleanup works in React StrictMode.
- Register GSAP plugins once in `src/lib/gsap.ts`.
- Lenis: `lenis.on('scroll', ScrollTrigger.update)`, drive Lenis from `gsap.ticker`, set `gsap.ticker.lagSmoothing(0)`.
- Call `ScrollTrigger.refresh()` after images and fonts load.
- Use `gsap.matchMedia()` for separate desktop and mobile animation sets.

### 8.3 Reduced motion (mandatory)

When `prefers-reduced-motion: reduce` is set (via a `useReducedMotion()` hook and `gsap.matchMedia()`):

- Native scroll instead of Lenis.
- No preloader, pinned sequences, parallax, marquee movement or WebGL; show static images.
- Only quick opacity fades remain.

### 8.4 Mobile

- Shorter movement distances and fewer pinned sequences.
- No WebGL shader effects by default.
- No custom cursor on touch devices.
- Test on a mid-range Android phone.

## 9. Performance targets

| Metric | Target |
| --- | --- |
| Lighthouse Performance (mobile) | 90 or higher |
| Lighthouse Accessibility | 95 or higher |
| Lighthouse SEO and Best Practices | 95 or higher |
| Largest Contentful Paint | Under 2.5 s on 4G |
| Cumulative Layout Shift | Under 0.1 |
| Interaction to Next Paint | Under 200 ms |

Code-split WebGL, the lightbox and the album viewer. Lazy-load the map iframe. Self-host fonts with `font-display: swap` and preload the display font. Never ship the 2560px or `-xl` masters to mobile; `srcset` must serve appropriate widths.

## 10. Accessibility

- Semantic landmarks (header, nav, main, sections with headings, footer) and a skip-to-content link.
- Full keyboard navigation with visible focus styles; the custom cursor never hides focus.
- Lightbox, album viewer and FAQ accordion: correct ARIA, Esc to close, arrow keys where relevant, focus trap in dialogs.
- Carousels pause on hover and focus and have visible, labelled controls.
- WCAG 2.2 AA text contrast on dark and cream backgrounds.
- `alt` text on all images; decorative images use `alt=""`. The logo has `alt="Aakar Digital Photo Studio"`.
- SplitText headlines keep an `aria-label` with the full text for screen readers.

## 11. SEO (local business)

- Pre-render at build time so the HTML holds real content.
- **Title:** Aakar Digital Photo Studio | Newborn, Baby & Wedding Photographer in Jalgaon
- **Meta description:** Newborn, baby, maternity, wedding, pre-wedding and family photography in Jalgaon, Maharashtra. Studio and outdoor shoots, custom albums. Call or WhatsApp 9890468885.
- **Keywords:** newborn photography Jalgaon, baby photoshoot Jalgaon, kids theme photoshoot Jalgaon, first birthday photoshoot Jalgaon, wedding photographer Jalgaon, pre-wedding shoot Jalgaon, maternity photoshoot Jalgaon, passport photo Jalgaon, photo studio Jalgaon.
- **JSON-LD `ProfessionalService`:** name, founder/owner Prakash S. Suryawanshi, telephone `+91-9890468885`, email, `PostalAddress` (streetAddress "Shop No. 6, Om Chamber, in front of Jalgaon Court", addressLocality Jalgaon, addressRegion Maharashtra, postalCode 425001, addressCountry IN), `openingHoursSpecification` from section 17.1, `hasMap` with the Maps link, `areaServed` Jalgaon and beyond. Add geo coordinates and `sameAs` socials when available. No `aggregateRating` until real ratings are provided.
- **JSON-LD `FAQPage`** from section 17.10.
- Open Graph and Twitter tags with `public/og-image.jpg`.
- `sitemap.xml`, `robots.txt`, favicon set and `site.webmanifest`. Domain TBD: use a placeholder base URL in one config constant.
- One `h1` and a clean heading hierarchy.

## 12. Folder structure

```text
/
├── public/                  favicon/, og-image.jpg, robots.txt, sitemap.xml
├── scripts/
│   ├── images/              analyze, dedupe, contact-sheets, classify, export, report, lib (.mjs)
│   │   └── out/             reports and contact sheets (git-ignored)
│   └── brand/               build.mjs (pnpm brand:build), outline_text.py, outlines.json
├── src/
│   ├── haveToProcessImages/ owner's originals (git-ignored, never imported; backup in the owner's Google Drive)
│   ├── assets/
│   │   ├── brand/           reference-banner.jpg (reference only, git-ignored), logo SVGs, png/
│   │   ├── photos/          git-ignored while the repo is public; regenerate with images:*
│   │   │   ├── baby-kids/   WebP masters (+ one -xl.webp)
│   │   │   ├── albums/      wedding-01/, little-farmer/, little-farmer-green/, beach-baby/
│   │   │   ├── about/       owner, studio, behind-the-scenes (empty for now)
│   │   │   ├── stock/       licensed real photos, non-portfolio use only
│   │   │   └── _review/     never imported by the site
│   │   └── rive/            optional .riv files
│   ├── components/
│   │   ├── ui/              Button, SectionHeading, Tag, ResponsiveImage, Reveal, Logo
│   │   ├── layout/          Header, Footer, MobileMenu
│   │   ├── cursor/          CustomCursor
│   │   ├── gallery/         GalleryGrid, FilterTabs, Lightbox
│   │   ├── album/           AlbumGrid, AlbumViewer, FlipBook
│   │   ├── webgl/           HeroCanvas, shaders
│   │   └── common/          Preloader, WhatsAppFab, ScrollProgress, BackToTop
│   ├── sections/            Hero, Marquee, Quality, Gallery, NewbornBand, Albums,
│   │                        Services, AnywhereBand, QuoteBand, Process, About,
│   │                        Testimonials, Faq, Social, Contact
│   ├── data/                photos.manifest.json + content files (section 6)
│   ├── hooks/               useReducedMotion, useLenis, useMediaQuery, useIsTouch
│   ├── lib/                 gsap.ts, motion.ts, cn.ts, whatsapp.ts, site.ts, photos.ts
│   ├── styles/              index.css (@theme), animations.css
│   ├── types/content.ts
│   ├── App.tsx
│   └── main.tsx
├── CREDITS.md
├── index.html
├── vite.config.ts
├── tsconfig.json
└── PROJECT_SPEC.md
```

## 13. Shared utilities

- `cn(...classes)` combining clsx and tailwind-merge.
- `whatsappLink(message)` returning `https://wa.me/919890468885?text=(encoded message)`; every Enquire and Book button uses it with a context-specific message.
- `src/lib/photos.ts`: typed access to the manifest: `getPhotos({ category?, theme?, featured?, tier? })`, `getPhoto(id)`, `getAlbums()`, `getHeroPhotos()`, `isPublishable(photo)`, `categoriesWithPhotos()`, `themesIn(category)`. Every section gets photos through these helpers.
- `useReducedMotion()`, `useIsTouch()`, `useMediaQuery()`.
- `ResponsiveImage`, the only way photos are rendered.
- `Logo` component with `variant` (`horizontal` | `stacked` | `mark`) and `tone` (`light` | `dark`).
- `Reveal`, a scroll-reveal wrapper using CSS scroll-driven animation with a fallback.
- `SectionHeading`, an eyebrow label plus kinetic title.

## 14. Build phases

Keep the site working at every step. At the end of each phase, report back, suggest commit messages and wait for the user's go-ahead. **Claude suggests commit messages; the user commits and pushes.** Claude does not run builds either: it says which build to run and what to check, and the user runs it.

1. Setup verification and configuration: everything in section 0.
2. Foundation: folder structure (section 12), GSAP plugin registration and Lenis wiring, motion tokens, hooks and utilities (section 13, including `photos.ts`), types and data files with the real copy from section 17.
3. Brand assets: logo SVGs, PNG exports, favicon set and OG image (section 4.6). Get user approval (it blocks Phase 5, not Phase 4).
4. Image delivery: `vite-imagetools` setup and `ResponsiveImage` (section 7.2, stage 2). The masters already exist.
5. Static layout: every section responsive with no animation, using real manifest photos, checked on mobile. Needs the logo approved.
6. Core motion: reveals, kinetic type, header behaviour, marquee, cursor.
7. Signature moments 1 to 4 (section 8.1): preloader, hero, zoom into detail, "Best of" strip.
8. Interactive pieces: filters, lightbox, carousels, album viewer with signature moment 5 (cover into flip-book), FAQ accordion, contact form.
9. SEO and accessibility pass, including adding pre-rendering.
10. Performance pass: Lighthouse, bundle analysis, mobile testing.
11. Content top-up: process any new photos from the owner with `images:*`, set `consent`, add reviews and socials.
12. Deploy (with `VITE_ENFORCE_CONSENT=true`).

## 15. Deployment

Deploy the static `dist/` folder to Netlify, Cloudflare Pages, Vercel or GitHub Pages on a free tier. Domain TBD, HTTPS on, long cache headers for hashed assets.

The repo is public during development, so client photos are not in git. Deploy from a local build with the Netlify or Cloudflare CLI (e.g. `netlify deploy --prod --dir dist` or `wrangler pages deploy dist`). If the repo becomes private later, the photos can be committed and the site deployed from git.

## 16. Acceptance checklist

- [ ] First screen loads fast and looks stunning on mobile and desktop
- [ ] Logo approved, crisp at every size, favicon working
- [ ] All photos served as AVIF/WebP with responsive sizes and no layout shift
- [ ] No AI-generated images anywhere; no stock photo in any portfolio area; CREDITS.md complete
- [ ] Sections and filters adapt to the photos that exist; nothing empty or broken
- [ ] Every published child photo and the wedding album have confirmed consent; launch build uses `VITE_ENFORCE_CONSENT=true`
- [ ] Warm dark theme with cream baby sections, gold accents, large kinetic type
- [ ] Reduced-motion users get a calm, fully usable site
- [ ] Gallery, lightbox, album viewer and FAQ work with mouse, touch and keyboard
- [ ] Every CTA opens WhatsApp, a call or the form with a relevant message
- [ ] Contact form submits without a backend
- [ ] No prices, invented stats or invented reviews anywhere
- [ ] Lighthouse targets in section 9 met on mobile
- [ ] LocalBusiness and FAQPage JSON-LD validate
- [ ] All content editable from `src/data/` only

## 17. Studio details and website copy

Use this copy as written in `src/data/`. Items marked TBD stay as placeholders until confirmed.

### 17.1 Basics

| Item | Value |
| --- | --- |
| Studio name | Aakar Digital Photo Studio |
| Line under name | Digital Photo Studio |
| Owner | Prakash S. Suryawanshi (spelling to confirm) |
| Team | A team of photographers, videographers, album designers and support staff |
| Address | Shop No. 6, Om Chamber, in front of Jalgaon Court, Jalgaon, Maharashtra 425001 |
| Phone and WhatsApp | 9890468885 (`tel:+919890468885`, `https://wa.me/919890468885`) |
| Email | aakardigital81@gmail.com |
| Opening hours | Monday to Saturday 10:00 AM – 8:00 PM; Sunday 10:00 AM – 3:00 PM (AM/PM to confirm) |
| Google Maps link | https://maps.app.goo.gl/WQSiiJc4WbKtbNfx6 (Directions button and `hasMap`) |
| Map embed | Use `https://www.google.com/maps?q=Om+Chamber+Jalgaon+Court+Jalgaon+425001&output=embed` until the official embed code from Google Maps (Share → Embed a map) is provided |
| Founded / years in business | TBD |
| Instagram / Facebook / YouTube | TBD (user will send) |
| Domain | TBD |

### 17.2 Taglines

| Where | Line |
| --- | --- |
| Primary (hero, title) | Capturing Emotions, Creating Memories. (gold on "Emotions" and "Memories") |
| Baby band | Tiny Fingers, Big Memories. |
| Albums section | Your Memories Today, Your Treasures Forever. |
| Gallery heading | Every Picture Tells Your Story. |
| Anywhere band | Wherever you celebrate, we'll be there. |
| Footer | Little Moments. Lasting Memories. |

### 17.3 Hero and marquee

- **Headline:** Aakar Digital Photo Studio
- **Tagline:** Capturing Emotions, Creating Memories
- **Sub-line:** Newborn, baby, maternity, wedding and family photography in Jalgaon, in our studio, outdoors, or wherever you celebrate.
- **CTAs:** View Our Work · Book on WhatsApp
- **Marquee:** Newborn · Baby & Kids · Themed Shoots · First Birthday · Maternity · Weddings · Pre-Wedding · Family · Custom Albums

### 17.4 Home intro

Every moment tells a story. At Aakar Digital Photo Studio, we capture yours with creativity, care and professional craft. From a newborn's very first days to the rituals and celebrations of your wedding, we turn fleeting moments into photographs you'll treasure for a lifetime.

### 17.5 About us (confirm TBD facts)

Aakar Digital Photo Studio is a photography studio in the heart of Jalgaon, led by Prakash S. Suryawanshi. [For TBD years,] we have been photographing the moments families never want to forget: a newborn's first days, the glow of motherhood, a child's birthday, and the emotions of a wedding day.

Behind every shoot is a dedicated team of photographers, videographers and album designers. We shoot in our studio, outdoors, or wherever you need us, in Jalgaon and beyond.

Every shoot ends the same way: with photographs and albums made just for you, to be kept, shared and relived for years to come.

### 17.6 Services (eight cards)

| Service | Icon | Image (current) | Description | WhatsApp message |
| --- | --- | --- | --- | --- |
| Newborn Photoshoot | `Baby` | `newborn-studio-01` | Your baby's first days, beautifully preserved. Gentle poses, soft lighting and carefully styled setups, always at your baby's pace and with their comfort first. | Hi Aakar Digital Photo Studio, I'd like to know about a Newborn Photoshoot. |
| Baby & Kids Themed Shoots | `Sparkles` | Featured kids photo | Little Krishna, Little Farmer, Beach Baby and more: playful themed sets for babies and children of any age, in our studio or outdoors. Bring their favourite outfits and we'll create the magic. | Hi, I'd like to know about a Baby and Kids Themed Photoshoot. |
| Maternity Photoshoot | `Heart` | `maternity-portrait-01` | Celebrate the journey to motherhood with elegant portraits, graceful poses and personalised concepts that preserve this beautiful chapter. | Hi, I'd like to know about a Maternity Photoshoot. |
| Wedding Photography | `Gem` | wedding-01 album page | From haldi to vidaai, we capture the rituals, candid emotions, couple portraits and family moments that make your day unforgettable, wherever you celebrate. | Hi, I'd like to know about Wedding Photography. |
| Pre-Wedding & Engagement | `HeartHandshake` | `pre-wedding-outdoor-03` | Tell your love story before the big day, with relaxed couple portraits at the locations you love. | Hi, I'd like to know about a Pre-Wedding Shoot. |
| Family & Sibling Portraits | `Users` | Icon card | Real smiles and loving connections, with natural, coordinated portraits of parents, siblings and the whole family. | Hi, I'd like to know about a Family Photoshoot. |
| Birthdays & Ceremonies | `PartyPopper` | first-birthday photo | First birthdays, half birthdays, naming ceremonies and family functions, captured with every smile and every detail. | Hi, I'd like to know about photography for a birthday or ceremony. |
| Custom Photo Albums | `BookOpen` | Album spread (little-farmer or wedding-01) | Albums designed entirely around your photos and your taste, in any style, size or finish you like. | Hi, I'd like to know about Custom Photo Albums. |

**Also at the studio** (compact row, icons `IdCard`, `Printer`, `Frame`): Passport & ID Photos · Photo Printing · Photo Framing. WhatsApp message: "Hi, I'd like to know about passport photos, printing or framing."

### 17.7 Baby trust points

- Your baby's comfort and safety come first; we follow the baby's pace.
- Warm, clean studio with soft, gentle lighting.
- Bring your baby's favourite outfits and wraps, and we'll take care of the rest.
- Parents stay with the baby throughout.

### 17.8 Custom quote band (no prices)

- **Headline:** Every shoot is made for you.
- **Copy:** Every family and every celebration is different, so we don't believe in one-size-fits-all packages. Tell us what you have in mind and we'll put together the right plan for you.
- **CTAs:** Get a quote on WhatsApp · Call us

### 17.9 How it works

1. **Get in touch** — Call or WhatsApp us with your date and idea.
2. **Plan together** — We discuss the shoot, theme, location and style you want.
3. **Shoot day** — In our studio, outdoors, or at your venue.
4. **Editing** — Our team carefully selects and edits your best moments.
5. **Delivery** — As soon as possible, in the format you choose: pen drive, Google Drive, WhatsApp, or a custom printed album.

### 17.10 FAQ

| Question | Answer |
| --- | --- |
| How much does a photoshoot cost? | Every shoot is different, so we prepare a custom quote for you. Call or WhatsApp us on 9890468885. |
| Do you shoot outside Jalgaon? | Yes. We travel wherever you want us, for weddings, events and outdoor shoots. |
| Do you do outdoor shoots? | Yes. We shoot in our studio, outdoors, or at your venue. |
| Is there an age limit for baby and kids shoots? | No. We photograph newborns, babies and children of any age. |
| What themes do you offer for kids? | Many, including Little Krishna, Little Farmer, Beach Baby, Traditional Florals, Kutchi Traditional, Teddy Time, Blue Skies, Pink Winter and First Birthday setups. Ask us about the latest themes. |
| What should I bring for a baby shoot? | Please bring your baby's outfits, wraps and any favourite toys. We take care of the lighting, setups and photography. |
| How will I receive my photos? | In whatever format you prefer: pen drive, Google Drive, WhatsApp, or a printed album. |
| How soon will I get my photos? | We deliver as soon as possible after your shoot. |
| Can I customise my album? | Yes. Every album is designed to your choice of style, size and finish. |
| Do you offer passport photos and printing? | Yes. Visit the studio for passport and ID photos, photo printing and framing. |

### 17.11 Short business description

Aakar Digital Photo Studio, Jalgaon. Newborn, baby and kids themed shoots, maternity, wedding, pre-wedding and family photography, with custom albums, printing and framing. Studio and outdoor shoots.

### 17.12 Contact closing headline

Let's capture your story.

### 17.13 Photo quality section ("See the difference")

- **Title:** Every detail, beautifully clear.
- **Copy:** Look closer: the embroidery, the jewellery, the tiniest expressions. Every photograph is carefully lit, shot and edited so the details hold up, on screen and in print.

## 18. Open items and change log

### 18.1 Still needed

- [ ] **Consent (launch blocker):** confirm parents agreed for every child photo used (49 photos), and the wedding couple agreed for the wedding-01 album (shows names, date and guests)
- [ ] Confirm opening hours are AM/PM as assumed (10 AM – 8 PM, Sunday 10 AM – 3 PM)
- [ ] Confirm the owner's name spelling: Prakash S. Suryawanshi
- [ ] What are DSC00006 and DSC00008 (woman, floral arch): maternity, portrait or something else?
- [ ] Does the studio offer regular wedding or event video coverage (not cinematic films)? If yes, add it as a service
- [ ] For baby shoots, does the studio provide props and themed backdrops? (The themed sets in the photos suggest yes)
- [ ] Photos still needed: wedding (actual photos, not only album pages), family, events; more newborn, maternity and pre-wedding (one or a few of each so far)
- [ ] `family.jpg` (delivered 2026-10-23) carries "Krishna Kids Photography" branding and phone numbers: is it the studio's own work? Not published; a clean, unbranded version is needed if it is
- [ ] `pre-weding1.jpg` (now `pre-wedding-outdoor-01`): the pose suggests a maternity couple shoot; confirm pre-wedding or maternity
- [ ] Owner photo and studio or behind-the-scenes photos (`about`)
- [ ] Clean versions without the logo badge of DSC00008, DSC01597 and DSC01615
- [ ] A cover for the beach-baby album
- [ ] Before/after photo pairs (section hidden without them)
- [ ] Year the studio started (optional)
- [ ] Instagram, Facebook and YouTube links
- [ ] Real customer reviews (from the Google Maps listing, with permission to quote)
- [ ] Real numbers for stats (optional; section hidden without them)
- [x] Logo approved by the user and the owner (2026-10-21)
- [ ] Which logo is current: the gold "A" banner logo or the older blue logo on the wedding-01 back cover? (`wedding-01-06` stays excluded until confirmed)
- [ ] Domain

### 18.2 Decisions made

- Prices and packages are never shown; all pricing goes through WhatsApp or a call.
- No cinematic films section or video embeds.
- English only. No watermarks.
- No AI-generated images anywhere on the site.
- Google Maps listing photos are owner-uploaded and count as studio photos.
- The studio does not provide baby outfits or wraps; copy reflects this.
- Product photography is not offered (removed from services, marquee, description and SEO, 2026-10-23).
- Logo is redrawn as SVG from the banner reference.
- The site adapts to available photos: theme filters when only one category exists, icon-only service cards without real photos, hidden sections without content.
- Child photos and the wedding album are gated behind confirmed consent in the launch build.
- Repo is public during development; client photos are never committed while it is public.

### 18.3 Change log

| Date | Change |
| --- | --- |
| 2026-10-23 | WebGL: hand-written WebGL2 module instead of three + R3F, approved by the user (section 2 table): measured lazy chunk 2.1 KB gz versus 335.6 KB |
| 2026-10-23 | Signature moment 5 (album cover into flip-book) moved from Phase 7 to Phase 8, with the album viewer (8.1, 14). `.gitattributes` added (LF line endings) |
| 2026-10-23 | Product photography removed (1, 5, 11, 17.3, 17.6, 17.11, 18.2); services are now eight. 6 new photos added with the new `pnpm images:add` (7.3): newborn, maternity and pre-wedding service cards and the baby band use them, and the gallery now filters by category. `family.jpg` withheld (another studio's branding, 18.1). `scripts/new_added_photos/` git-ignored |
| 2026-10-21 | Photo quality copy approved and added (17.13). Phase 5 Part A accepted: split hero layout |
| 2026-10-21 | Logo approved by the user and the owner (4.6, 18.1); Phase 5 started |
| 2026-10-21 | Logo tweaks (4.6): favicons at 16/24 px show only the A and lens (`logo-mark-tiny`, ICO 16/24, adaptive `favicon.svg`); camera outline ~20% heavier in all variants. Final logo confirmation by the user and owner pending. 7.2 records the final image settings and measured build times (cold 138 s, warm 18 s) |
| 2026-10-21 | Image delivery (Phase 4): width and gate rules in `imagePolicy.ts`, `images.ts` glob resolution, build-time photo gate, imagetools cache, inline blur placeholders, AVIF effort 3 / quality 53 for builds, WebP-only 768/1920 in dev (7.2). `wedding-01-06` excluded via `excludedPhotos` (7.3, 18.1). Logo approval now blocks Phase 5, not Phase 4. Commit rule: Claude suggests commit messages, the user commits, pushes and runs builds (14) |
| 2026-10-20 | Logo phase: reference banner cropped from an original's logo badge and git-ignored (4.6, 12). Added `logo-mark-simple`, `-light` marks and tagline lockups, favicon list and web manifest; OG image is logo-only until consent is confirmed; assets built by `pnpm brand:build` (4.6, 12). Albums gained an optional `subtitle` (section 6) |
| 2026-10-18 | Tech stack table (section 2): code quality uses oxlint instead of ESLint |
| 2026-10-18 | Repo is public during development: `src/assets/photos/` git-ignored (manifest still committed), originals backed up in the owner's Google Drive, deploys from a local build via the Netlify or Cloudflare CLI (0.4 step 12, sections 12, 15, 18.2). Linting uses oxlint instead of ESLint (0.4 step 10) |
| 2026-10-17 | Image processing complete: added inventory (7.3), theme labels, featured and hero lists, manifest-based Photo type, `photos.ts` helpers, consent gate, two-stage image pipeline, xl master for zoom, 3840px album spreads. Adapted hero, gallery (theme filters), baby band, services (real images or icon cards), albums and About to the real photos. Updated FAQ, marquee and SEO keywords for themed kids shoots. Added new open items |
| 2026-10-16 | Banned AI-generated images entirely. Confirmed Google Maps listing photos count as `studio`. Clarified stock rules |
| 2026-10-16 | Added real address, email, hours, Maps link, owner and team. Removed cinematic films. Expanded services, added FAQ, anywhere band, quote band, logo spec, brand phase, banner colours, cream section, photo source rules. English only, no watermarks |
| 2026-10-16 | Added section 0 (setup status, pnpm-only rule, package audit, configuration, verification) |
| 2026-10-16 | Added studio details, services copy, taglines, About copy, warm-dark theme, child-photo consent rule and SEO values |
| 2026-10-16 | Initial spec: stack, design system, sections, requirements |
