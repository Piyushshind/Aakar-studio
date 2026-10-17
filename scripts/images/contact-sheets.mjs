// Step 3 helper: JPG contact sheets of every source image for visual classification.
// Usage: node scripts/images/contact-sheets.mjs [--dry-run] [--keepers-only]
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { SOURCE_DIR, OUT_DIR, DRY_RUN, args, readJson, log } from './lib.mjs';

sharp.cache(false);

const PER_SHEET = 20;
const COLS = 5;
const THUMB = 300;
const LABEL_H = 44;
const GAP = 12;
const SHEETS_DIR = path.join(OUT_DIR, 'contact-sheets');

const inventory = (await readJson(path.join(OUT_DIR, 'inventory.json'))).filter((r) => !r.error);
let items = inventory;
if (args.has('--keepers-only')) {
  const { keepers } = await readJson(path.join(OUT_DIR, 'duplicates.json'));
  const set = new Set(keepers);
  items = inventory.filter((r) => set.has(r.fileName));
}
// The index is the position in inventory.json (1-based), stable across runs.
const indexed = items.map((r) => ({ ...r, index: inventory.indexOf(r) + 1 }));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const short = (s, n = 34) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

// --corners: show the top-left and top-right 14% corners side by side, to spot logo badges.
const CORNERS = args.has('--corners');
const CORNER = 0.14;

async function cornerPair(file) {
  const rotated = await sharp(file).rotate().toBuffer({ resolveWithObject: true });
  const { width, height } = rotated.info;
  const size = Math.round(Math.min(width, height) * CORNER);
  const crop = (left) =>
    sharp(rotated.data)
      .extract({ left, top: 0, width: size, height: size })
      .resize(THUMB / 2 - 2, THUMB / 2 - 2)
      .toBuffer();
  const [tl, tr] = await Promise.all([crop(0), crop(width - size)]);
  return sharp({ create: { width: THUMB, height: THUMB, channels: 3, background: '#e8e8e8' } })
    .composite([
      { input: tl, left: 0, top: THUMB / 4 },
      { input: tr, left: THUMB / 2 + 2, top: THUMB / 4 },
    ])
    .png()
    .toBuffer();
}

async function tile(r) {
  const file = path.join(SOURCE_DIR, r.relPath);
  const img = CORNERS
    ? await cornerPair(file)
    : await sharp(file).rotate().resize(THUMB, THUMB, { fit: 'contain', background: '#e8e8e8' }).toBuffer();
  const label = Buffer.from(
    `<svg width="${THUMB}" height="${LABEL_H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#fff"/>
      <text x="4" y="17" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#c00">#${r.index}</text>
      <text x="44" y="17" font-family="Arial, sans-serif" font-size="12" fill="#333">${r.width}×${r.height}</text>
      <text x="4" y="36" font-family="Arial, sans-serif" font-size="12" fill="#000">${esc(short(r.fileName))}</text>
    </svg>`,
  );
  return { img, label };
}

if (!DRY_RUN) await fs.mkdir(SHEETS_DIR, { recursive: true });
const sheets = Math.ceil(indexed.length / PER_SHEET);
for (let s = 0; s < sheets; s++) {
  const batch = indexed.slice(s * PER_SHEET, (s + 1) * PER_SHEET);
  const rows = Math.ceil(batch.length / COLS);
  const W = COLS * (THUMB + GAP) + GAP;
  const H = rows * (THUMB + LABEL_H + GAP) + GAP;
  const composites = [];
  for (const [i, r] of batch.entries()) {
    const { img, label } = await tile(r);
    const left = GAP + (i % COLS) * (THUMB + GAP);
    const top = GAP + Math.floor(i / COLS) * (THUMB + LABEL_H + GAP);
    composites.push({ input: img, left, top }, { input: label, left, top: top + THUMB });
  }
  const prefix = CORNERS ? 'corners' : args.has('--keepers-only') ? 'keepers' : 'sheet';
  const file = path.join(SHEETS_DIR, `${prefix}-${String(s + 1).padStart(2, '0')}.jpg`);
  if (DRY_RUN) {
    log(`would write ${path.basename(file)} with ${batch.length} thumbnails`);
    continue;
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: '#bdbdbd' } })
    .composite(composites)
    .jpeg({ quality: 85 })
    .toFile(file);
  log(`wrote ${path.basename(file)} (${batch.length} thumbnails)`);
}
