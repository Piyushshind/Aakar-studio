// Steps 4 + 5: export keepers to WebP and write the website manifest.
// Usage: node scripts/images/export.mjs [--dry-run] [--force]
//   --force  re-encode even when the output file already exists
//
// Only orientation fix, sRGB conversion (colour-managed from the embedded profile),
// downscale and encoding. sharp strips EXIF/GPS/XMP/IPTC/ICC by default; we never call
// withMetadata/keepIccProfile.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {
  ROOT,
  SOURCE_DIR,
  OUT_DIR,
  PHOTOS_DIR,
  MANIFEST_PATH,
  DRY_RUN,
  args,
  readJson,
  writeOut,
  fmtBytes,
  log,
} from './lib.mjs';

sharp.cache(false);
sharp.concurrency(2);

const FORCE = args.has('--force');
const MAX_EDGE = 2560;
// Album spreads are ~3:1 with fine text; a 2560px cap leaves them only ~850px tall.
const MAX_EDGE_ALBUM = 3840;
const WEBP_PHOTO = { quality: 88, effort: 6, smartSubsample: true };
const WEBP_ALBUM = { quality: 92, effort: 6 };
const PARALLEL = 3;

// Items explicitly approved out of _review in Step 3 (source file names).
const APPROVED_FROM_REVIEW = new Set([]);

// Uniform-colour borders to trim, per source file and side. Only lines that match the
// outermost line's flat colour are removed; designed margins (texture, other colours) stay.
const EDGE_TRIM = {
  '35.jpg.jpeg': ['right'], // flat #CCCCCC strip left over from the album canvas
};

// Extra high-resolution master for the zoom section: "<id>-xl.webp".
const XL = {
  'DSC01614.JPG': { maxEdge: 4000, webp: { quality: 90, effort: 6, smartSubsample: true } },
};

const isAlbumKind = (e) => e.kind === 'album-page' || e.kind === 'album-cover';
const requiresConsent = (e) => e.isChild || e.album === 'wedding-01';

/**
 * Find a crop box that removes flat single-colour bands from the given sides.
 * A line counts as part of the band when every channel varies by ≤ TOL along it and its
 * mean is within TOL of the outermost line. Never trims more than MAX_TRIM of a side.
 */
async function uniformEdgeTrim(file, sides) {
  const TOL = 3;
  const MAX_TRIM = 0.2;
  const { data, info } = await sharp(file)
    .rotate()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const line = (vertical, idx) => {
    const n = vertical ? h : w;
    const min = [255, 255, 255];
    const max = [0, 0, 0];
    const sum = [0, 0, 0];
    for (let t = 0; t < n; t++) {
      const i = vertical ? (t * w + idx) * c : (idx * w + t) * c;
      for (let k = 0; k < 3; k++) {
        const v = data[i + k];
        if (v < min[k]) min[k] = v;
        if (v > max[k]) max[k] = v;
        sum[k] += v;
      }
    }
    return { flat: max.every((v, k) => v - min[k] <= TOL), mean: sum.map((s) => s / n) };
  };
  const cut = { left: 0, right: 0, top: 0, bottom: 0 };
  for (const side of sides) {
    const vertical = side === 'left' || side === 'right';
    const size = vertical ? w : h;
    const at = (k) => (side === 'right' || side === 'bottom' ? size - 1 - k : k);
    const edge = line(vertical, at(0));
    if (!edge.flat) continue;
    let k = 0;
    while (k < size * MAX_TRIM) {
      const l = line(vertical, at(k));
      if (!l.flat || l.mean.some((v, j) => Math.abs(v - edge.mean[j]) > TOL)) break;
      k++;
    }
    cut[side] = k;
  }
  return {
    box: {
      left: cut.left,
      top: cut.top,
      width: w - cut.left - cut.right,
      height: h - cut.top - cut.bottom,
    },
    cut,
  };
}

const classification = await readJson(path.join(OUT_DIR, 'classification.json'));
const { keepers } = await readJson(path.join(OUT_DIR, 'duplicates.json'));
const keeperSet = new Set(keepers);
const inventory = new Map(
  (await readJson(path.join(OUT_DIR, 'inventory.json'))).map((r) => [r.relPath, r]),
);

const pad = (n) => String(n).padStart(2, '0');
const posix = (p) => p.split(path.sep).join('/');

// Stable ordering inside each category/theme: capture date, then file name.
const sortKey = (e) => `${inventory.get(e.sourcePath)?.captureDate ?? ''}|${e.sourcePath}`;
const ordered = classification
  .filter((e) => keeperSet.has(path.basename(e.sourcePath)))
  .sort((a, b) => sortKey(a).localeCompare(sortKey(b), 'en', { numeric: true }));

const counters = new Map();
const plan = ordered.map((e) => {
  const isReview =
    e.category === '_review' && !APPROVED_FROM_REVIEW.has(path.basename(e.sourcePath));
  let rel;
  if (e.album) {
    rel = `albums/${e.album}/${e.album}-${pad(e.albumOrder)}.webp`;
  } else {
    const category = isReview ? '_review' : e.category;
    const key = `${category}|${e.theme}`;
    counters.set(key, (counters.get(key) ?? 0) + 1);
    rel = `${category}/${category}-${e.theme}-${pad(counters.get(key))}.webp`;
  }
  const xl = XL[path.basename(e.sourcePath)];
  return {
    entry: e,
    isReview,
    rel,
    out: path.join(PHOTOS_DIR, rel),
    xl: xl && { ...xl, rel: rel.replace(/\.webp$/, '-xl.webp') },
  };
});

