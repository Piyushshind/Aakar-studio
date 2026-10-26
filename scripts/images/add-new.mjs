// Add newly delivered photos without re-running the whole pipeline.
// Usage: node scripts/images/add-new.mjs [--dry-run] [--force]   (pnpm images:add)
//
// Reads originals from scripts/new_added_photos/ (git-ignored), encodes them exactly like
// export.mjs (orientation fix, sRGB, ≤2560px, WebP q88 effort 6, all metadata stripped) and
// APPENDS entries to src/data/photos.manifest.json. Existing entries, including hand-edited
// `consent` and `featured`, are never changed. Idempotent: run it again and nothing changes.
//
// Note: images:export rebuilds the manifest from the original batch only. If it is ever re-run,
// run images:add afterwards to restore these entries.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT, PHOTOS_DIR, MANIFEST_PATH, DRY_RUN, args, readJson, writeOut, log } from './lib.mjs';

const NEW_DIR = path.join(ROOT, 'scripts/new_added_photos');
const FORCE = args.has('--force');

// Same as export.mjs and classify.mjs.
const MAX_EDGE = 2560;
const WEBP_PHOTO = { quality: 88, effort: 6, smartSubsample: true };
const HERO_EDGE = 2400;
const FULLBLEED_EDGE = 1800;
const GRID_EDGE = 1000;
const SHARP_ENOUGH = 150;
const LAPLACIAN = { width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0], offset: 128 };

// The decisions, per original file (category from the file name the owner gave it).
// requiresConsent: children, and identifiable people at private events (spec 6). The engagement
// close-up shows only hands, so it needs none.
const PHOTOS = {
  'new-born.jpg': {
    category: 'newborn',
    theme: 'studio',
    alt: 'Sleeping newborn in a pink and white striped outfit and bow headband on a soft pink blanket',
    requiresConsent: true,
  },
  'maternity.jpg': {
    category: 'maternity',
    theme: 'portrait',
    alt: 'Expectant mother in a flowing maroon gown, cradling her bump',
    requiresConsent: true,
  },
  'engagment.jpg': {
    category: 'pre-wedding',
    theme: 'ring-ceremony',
    alt: 'Close-up of a ring being slipped onto a hennaed hand over a bouquet of red roses',
    requiresConsent: false,
  },
  'pre-weding1.jpg': {
    category: 'pre-wedding',
    theme: 'outdoor',
    alt: 'Couple standing close in a field of dry grass, she in a red dress',
    requiresConsent: true,
  },
  'pre-weding2.jpg': {
    category: 'pre-wedding',
    theme: 'outdoor',
    alt: 'Couple smiling at each other outdoors, he in an ivory sherwani and she in a lilac lehenga with a pink bouquet',
    requiresConsent: true,
  },
  'pre-weding3.jpg': {
    category: 'pre-wedding',
    theme: 'outdoor',
    alt: 'Couple in a warm embrace under a blue sky, she in a lilac saree',
    requiresConsent: true,
  },
  // Delivered 2026-10-24 in place of family.jpg (below).
  'family-photo.jpg': {
    category: 'family',
    theme: 'studio',
    alt: 'Three-generation family portrait on a peach backdrop: grandparents, parents, a smiling little girl on a wooden stump and a baby on his grandfather’s lap',
    requiresConsent: true,
  },
  // DSC00006 from the original batch (was in _review), copied here 2026-10-26: the owner's
  // daughter, a shop showpiece (owner, 2026-10-24). DSC00008 stays out (logo badge).
  'floral-arch-portrait.jpg': {
    category: 'portrait',
    theme: 'floral-arch',
    alt: 'Young woman in a pink saree and green blouse holding pink roses before a floral stone arch',
    requiresConsent: true,
  },
};

// Delivered but not published, with the reason.
const SKIPPED = {
  'family.jpg':
    'Carries another studio\'s branding ("Krishna Kids Photography" logo and phone numbers); not usable as Aakar\'s work.',
};

/** Same measure as analyze.mjs: Laplacian variance of the sharpest tile of a 4x4 grid. */
async function peakSharpness(file) {
  const { data, info } = await sharp(file)
    .rotate()
    .resize(2400, 2400, { fit: 'inside' })
    .greyscale()
    .convolve(LAPLACIAN)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const tw = Math.floor(info.width / 4);
  const th = Math.floor(info.height / 4);
  let best = 0;
  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 4; tx++) {
      let sum = 0;
      let sq = 0;
      for (let y = ty * th; y < (ty + 1) * th; y++) {
        for (let x = tx * tw; x < (tx + 1) * tw; x++) {
          const v = data[y * info.width + x];
          sum += v;
          sq += v * v;
        }
      }
      const n = tw * th;
      best = Math.max(best, sq / n - (sum / n) ** 2);
    }
  }
  return best;
}

