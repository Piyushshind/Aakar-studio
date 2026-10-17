// Shared helpers for the image pipeline scripts.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(here, '../..');
export const SOURCE_DIR = path.join(ROOT, 'src/haveToProcessImages/drive-download-20261017T160525Z-1-001');
export const OUT_DIR = path.join(here, 'out');
export const PHOTOS_DIR = path.join(ROOT, 'src/assets/photos');
export const MANIFEST_PATH = path.join(ROOT, 'src/data/photos.manifest.json');

export const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.heic']);

export const args = new Set(process.argv.slice(2));
export const DRY_RUN = args.has('--dry-run');

export function log(...m) {
  console.log(DRY_RUN ? '[dry-run]' : '', ...m);
}

/** Recursively list image files under SOURCE_DIR, as posix paths relative to it. */
export async function listSourceImages(dir = SOURCE_DIR, base = SOURCE_DIR) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listSourceImages(full, base)));
    else if (IMAGE_EXT.has(path.extname(e.name).toLowerCase())) {
      out.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return out.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}

export async function readJson(p) {
  return JSON.parse(await fs.readFile(p, 'utf8'));
}

/** Write a file unless --dry-run. Creates parent folders. */
export async function writeOut(p, data) {
  if (DRY_RUN) {
    log('would write', path.relative(ROOT, p));
    return;
  }
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, data);
  log('wrote', path.relative(ROOT, p));
}

export const fmtBytes = (n) =>
  n >= 1048576 ? `${(n / 1048576).toFixed(2)} MB` : `${(n / 1024).toFixed(1)} KB`;

export function hamming(hexA, hexB) {
  let x = BigInt('0x' + hexA) ^ BigInt('0x' + hexB);
  let d = 0;
  while (x) {
    d += Number(x & 1n);
    x >>= 1n;
  }
  return d;
}

/**
 * Minimal EXIF (TIFF) reader: returns orientation, make, model, capture date and
 * whether a GPS IFD exists. Avoids adding a dependency just for four tags.
 */
export function parseExif(buf) {
  if (!buf || buf.length < 14) return {};
  let off = buf.toString('latin1', 0, 6) === 'Exif\0\0' ? 6 : 0;
  const le = buf.toString('latin1', off, off + 2) === 'II';
  const u16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
  const u32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
  const tiff = off;
  const out = {};

  const str = (count, valOff) => {
    const start = count <= 4 ? valOff : tiff + u32(valOff);
    if (start + count > buf.length) return null;
    return buf.toString('latin1', start, start + count).replace(/\0+$/, '').trim() || null;
  };

  const readIfd = (ifdOff, handler) => {
    const at = tiff + ifdOff;
    if (at + 2 > buf.length) return;
    const n = u16(at);
    for (let i = 0; i < n; i++) {
      const e = at + 2 + i * 12;
      if (e + 12 > buf.length) return;
      handler(u16(e), u16(e + 2), u32(e + 4), e + 8);
    }
  };

  try {
    readIfd(u32(tiff + 4), (tag, type, count, valOff) => {
      if (tag === 0x0112) out.orientation = u16(valOff);
      else if (tag === 0x010f) out.make = str(count, valOff);
      else if (tag === 0x0110) out.model = str(count, valOff);
      else if (tag === 0x0132) out.dateTime ??= str(count, valOff);
      else if (tag === 0x8825) out.hasGps = u32(valOff) > 0;
      else if (tag === 0x8769) {
        readIfd(u32(valOff), (t, _ty, c, v) => {
          if (t === 0x9003) out.dateTimeOriginal = str(c, v);
        });
      }
    });
  } catch {
    out.parseError = true;
  }
  return out;
}