const dupes = plan.map((p) => p.rel).filter((r, i, all) => all.indexOf(r) !== i);
if (dupes.length) throw new Error(`output name collision: ${dupes.join(', ')}`);

/** Encode one output file. Returns its dimensions and size. */
async function encode(src, out, rel, { maxEdge, webp, trimBox }) {
  const exists = await fs.stat(out).then(
    () => true,
    () => false,
  );
  if (DRY_RUN) {
    log(
      `would ${exists && !FORCE ? 'keep' : 'write'} ${rel} (≤${maxEdge}px)${trimBox ? ' trimmed' : ''}`,
    );
    return null;
  }
  if (!exists || FORCE) {
    await fs.mkdir(path.dirname(out), { recursive: true });
    let img = sharp(src).rotate();
    if (trimBox) img = img.extract(trimBox);
    await img
      .resize(maxEdge, maxEdge, { fit: 'inside', withoutEnlargement: true })
      .toColourspace('srgb')
      .webp(webp)
      .toFile(out);
    log(`wrote ${rel}`);
  } else {
    log(`kept  ${rel} (exists; --force to re-encode)`);
  }
  const meta = await sharp(out).metadata();
  if (meta.exif || meta.xmp || meta.iptc || meta.icc) throw new Error(`metadata left in ${rel}`);
  if (meta.space !== 'srgb') throw new Error(`${rel} is ${meta.space}, expected srgb`);
  const { size } = await fs.stat(out);
  return { width: meta.width, height: meta.height, bytes: size };
}

async function exportOne(p) {
  const src = path.join(SOURCE_DIR, p.entry.sourcePath);
  const sides = EDGE_TRIM[path.basename(p.entry.sourcePath)];
  let trimBox = null;
  if (sides) {
    const { box, cut } = await uniformEdgeTrim(src, sides);
    trimBox = box;
    log(`trim ${path.basename(p.entry.sourcePath)}: ${JSON.stringify(cut)} px`);
  }
  const album = isAlbumKind(p.entry);
  const main = await encode(src, p.out, p.rel, {
    maxEdge: album ? MAX_EDGE_ALBUM : MAX_EDGE,
    webp: album ? WEBP_ALBUM : WEBP_PHOTO,
    trimBox,
  });
  if (p.xl) {
    const xl = await encode(src, path.join(PHOTOS_DIR, p.xl.rel), p.xl.rel, { ...p.xl, trimBox });
    if (main) main.xl = xl;
  }
  return main;
}

const results = new Array(plan.length);
for (let i = 0; i < plan.length; i += PARALLEL) {
  const batch = plan.slice(i, i + PARALLEL);
  const out = await Promise.all(batch.map(exportOne));
  out.forEach((r, j) => (results[i + j] = r));
}

const manifest = plan
  .map((p, i) => ({ p, r: results[i] }))
  .filter(({ p }) => !p.isReview)
  .map(({ p, r }) => {
    const e = p.entry;
    const id = path.basename(p.rel, '.webp');
    return {
      id,
      src: posix(path.relative(ROOT, p.out)),
      alt: e.alt,
      category: e.category,
      orientation: e.orientation,
      width: r?.width ?? null,
      height: r?.height ?? null,
      source: 'studio',
      theme: e.theme,
      kind: e.kind,
      album: e.album,
      albumOrder: e.albumOrder,
      qualityTier: e.qualityTier,
      featured: e.featuredCandidate,
      // Owner must confirm consent (parental consent for every child) before launch.
      consent: null,
      requiresConsent: requiresConsent(e),
      originalFile: path.basename(e.sourcePath),
      ...(p.xl && { xlSrc: posix(path.relative(ROOT, path.join(PHOTOS_DIR, p.xl.rel))) }),
    };
  })
  .sort((a, b) => a.src.localeCompare(b.src, 'en', { numeric: true }));

await writeOut(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

// Export log consumed by report.mjs.
const exportLog = plan.map((p, i) => ({
  sourcePath: p.entry.sourcePath,
  output: posix(path.relative(ROOT, p.out)),
  review: p.isReview,
  sourceBytes: inventory.get(p.entry.sourcePath)?.bytes ?? null,
  sourceSize: `${inventory.get(p.entry.sourcePath)?.width}x${inventory.get(p.entry.sourcePath)?.height}`,
  ...results[i],
}));
await writeOut(path.join(OUT_DIR, 'export-log.json'), JSON.stringify(exportLog, null, 2));

if (!DRY_RUN) {
  const total = exportLog.reduce((s, x) => s + (x.bytes ?? 0), 0);
  log(
    `exported ${plan.length} files (${plan.filter((p) => p.isReview).length} to _review), ${fmtBytes(total)}; manifest has ${manifest.length} entries`,
  );
}
