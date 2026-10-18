// Step 1: technical inventory of every source image. Read-only on the source folder.
// Usage: node scripts/images/analyze.mjs [--dry-run]
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {
  SOURCE_DIR,
  OUT_DIR,
  DRY_RUN,
  listSourceImages,
  writeOut,
  fmtBytes,
  parseExif,
  log,
} from './lib.mjs';

sharp.cache(false);

const LAPLACIAN = { width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0], offset: 128 };

/** Variance of the Laplacian on a 1024px greyscale downscale (higher = sharper). */
async function sharpness(file) {
  const { channels } = await sharp(file)
    .rotate()
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .greyscale()
    .convolve(LAPLACIAN)
    .stats();
  return +(channels[0].stdev ** 2).toFixed(1);
}

/**
 * Subject sharpness: Laplacian variance of the sharpest tile in a 4x4 grid at a fixed
 * 2400px long edge. Soft pastel backdrops drag the global score down; this does not.
 */
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
      let sum = 0,
        sq = 0;
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
  return +best.toFixed(1);
}

/** 64-bit difference hash: 9x8 greyscale, compare horizontal neighbours. */
async function dHash(file) {
  const data = await sharp(file)
    .rotate()
    .greyscale()
    .resize(9, 8, { fit: 'fill', kernel: 'lanczos3' })
    .raw()
    .toBuffer();
  let bits = 0n;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      bits = (bits << 1n) | (data[y * 9 + x] < data[y * 9 + x + 1] ? 1n : 0n);
    }
  }
  return bits.toString(16).padStart(16, '0');
}

async function analyze(rel) {
  const file = path.join(SOURCE_DIR, rel);
  const stat = await fs.stat(file);
  const rec = {
    relPath: rel,
    fileName: path.basename(rel),
    ext: path.extname(rel).toLowerCase(),
    bytes: stat.size,
  };
  try {
    const meta = await sharp(file).metadata();
    const exif = parseExif(meta.exif);
    const swap = (meta.orientation ?? 1) >= 5;
    const width = swap ? meta.height : meta.width;
    const height = swap ? meta.width : meta.height;
    const ratio = width / height;
    Object.assign(rec, {
      format: meta.format,
      width,
      height,
      megapixels: +((width * height) / 1e6).toFixed(2),
      aspectRatio: +ratio.toFixed(3),
      orientation: Math.abs(ratio - 1) < 0.02 ? 'square' : ratio > 1 ? 'landscape' : 'portrait',
      exifOrientation: meta.orientation ?? null,
      cameraMake: exif.make ?? null,
      cameraModel: exif.model ?? null,
      captureDate: exif.dateTimeOriginal ?? exif.dateTime ?? null,
      hasGps: !!exif.hasGps,
      hasExif: !!meta.exif,
      hasXmp: !!meta.xmp,
      hasIptc: !!meta.iptc,
      space: meta.space,
      iccProfile: meta.icc ? iccDescription(meta.icc) : null,
      channels: meta.channels,
      hasAlpha: meta.hasAlpha,
      density: meta.density ?? null,
    });
    const [sharp_, peak, stats, hash] = await Promise.all([
      sharpness(file),
      peakSharpness(file),
      sharp(file).greyscale().stats(),
      dHash(file),
    ]);
    rec.sharpness = sharp_;
    rec.peakSharpness = peak;
    rec.meanBrightness = +stats.channels[0].mean.toFixed(1);
    rec.dHash = hash;
    rec.longEdge = Math.max(width, height);
    rec.error = null;
  } catch (err) {
    rec.error = String(err.message ?? err);
  }
  return rec;
}