const tier = (longEdge, peak) =>
  longEdge >= HERO_EDGE && peak >= SHARP_ENOUGH
    ? 'hero'
    : longEdge >= FULLBLEED_EDGE
      ? 'fullbleed'
      : longEdge >= GRID_EDGE
        ? 'grid'
        : 'small';

const posix = (p) => p.split(path.sep).join('/');
const pad = (n) => String(n).padStart(2, '0');

const manifest = await readJson(MANIFEST_PATH);
const byOriginal = new Map(manifest.map((e) => [e.originalFile, e]));
const files = (await fs.readdir(NEW_DIR)).sort((a, b) =>
  a.localeCompare(b, 'en', { numeric: true }),
);

const added = [];
const taken = new Set(manifest.map((e) => e.id));
for (const file of files) {
  if (SKIPPED[file]) {
    log(`skip  ${file}: ${SKIPPED[file]}`);
    continue;
  }
  const info = PHOTOS[file];
  if (!info) {
    log(`skip  ${file}: no entry in PHOTOS (add its category, theme and alt text first)`);
    continue;
  }
  const existing = byOriginal.get(file);
  // Keep an existing id and number; otherwise take the next free number for category + theme.
  let id = existing?.id;
  if (!id) {
    const prefix = `${info.category}-${info.theme}-`;
    let n = 1;
    while (taken.has(`${prefix}${pad(n)}`)) n++;
    id = `${prefix}${pad(n)}`;
  }
  taken.add(id); // reserve it, so a dry run numbers the same way as a real run
  const rel = `${info.category}/${id}.webp`;
  const out = path.join(PHOTOS_DIR, rel);
  const src = path.join(NEW_DIR, file);

  const meta = await sharp(src).metadata();
  const swap = (meta.orientation ?? 1) >= 5;
  const w = swap ? meta.height : meta.width;
  const h = swap ? meta.width : meta.height;
  const ratio = w / h;
  const peak = await peakSharpness(src);

  const exists = await fs.stat(out).then(
    () => true,
    () => false,
  );
  if (DRY_RUN) {
    log(
      `would ${exists && !FORCE ? 'keep' : 'write'} ${rel} (${w}x${h}, peak sharpness ${peak.toFixed(0)})`,
    );
    continue;
  }
  if (!exists || FORCE) {
    await fs.mkdir(path.dirname(out), { recursive: true });
    await sharp(src)
      .rotate()
      .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
      .toColourspace('srgb')
      .webp(WEBP_PHOTO)
      .toFile(out);
    log(`wrote ${rel}`);
  } else {
    log(`kept  ${rel} (exists; --force to re-encode)`);
  }
  const outMeta = await sharp(out).metadata();
  if (outMeta.exif || outMeta.xmp || outMeta.iptc || outMeta.icc)
    throw new Error(`metadata left in ${rel}`);
  if (outMeta.space !== 'srgb') throw new Error(`${rel} is ${outMeta.space}, expected srgb`);

  if (existing) continue; // already in the manifest: never touch it
  added.push({
    id,
    src: posix(path.relative(ROOT, out)),
    alt: info.alt,
    category: info.category,
    orientation: Math.abs(ratio - 1) < 0.02 ? 'square' : ratio > 1 ? 'landscape' : 'portrait',
    width: outMeta.width,
    height: outMeta.height,
    source: 'studio',
    theme: info.theme,
    kind: 'photo',
    album: null,
    albumOrder: null,
    qualityTier: tier(Math.max(w, h), peak),
    featured: false,
    // Owner must confirm consent before launch (spec 6).
    consent: null,
    requiresConsent: info.requiresConsent,
    originalFile: file,
  });
}

if (added.length > 0) {
  const next = [...manifest, ...added].sort((a, b) =>
    a.src.localeCompare(b.src, 'en', { numeric: true }),
  );
  await writeOut(MANIFEST_PATH, JSON.stringify(next, null, 2) + '\n');
}
log(`added ${added.length} manifest entries: ${added.map((e) => e.id).join(', ') || 'none'}`);
