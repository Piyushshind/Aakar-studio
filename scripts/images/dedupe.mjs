// Step 2: group near-duplicates and pick one keeper per shot. Never deletes anything.
// Usage: node scripts/images/dedupe.mjs [--dry-run]
//
// Visual findings (watermarks, forced keepers/variants) live in dedupe-overrides.json
// next to this script, so re-running stays deterministic.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OUT_DIR, readJson, writeOut, hamming, log } from './lib.mjs';

const HASH_THRESHOLD = 6;
// Same shot, but treat as a separate edit when the crop or exposure differs this much.
const VARIANT_CROP = 0.03;
const VARIANT_BRIGHTNESS = 4;

const overridesPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dedupe-overrides.json');
const overrides = await readJson(overridesPath).catch(() => ({}));
const watermarked = new Set(overrides.watermarked ?? []);
const forceKeeper = new Set(overrides.forceKeeper ?? []);
const forceDuplicate = new Set(overrides.forceDuplicateOfKeeper ?? []);
const forceVariant = new Set(overrides.forceVariant ?? []);

const inventory = (await readJson(path.join(OUT_DIR, 'inventory.json'))).filter((r) => !r.error);

/** "DSC01756 copy - Copy (2) copy 2 - Copy copy.jpg" -> "dsc01756" */
export function baseName(fileName) {
  let s = fileName.replace(/(\.[a-z]+)+$/i, '');
  let prev;
  do {
    prev = s;
    s = s.replace(/\s*-?\s*copy(\s*\(\d+\)|\s+\d+)?\s*$/i, '').replace(/\s*\(\d+\)\s*$/, '');
  } while (s !== prev);
  return s.trim().toLowerCase();
}

// Union-find over hash distance and shared base name.
const parent = inventory.map((_, i) => i);
const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
const union = (a, b) => (parent[find(a)] = find(b));
for (let i = 0; i < inventory.length; i++) {
  for (let j = i + 1; j < inventory.length; j++) {
    const a = inventory[i];
    const b = inventory[j];
    if (baseName(a.fileName) === baseName(b.fileName) || hamming(a.dHash, b.dHash) <= HASH_THRESHOLD) {
      union(i, j);
    }
  }
}

const clusters = new Map();
inventory.forEach((r, i) => {
  const k = find(i);
  if (!clusters.has(k)) clusters.set(k, []);
  clusters.get(k).push(r);
});

const rank = (r) => [
  forceKeeper.has(r.fileName) ? 0 : 1,
  watermarked.has(r.fileName) ? 1 : 0,
  -(r.width * r.height),
  -r.sharpness,
];
const byRank = (a, b) => {
  const ra = rank(a);
  const rb = rank(b);
  for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i];
  return a.fileName.localeCompare(b.fileName);
};

function isVariant(keeper, r) {
  if (forceDuplicate.has(r.fileName)) return false;
  if (forceVariant.has(r.fileName)) return true;
  const crop = Math.max(Math.abs(1 - r.width / keeper.width), Math.abs(1 - r.height / keeper.height));
  return crop > VARIANT_CROP || Math.abs(r.meanBrightness - keeper.meanBrightness) > VARIANT_BRIGHTNESS;
}

const groups = [];
for (const members of clusters.values()) {
  if (members.length < 2) continue;
  // A hash cluster can hold several frames of the same set; split it into shots.
  const shots = new Map();
  for (const r of members) {
    const key = `${baseName(r.fileName)}|${r.captureDate ?? ''}`;
    if (!shots.has(key)) shots.set(key, []);
    shots.get(key).push(r);
  }
  for (const shot of shots.values()) {
    const sorted = [...shot].sort(byRank);
    const keeper = sorted[0];
    const variants = [];
    const rejected = [];
    for (const r of sorted.slice(1)) {
      // Variants are compared against the keeper and any variant kept so far.
      const kept = [keeper, ...variants];
      if (kept.every((k) => isVariant(k, r))) variants.push(r);
      else rejected.push(r);
    }
    groups.push({
      id: `g${String(groups.length + 1).padStart(2, '0')}`,
      kind: shot.length > 1 ? 'same-shot' : 'similar-frame',
      clusterSize: members.length,
      shotsInCluster: shots.size,
      keeper: keeper.fileName,
      variants: variants.map((r) => r.fileName),
      rejected: rejected.map((r) => ({
        file: r.fileName,
        reason: watermarked.has(r.fileName)
          ? 'watermark/logo badge'
          : r.dHash === keeper.dHash && r.width === keeper.width
            ? 'identical copy'
            : 'lower resolution or sharpness',
      })),
      members: shot.map((r) => ({
        file: r.fileName,
        size: `${r.width}x${r.height}`,
        sharpness: r.sharpness,
        brightness: r.meanBrightness,
        dHash: r.dHash,
        icc: r.iccProfile ?? r.space,
        watermarked: watermarked.has(r.fileName),
        hammingToKeeper: hamming(r.dHash, keeper.dHash),
      })),
    });
  }
}
// Only report multi-file shots, plus single frames that share a cluster (for awareness).
const reported = groups.filter((g) => g.members.length > 1 || g.shotsInCluster > 1);

const rejectedSet = new Set(reported.flatMap((g) => g.rejected.map((r) => r.file)));
const keepers = inventory.map((r) => r.fileName).filter((f) => !rejectedSet.has(f));

const result = {
  generatedFrom: 'inventory.json',
  hashThreshold: HASH_THRESHOLD,
  totals: {
    files: inventory.length,
    keepers: keepers.length,
    rejected: rejectedSet.size,
    multiFileShots: reported.filter((g) => g.members.length > 1).length,
  },
  keepers,
  groups: reported,
};

const md = `# Duplicate report

- Files analysed: ${inventory.length}
- Keepers (incl. variants and singletons): **${keepers.length}**
- Rejected duplicates: **${rejectedSet.size}**
- dHash threshold: ≤ ${HASH_THRESHOLD}; also grouped by normalised base name
- Watermarked (from visual review): ${[...watermarked].join(', ') || 'none recorded'}

${reported
  .map(
    (g) => `## ${g.id} · ${g.kind}${g.shotsInCluster > 1 ? ` (cluster of ${g.clusterSize} files over ${g.shotsInCluster} frames)` : ''}

- **Keeper:** ${g.keeper}
${g.variants.map((v) => `- Variant (kept): ${v}`).join('\n')}
${g.rejected.map((r) => `- Rejected: ${r.file} — ${r.reason}`).join('\n')}

| File | Size | Sharp | Bright | ICC | WM | Δhash |
|---|---|---|---|---|---|---|
${g.members.map((m) => `| ${m.file} | ${m.size} | ${m.sharpness} | ${m.brightness} | ${m.icc} | ${m.watermarked ? 'yes' : ''} | ${m.hammingToKeeper} |`).join('\n')}
`,
  )
  .join('\n')}`;

await writeOut(path.join(OUT_DIR, 'duplicates.json'), JSON.stringify(result, null, 2));
await writeOut(path.join(OUT_DIR, 'duplicates-report.md'), md.replace(/\n{3,}/g, '\n\n'));
log(`groups reported: ${reported.length}, keepers: ${keepers.length}, rejected: ${rejectedSet.size}`);