/** Pull the human-readable description out of an ICC 'desc' tag (v2 or v4 'mluc'). */
function iccDescription(icc) {
  try {
    const count = icc.readUInt32BE(128);
    for (let i = 0; i < count; i++) {
      const t = 132 + i * 12;
      if (icc.toString('latin1', t, t + 4) !== 'desc') continue;
      const off = icc.readUInt32BE(t + 4);
      const type = icc.toString('latin1', off, off + 4);
      if (type === 'desc') {
        const len = icc.readUInt32BE(off + 8);
        return icc.toString('latin1', off + 12, off + 12 + len).replace(/\0+$/, '');
      }
      if (type === 'mluc') {
        const len = icc.readUInt32BE(off + 20);
        const at = icc.readUInt32BE(off + 24);
        // mluc strings are UTF-16BE; swap to LE for Node's decoder.
        return Buffer.from(icc.subarray(off + at, off + at + (len & ~1)))
          .swap16()
          .toString('utf16le');
      }
    }
  } catch {}
  return 'embedded (unnamed)';
}

const files = await listSourceImages();
log(`analysing ${files.length} images in ${SOURCE_DIR}`);
const inventory = [];
for (const [i, rel] of files.entries()) {
  const rec = await analyze(rel);
  inventory.push(rec);
  process.stdout.write(`\r  ${i + 1}/${files.length} ${rel.slice(0, 60).padEnd(60)}`);
}
process.stdout.write('\n');

const ok = inventory.filter((r) => !r.error);
const totalBytes = inventory.reduce((s, r) => s + r.bytes, 0);
const byEdge = [...ok].sort((a, b) => a.longEdge - b.longEdge);
const bySharp = [...ok].sort((a, b) => a.sharpness - b.sharpness);

const row = (r) =>
  `| ${r.fileName} | ${fmtBytes(r.bytes)} | ${r.width}×${r.height} | ${r.megapixels} | ${r.orientation} | ${r.exifOrientation ?? '–'} | ${[r.cameraMake, r.cameraModel].filter(Boolean).join(' ') || '–'} | ${r.captureDate ?? '–'} | ${r.hasGps ? 'yes' : 'no'} | ${r.iccProfile ?? r.space} | ${r.sharpness} | ${r.peakSharpness} | ${r.meanBrightness} | \`${r.dHash}\` |`;

const md = `# Image inventory

Source: \`${path.relative(process.cwd(), SOURCE_DIR).split(path.sep).join('/')}\`

## Totals

- Files: **${inventory.length}** (${ok.length} decoded, ${inventory.length - ok.length} errors)
- Total size: **${fmtBytes(totalBytes)}**
- Resolution range: ${byEdge[0]?.width}×${byEdge[0]?.height} → ${byEdge.at(-1)?.width}×${byEdge.at(-1)?.height} (long edge ${byEdge[0]?.longEdge}–${byEdge.at(-1)?.longEdge}px)
- Orientation: ${['portrait', 'landscape', 'square'].map((o) => `${o} ${ok.filter((r) => r.orientation === o).length}`).join(', ')}
- With EXIF: ${ok.filter((r) => r.hasExif).length}, with GPS: ${ok.filter((r) => r.hasGps).length}, with XMP: ${ok.filter((r) => r.hasXmp).length}, with ICC: ${ok.filter((r) => r.iccProfile).length}
${inventory
  .filter((r) => r.error)
  .map((r) => `- ERROR ${r.fileName}: ${r.error}`)
  .join('\n')}

## Smallest images (long edge)

${byEdge
  .slice(0, 10)
  .map((r) => `- ${r.fileName}: ${r.width}×${r.height}`)
  .join('\n')}

## Blurriest images (Laplacian variance, lower = softer)

${bySharp
  .slice(0, 10)
  .map((r) => `- ${r.fileName}: ${r.sharpness}`)
  .join('\n')}

## All files

| File | Size | W×H | MP | Orient. | EXIF rot | Camera | Captured | GPS | Colour | Sharp | Peak | Bright | dHash |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
${ok.map(row).join('\n')}
`;

await writeOut(path.join(OUT_DIR, 'inventory.json'), JSON.stringify(inventory, null, 2));
await writeOut(path.join(OUT_DIR, 'inventory-report.md'), md);
log(
  `done: ${inventory.length} files, ${fmtBytes(totalBytes)}${DRY_RUN ? ' (nothing written)' : ''}`,
);
