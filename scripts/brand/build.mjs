// Brand assets (spec 4.6): logo SVGs, PNG exports, favicons, web manifest, OG image and the
// generated art module for <Logo>. Re-runnable: `pnpm brand:build`.
//
// The logo is hand-built vector art, redrawn from src/assets/brand/reference-banner.jpg (never
// traced or embedded). All geometry below is in banner pixels, so an overlay on the reference
// lines up 1:1. Text is outlined from Fraunces and Manrope by outline_text.py (Python), cached in
// outlines.json and only re-run when a text run changes.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { optimize } from 'svgo';
import { studio } from '../../src/data/studio.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BRAND = path.join(ROOT, 'src/assets/brand');
const PNG_DIR = path.join(BRAND, 'png');
const FAVICON = path.join(ROOT, 'public/favicon');
const OUTLINES = path.join(ROOT, 'scripts/brand/outlines.json');
const ART_MODULE = path.join(ROOT, 'src/components/ui/logoArt.ts');

// ---------------------------------------------------------------------------------------------
// Colours: read from the @theme tokens (spec 4.2), so they live in one place.
const css = fs.readFileSync(path.join(ROOT, 'src/styles/index.css'), 'utf8');
const token = (name) => {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --color-${name} not found in index.css`);
  return m[1].toLowerCase();
};
const C = {
  goldLight: token('gold-light'),
  gold: token('gold'),
  goldDeep: token('gold-deep'),
  brown: token('brown'),
  cream: token('text'),
  bg: token('bg'),
  muted: token('muted'),
};
const INK = { dark: C.brown, light: C.cream }; // dark = for cream/white backgrounds

// ---------------------------------------------------------------------------------------------
// Text runs (sizes measured on the banner, in banner pixels).
const TAGLINE = 'CAPTURING EMOTIONS, CREATING MEMORIES';
const range = (text, word) => [text.indexOf(word), text.indexOf(word) + word.length];
const RUNS = [
  {
    id: 'wordmark',
    font: 'fraunces',
    axes: { opsz: 144, wght: 500, SOFT: 0, WONK: 0 },
    text: 'akar',
    size: { xHeight: 51 },
    fitWidth: 172,
    glyphs: true,
  },
  {
    id: 'stackedWord',
    font: 'fraunces',
    axes: { opsz: 144, wght: 500, SOFT: 0, WONK: 0 },
    text: 'Aakar',
    size: { capHeight: 64 },
    tracking: -2,
    groups: [
      [0, 1, 'A'],
      [1, 5, 'akar'],
    ],
  },
  {
    id: 'label',
    font: 'manrope',
    axes: { wght: 560 },
    text: 'DIGITAL PHOTO STUDIO',
    size: { capHeight: 10 },
    fitWidth: 262,
  },
  {
    id: 'tagline',
    font: 'manrope',
    axes: { wght: 640 },
    text: TAGLINE,
    size: { capHeight: 9 },
    fitWidth: 288,
    groups: [
      [0, range(TAGLINE, 'EMOTIONS')[0], 'plain'],
      [...range(TAGLINE, 'EMOTIONS'), 'gold'],
      [range(TAGLINE, 'EMOTIONS')[1], range(TAGLINE, 'MEMORIES')[0], 'plain'],
      [...range(TAGLINE, 'MEMORIES'), 'gold'],
    ],
  },
  {
    id: 'ogLine',
    font: 'manrope',
    axes: { wght: 500 },
    text: `${studio.address.locality} · ${studio.phone}`,
    size: { capHeight: 22 },
    tracking: 4,
  },
];

function loadOutlines() {
  const key = createHash('sha1').update(JSON.stringify(RUNS)).digest('hex');
  if (fs.existsSync(OUTLINES)) {
    const cached = JSON.parse(fs.readFileSync(OUTLINES, 'utf8'));
    if (cached.key === key) return cached.runs;
  }
  console.log('Text runs changed: outlining with scripts/brand/outline_text.py ...');
  const out = execFileSync('python', [path.join(ROOT, 'scripts/brand/outline_text.py')], {
    input: JSON.stringify(RUNS),
    maxBuffer: 64 * 1024 * 1024,
  });
  const runs = Object.fromEntries(JSON.parse(out.toString()).map((r) => [r.id, r]));
  fs.writeFileSync(OUTLINES, `${JSON.stringify({ key, runs }, null, 1)}\n`);
  return runs;
}
const T = loadOutlines();

// ---------------------------------------------------------------------------------------------
// Geometry helpers
const n = (v) => {
  const s = (Math.round(v * 100) / 100).toString();
  return s === '-0' ? '0' : s;
};
const pt = ([x, y]) => `${n(x)},${n(y)}`;

/** Open Catmull-Rom curve through points, as cubic Bezier commands (no leading M). */
function curveThrough(points) {
  let d = '';
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
}

/** Tapered brush stroke along a circle: angles in degrees (SVG y-down), thickness(t) in px. */
function brushArc({ cx, cy, r, from, to, thickness, steps = 24 }) {
  const outer = [];
  const inner = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = ((from + (to - from) * t) * Math.PI) / 180;
    const th = thickness(t);
    outer.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    inner.push([cx + (r - th) * Math.cos(a), cy + (r - th) * Math.sin(a)]);
  }
  inner.reverse();
  return `M${pt(outer[0])}${curveThrough(outer)}L${pt(inner[0])}${curveThrough(inner)}Z`;
}

// ---------------------------------------------------------------------------------------------
// The mark: gold A, camera outline, lens (banner pixels)
const LENS = { cx: 72, cy: 114 };

/** Gold "A": slab apex, thin left hairline (ends under the swash), thick right stroke, foot. */
function aLetter({ thin = 3.6 } = {}) {
  // Thick stroke's left edge and the hairline's inner edge meet at the counter's apex.
  const thickSlope = 35 / 103.4; // dx per dy along the thick stroke's left edge
  const hairSlope = 19.4 / 47.8; // dx per dy (leftwards) along the hairline
  const dy = (84 + thin - 90.4) / (thickSlope + hairSlope);
  const counter = [90.4 + thickSlope * dy, 28.2 + dy];
  return [
    'M84.6,15.4',
    'L106.6,15.4',
    'L152.6,130.4',
    'C154.4,135.8 158.4,139.4 166.4,140.3',
    'L166.4,141.6 L119.2,141.6 L119.2,140.4',
    'C123.2,139.8 125.6,137.2 125.4,131.6',
    `L${pt(counter)}`,
    `L${n(64.6 + thin)},76`,
    'L64.6,76 L84,28.2',
    // Concave bracket from the apex slab into the hairline, tangent to it.
    'C85.6,24.2 84.9,18.4 84.6,15.4Z',
  ].join(' ');
}

/** Gold swash over the lens, tapering from a point at the left into the thick stroke. */
function swash({ extra = 0 } = {}) {
  const outer = [
    [36, 91.5],
    [41, 85.6],
    [48, 80.2],
    [56, 75.9],
    [66, 73.3],
    [76, 72.9],
    [87, 74.1],
    [97, 77],
    [105, 80.6],
    [112, 85.2],
    [118, 92],
  ];
  const inner = [
    [116.4, 101.6],
    [108, 93],
    [99, 86],
    [88, 80.3],
    [75, 77.7],
    [62, 78.1],
    [52, 80.9],
    [44, 85.4],
    [36, 91.5],
  ].map(([x, y], i, all) => {
    // Thicken towards the middle only; both ends keep their shape.
    const t = i / (all.length - 1);
    return [x, y + extra * Math.sin(Math.PI * t)];
  });
  return `M${pt(outer[0])}${curveThrough(outer)}L120,100L${pt(inner[0])}${curveThrough(inner)}Z`;
}

const CAMERA_BODY =
  'M26.6,138.3 L12.6,138.3 Q8,138.3 8,133.7 L8,77.1 Q8,72.5 12.6,72.5 L17.6,72.5' +
  ' L19.3,67.6 Q19.7,66.3 21.1,66.3 L29.3,66.3 Q30.7,66.3 31,67.6 L31.9,72.5' +
  ' L39.2,72.5 L43.5,61.9 Q44.2,60.3 46,60.3 L61.2,60.3 Q64.3,60.3 64.9,63.3';
const CAMERA_BODY_SIMPLE =
  'M26.6,138.3 L12.6,138.3 Q8,138.3 8,133.7 L8,77.1 Q8,72.5 12.6,72.5' +
  ' L39.2,72.5 L43.5,61.9 Q44.2,60.3 46,60.3 L61.2,60.3 Q64.3,60.3 64.9,63.3';
const FLASH = 'M46.8,67.4 L49.4,63.4 L61.2,63.4 L62.8,67.4Z';

const BARREL = brushArc({
  ...LENS,
  r: 42.6,
  from: 216,
  to: 169,
  thickness: (t) => 3.3 * Math.sin(Math.PI * t) ** 0.7 * (1 - 0.6 * t) + 0.15,
});

/**
 * Mark markup. `ink` paints the camera outline (and in text, the wordmark); gold always uses the
 * gradients. `__ID__` prefixes every id so <Logo> can make them unique per instance.
 */
function markMarkup({ ink, simple = false }) {
  const lens = simple
    ? `<g id="__ID__lens" class="lens">
        <circle id="__ID__lens-glass" class="lens-glass" cx="72" cy="114" r="27.2" fill="#171312"/>
        <circle cx="64.5" cy="105.5" r="3.6" fill="#fff" fill-opacity=".85"/>
        <circle id="__ID__lens-rim" class="lens-rim" cx="72" cy="114" r="30.3" fill="none" stroke="url(#__ID__gold)" stroke-width="7"/>
      </g>`
    : `<g id="__ID__lens" class="lens">
        <circle id="__ID__lens-glass" class="lens-glass" cx="72" cy="114" r="30.3" fill="url(#__ID__glass)"/>
        <circle cx="72" cy="114" r="24.6" fill="none" stroke="#6a574b" stroke-opacity=".55" stroke-width="1.1"/>
        <circle cx="72" cy="114" r="15.8" fill="#0c0a09" stroke="#3e332d" stroke-width=".8"/>
        <ellipse cx="63.4" cy="105" rx="6.6" ry="4.4" transform="rotate(-38 63.4 105)" fill="#c46a9e" fill-opacity=".6"/>
        <ellipse cx="80.4" cy="123.6" rx="5.8" ry="3.6" transform="rotate(-38 80.4 123.6)" fill="#55b27a" fill-opacity=".6"/>
        <circle cx="70.4" cy="116.4" r="1.6" fill="#fff" fill-opacity=".9"/>
        <circle id="__ID__lens-rim" class="lens-rim" cx="72" cy="114" r="31.9" fill="none" stroke="url(#__ID__gold)" stroke-width="3.8"/>
      </g>`;
  return `
    <g id="__ID__camera" class="camera">
      <path class="camera-body" d="${simple ? CAMERA_BODY_SIMPLE : CAMERA_BODY}" fill="none" stroke="${ink}" stroke-width="${simple ? 8 : 2.3}" stroke-linecap="round" stroke-linejoin="round"/>
      ${simple ? '' : `<path class="camera-barrel" d="${BARREL}" fill="${ink}"/>`}
      <path class="camera-flash" d="${FLASH}" fill="url(#__ID__gold)"/>
    </g>
    ${lens}
    <g id="__ID__a-letter" class="a-letter" fill="url(#__ID__gold)">
      <path class="a-strokes" d="${aLetter({ thin: simple ? 7 : 3.6 })}"/>
      <path class="a-swash" d="${swash({ extra: simple ? 3 : 0 })}"/>
    </g>`;
}

const DEFS = `
  <defs>
    <linearGradient id="__ID__gold" gradientUnits="userSpaceOnUse" x1="86" y1="14" x2="132" y2="168">
      <stop offset="0" stop-color="${C.goldLight}"/>
      <stop offset=".5" stop-color="${C.gold}"/>
      <stop offset="1" stop-color="${C.goldDeep}"/>
    </linearGradient>
    <linearGradient id="__ID__gold-text" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.goldLight}"/>
      <stop offset=".55" stop-color="${C.gold}"/>
      <stop offset="1" stop-color="${C.goldDeep}"/>
    </linearGradient>
    <radialGradient id="__ID__glass" cx=".4" cy=".38" r=".75">
      <stop offset="0" stop-color="#3b302b"/>
      <stop offset=".6" stop-color="#1b1615"/>
      <stop offset="1" stop-color="#0d0b0a"/>
    </radialGradient>
  </defs>`;

const translate = (x, y) => `transform="translate(${n(x)} ${n(y)})"`;

/** Label with side rules, centred on cx, baseline at y. */
function labelMarkup({ ink, cx, baseline, rule = 17.5, gap = 8 }) {
  const b = T.label.bbox;
  const x = cx - (b[0] + b[2]) / 2;
  const left = x + b[0];
  const right = x + b[2];
  const ry = baseline - 5; // middle of the 10px caps
  return `
    <g id="__ID__rules" class="rules" stroke="${ink}" stroke-width="1.3" stroke-linecap="round">
      <path d="M${n(left - gap - rule)},${n(ry)}H${n(left - gap)}"/>
      <path d="M${n(right + gap)},${n(ry)}H${n(right + gap + rule)}"/>
    </g>
    <g id="__ID__label" class="label" fill="${ink}" ${translate(x, baseline)}><path d="${T.label.d}"/></g>`;
}

function taglineMarkup({ ink, cx, baseline }) {
  const b = T.tagline.bbox;
  const x = cx - (b[0] + b[2]) / 2;
  return `
    <g id="__ID__tagline" class="tagline" ${translate(x, baseline)}>
      <path class="tagline-plain" d="${T.tagline.groups.plain}" fill="${ink}"/>
      <path class="tagline-gold" d="${T.tagline.groups.gold}" fill="url(#__ID__gold-text)"/>
    </g>`;
}

// Horizontal lockup as on the banner: mark, "akar" on the A's baseline, label underneath.
const BASELINE = 140.8;
const WORD_X = 168.5 - T.wordmark.bbox[0];
const TEXT_CX = 171; // label and tagline axis on the banner

function wordmarkMarkup({ ink }) {
  const glyphs = T.wordmark.glyphs
    .map((g, i) => `<path class="wordmark-${g.char}${i}" d="${g.d}"/>`)
    .join('');
  return `<g id="__ID__wordmark" class="wordmark" fill="${ink}" ${translate(WORD_X, BASELINE)}>${glyphs}</g>`;
}

function stackedMarkup({ ink }) {
  const w = T.stackedWord;
  const wordW = w.bbox[2] - w.bbox[0];
  const cx = 86.5; // mark centre
  const wordX = cx - (w.bbox[0] + w.bbox[2]) / 2;
  const wordBaseline = 148 + 18 + 64;
  return {
    body: `
      ${markMarkup({ ink })}
      <g id="__ID__wordmark" class="wordmark" ${translate(wordX, wordBaseline)}>
        <path class="wordmark-A" d="${w.groups.A}" fill="url(#__ID__gold-text)"/>
        <path class="wordmark-akar" d="${w.groups.akar}" fill="${ink}"/>
      </g>
      ${labelMarkup({ ink, cx, baseline: wordBaseline + 32 })}`,
    box: [
      cx - Math.max(wordW, 262 + 2 * 25.5) / 2,
      15,
      Math.max(wordW, 313),
      wordBaseline + 32 - 15,
    ],
  };
}

const PAD = 4;
function box(x0, y0, x1, y1) {
  return [x0 - PAD, y0 - PAD, x1 - x0 + 2 * PAD, y1 - y0 + 2 * PAD];
}

/** Every variant: { body(ink), box: [x, y, w, h] } in banner pixels. */
const VARIANTS = {
  mark: { body: (ink) => markMarkup({ ink }), box: box(6.5, 15, 166.6, 148) },
  'mark-simple': {
    body: (ink) => markMarkup({ ink, simple: true }),
    box: box(3, 15, 166.6, 148.5),
  },
  horizontal: {
    body: (ink) =>
      markMarkup({ ink }) +
      wordmarkMarkup({ ink }) +
      labelMarkup({ ink, cx: TEXT_CX, baseline: 172.3 }),
    box: box(6.5, 15, WORD_X + T.wordmark.bbox[2], 173),
  },
  stacked: {
    body: (ink) => stackedMarkup({ ink }).body,
    box: (() => {
      const [x, y, w, h] = stackedMarkup({ ink: '' }).box;
      return box(x, y, x + w, y + h + 1);
    })(),
  },
  tagline: {
    body: (ink) =>
      markMarkup({ ink }) +
      wordmarkMarkup({ ink }) +
      labelMarkup({ ink, cx: TEXT_CX, baseline: 172.3 }) +
      taglineMarkup({ ink, cx: TEXT_CX, baseline: 200.3 }),
    box: box(
      Math.min(6.5, TEXT_CX - (T.tagline.bbox[2] - T.tagline.bbox[0]) / 2),
      15,
      Math.max(WORD_X + T.wordmark.bbox[2], TEXT_CX + (T.tagline.bbox[2] - T.tagline.bbox[0]) / 2),
      201,
    ),
  },
};

function svgDoc(variant, ink, { title = 'Aakar Digital Photo Studio', idPrefix = '' } = {}) {
  const { body, box: b } = VARIANTS[variant];
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.map(n).join(' ')}" width="${n(b[2])}" height="${n(b[3])}" role="img"><title>${title}</title>${DEFS}${body(ink)}</svg>`;
  return markup.replaceAll('__ID__', idPrefix);
}

