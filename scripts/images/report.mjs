// Step 6: final report from inventory, duplicates, classification and export logs.
// Usage: node scripts/images/report.mjs [--dry-run]
import path from 'node:path';
import { OUT_DIR, readJson, writeOut, fmtBytes, log } from './lib.mjs';

const inventory = await readJson(path.join(OUT_DIR, 'inventory.json'));
const dup = await readJson(path.join(OUT_DIR, 'duplicates.json'));
const classification = await readJson(path.join(OUT_DIR, 'classification.json'));
const exportLog = await readJson(path.join(OUT_DIR, 'export-log.json'));

const byPath = new Map(classification.map((c) => [c.sourcePath, c]));
const published = exportLog.filter((x) => !x.review);
const review = exportLog.filter((x) => x.review);
const inBytes = inventory.reduce((s, r) => s + r.bytes, 0);
const outBytes = exportLog.reduce((s, x) => s + x.bytes, 0);
const keptSourceBytes = exportLog.reduce((s, x) => s + x.sourceBytes, 0);

const cats = new Map();
for (const x of published) {
  const c = byPath.get(x.sourcePath).category;
  if (!cats.has(c)) cats.set(c, []);
  cats.get(c).push(x);
}
const range = (xs) => {
  const edges = xs.map((x) => Math.max(x.width, x.height));
  return `${Math.min(...edges)}–${Math.max(...edges)}px long edge`;
};

const list = (pred) =>
  exportLog
    .filter((x) => pred(byPath.get(x.sourcePath)))
    .map((x) => `- \`${x.output}\` ← ${path.basename(x.sourcePath)}`)
    .join('\n') || '- none';

const small = exportLog.filter((x) => Math.max(x.width, x.height) < 1000);
const WEBSITE_CATEGORIES = [
  'newborn',
  'baby-kids',
  'maternity',
  'wedding',
  'pre-wedding',
  'family',
  'portrait',
  'events',
  'product',
  'about',
];
const missing = WEBSITE_CATEGORIES.filter((c) => !cats.has(c));
const children = published.filter((x) => byPath.get(x.sourcePath).isChild).length;
const flagged = classification.filter((c) => c.needsReview);

const md = `# Image pipeline — final report

## Totals

| | Files | Size |
|---|---|---|
| Source images | ${inventory.length} | ${fmtBytes(inBytes)} |
| Rejected duplicates (not exported) | ${dup.totals.rejected} | |
| Keepers exported to WebP | ${exportLog.length} | ${fmtBytes(outBytes)} (from ${fmtBytes(keptSourceBytes)} of originals) |
| …published in manifest | ${published.length} | |
| …copied to \`_review/\` only | ${review.length} | |

Overall: ${fmtBytes(inBytes)} → ${fmtBytes(outBytes)} (${((1 - outBytes / inBytes) * 100).toFixed(1)}% smaller).
All outputs: sRGB, no EXIF/GPS/XMP/IPTC/ICC, long edge ≤ 2560px, never upscaled.

## Per category

| Category | Count | Resolution |
|---|---|---|
${[...cats].map(([c, xs]) => `| ${c} | ${xs.length} | ${range(xs)} |`).join('\n')}
| _review | ${review.length} | ${review.length ? range(review) : '–'} |

## Featured candidates

${list((c) => c.featuredCandidate)}

## Hero candidates (landscape, sharp, ≥ 2400px source)

${list((c) => c.heroCandidate)}

## Below 1000px long edge (small grid slots only)

${small.length ? small.map((x) => `- \`${x.output}\``).join('\n') : '- none: every export is at least ' + Math.min(...exportLog.map((x) => Math.max(x.width, x.height))) + 'px on the long edge'}

## In \`_review\` / flagged

${flagged.map((c) => `- ${path.basename(c.sourcePath)} (${c.category}): ${c.notes}`).join('\n')}

## Missing categories — ask the owner for photos

${missing.map((c) => `- ${c}${c === 'wedding' ? ' (only designed album pages exist, no standalone wedding photos)' : ''}`).join('\n')}

Also useful: retouched exports of DSC00008, DSC01597 and DSC01615 without the logo badge
(the clean files we have are unedited camera originals), and a cover for the beach album.

## ⚠ Consent before launch

${children} of ${published.length} published images show children. \`consent\` is \`null\` on every manifest
entry. The owner must confirm **parental consent for every child photo**, and consent from the
wedding couple (their names and date appear on the album cover), before the site goes live.
`;

await writeOut(path.join(OUT_DIR, 'FINAL-REPORT.md'), md);
log('report ready');