const SVGO = {
  multipass: true,
  floatPrecision: 2,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false, // ids are animation hooks (Phase 7 preloader)
          convertShapeToPath: false, // keep the lens rim a <circle> for DrawSVG
          mergePaths: false,
          inlineStyles: false,
          removeUnknownsAndDefaults: { keepRoleAttr: true },
        },
      },
    },
  ],
};
const optimizeSvg = (s) => optimize(s, SVGO).data;

// ---------------------------------------------------------------------------------------------
// Outputs
fs.mkdirSync(PNG_DIR, { recursive: true });
fs.mkdirSync(FAVICON, { recursive: true });

/** Rasterise an SVG string to an exact width (transparent unless `background`). */
async function png(svg, width, { background } = {}) {
  const vbW = Number(svg.match(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+)/)[1]);
  const density = Math.min(72 * (width / vbW) * 1.5, 30000);
  let img = sharp(Buffer.from(svg), { density }).resize({ width });
  if (background) img = img.flatten({ background });
  return img.png({ compressionLevel: 9 }).toBuffer();
}

/** Mark centred on a square tile. `scale` = mark width / tile size. */
async function tile(
  size,
  { variant = 'mark', ink = INK.light, bg = C.bg, scale = 0.72, radius = 0 },
) {
  const svg = optimizeSvg(svgDoc(variant, ink));
  const markW = Math.round(size * scale);
  const mark = await png(svg, markW);
  const meta = await sharp(mark).metadata();
  const base = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius * size}" fill="${bg}"/></svg>`,
  );
  return sharp(base)
    .composite([
      {
        input: mark,
        left: Math.round((size - meta.width) / 2),
        top: Math.round((size - meta.height) / 2 + size * 0.015),
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** ICO with embedded PNGs (supported by every current browser and Windows). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt8(0, e + 2);
    header.writeUInt8(0, e + 3);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

const written = [];
const write = (file, data) => {
  fs.writeFileSync(file, data);
  written.push(path.relative(ROOT, file).replaceAll('\\', '/'));
};

// 1. SVG files. Lockups come in -light (cream ink, for dark backgrounds) and -dark (brown ink).
const FILES = [
  ['logo-mark', 'mark', INK.dark],
  ['logo-mark-light', 'mark', INK.light],
  ['logo-mark-simple', 'mark-simple', INK.dark],
  ['logo-mark-simple-light', 'mark-simple', INK.light],
  ['logo-horizontal-light', 'horizontal', INK.light],
  ['logo-horizontal-dark', 'horizontal', INK.dark],
  ['logo-stacked-light', 'stacked', INK.light],
  ['logo-stacked-dark', 'stacked', INK.dark],
  ['logo-tagline-light', 'tagline', INK.light],
  ['logo-tagline-dark', 'tagline', INK.dark],
];
const svgs = {};
for (const [name, variant, ink] of FILES) {
  svgs[name] = optimizeSvg(svgDoc(variant, ink));
  write(path.join(BRAND, `${name}.svg`), svgs[name]);
}

// 2. PNG exports, transparent, 512/1024/2048 wide.
for (const [name] of FILES) {
  for (const w of [512, 1024, 2048])
    write(path.join(PNG_DIR, `${name}-${w}.png`), await png(svgs[name], w));
}

// 3. Favicons. The SVG favicon adapts its camera colour to the browser's colour scheme.
const faviconSvg = optimizeSvg(
  svgDoc('mark-simple', INK.dark).replace(
    '<defs>',
    `<style>@media (prefers-color-scheme:dark){.camera-body{stroke:${INK.light}}}</style><defs>`,
  ),
);
write(path.join(FAVICON, 'favicon.svg'), faviconSvg);
const favTile = (size) => tile(size, { variant: 'mark-simple', scale: 0.86, radius: 0.2 });
const fav = {};
for (const s of [16, 32, 48]) fav[s] = await favTile(s);
write(path.join(FAVICON, 'favicon-32.png'), fav[32]);
write(
  path.join(FAVICON, 'favicon.ico'),
  ico([16, 32, 48].map((size) => ({ size, data: fav[size] }))),
);
write(path.join(FAVICON, 'apple-touch-icon.png'), await tile(180, { scale: 0.72 }));
write(path.join(FAVICON, 'icon-192.png'), await tile(192, { scale: 0.72 }));
write(path.join(FAVICON, 'icon-512.png'), await tile(512, { scale: 0.72 }));
// Maskable: the mark must stay inside the central 80% circle (safe zone).
write(path.join(FAVICON, 'icon-512-maskable.png'), await tile(512, { scale: 0.56 }));

write(
  path.join(ROOT, 'public/site.webmanifest'),
  `${JSON.stringify(
    {
      name: studio.name,
      short_name: studio.shortName,
      start_url: '/',
      display: 'standalone',
      theme_color: C.bg,
      background_color: C.bg,
      icons: [
        { src: '/favicon/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/favicon/icon-512.png', sizes: '512x512', type: 'image/png' },
        {
          src: '/favicon/icon-512-maskable.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    null,
    2,
  )}\n`,
);

// 4. OG image (1200x630): logo only, no client photos until consent is confirmed.
{
  const W = 1200;
  const H = 630;
  const logo = svgDoc('tagline', INK.light, { idPrefix: 'og-' });
  const [vx, vy, vw, vh] = VARIANTS.tagline.box;
  const scale = 700 / vw;
  const lx = (W - vw * scale) / 2;
  const ly = 92;
  const line = T.ogLine;
  const lineW = line.bbox[2] - line.bbox[0];
  const inner = logo
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '')
    .replace(/<title>.*?<\/title>/, '');
  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <radialGradient id="bg" cx=".5" cy=".42" r=".75">
        <stop offset="0" stop-color="#2a1f16"/>
        <stop offset=".55" stop-color="#181312"/>
        <stop offset="1" stop-color="${C.bg}"/>
      </radialGradient>
      <linearGradient id="hair" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${C.gold}" stop-opacity="0"/>
        <stop offset=".5" stop-color="${C.gold}" stop-opacity=".7"/>
        <stop offset="1" stop-color="${C.gold}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <g transform="translate(${n(lx)} ${n(ly)}) scale(${n(scale)}) translate(${n(-vx)} ${n(-vy)})">${inner}</g>
    <rect x="${(W - 360) / 2}" y="${ly + vh * scale + 34}" width="360" height="1.5" fill="url(#hair)"/>
    <path d="${line.d}" fill="${C.muted}" transform="translate(${n((W - lineW) / 2 - line.bbox[0])} ${n(ly + vh * scale + 100)})"/>
  </svg>`;
  write(
    path.join(ROOT, 'public/og-image.jpg'),
    await sharp(Buffer.from(og)).jpeg({ quality: 88, chromaSubsampling: '4:4:4' }).toBuffer(),
  );
}

// 5. Art module for <Logo>: inline markup with currentColor ink and `__ID__` id placeholders.
{
  const art = {};
  for (const variant of ['mark', 'mark-simple', 'horizontal', 'stacked', 'tagline']) {
    const svg = optimizeSvg(svgDoc(variant, 'currentColor', { idPrefix: '__ID__' }));
    art[variant] = {
      viewBox: svg.match(/viewBox="([^"]+)"/)[1],
      markup: svg
        .replace(/^<svg[^>]*>/, '')
        .replace(/<\/svg>$/, '')
        .replace(/<title>.*?<\/title>/, ''),
    };
  }
  const ts = `// GENERATED by scripts/brand/build.mjs (pnpm brand:build). Do not edit by hand.
// Inline logo art: ink uses currentColor; "__ID__" is replaced with a per-instance id prefix.

export const logoArt = ${JSON.stringify(art, null, 2)} as const;

export type LogoArtName = keyof typeof logoArt;
`;
  write(ART_MODULE, ts);
}

console.log(`Wrote ${written.length} files:\n  ${written.join('\n  ')}`);
