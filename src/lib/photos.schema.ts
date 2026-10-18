// Zod schema for photos.manifest.json plus cross-checks against the curated data.
// Dev only: main.tsx loads this module behind `import.meta.env.DEV`, so zod and the checks
// never reach the production bundle.
import { z } from 'zod';
import { albumInfo, heroPhotoIds } from '@/data/curation';
import manifest from '@/data/photos.manifest.json';
import { services } from '@/data/services';
import { themeLabels } from '@/data/themes';
import type { Photo } from '@/types/content';

const assetPath = z
  .string()
  .regex(
    /^src\/assets\/photos\/(?!_review\/)[\w/-]+\.webp$/,
    'must be a .webp under src/assets/photos/ (not _review)',
  );

export const photoSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  src: assetPath,
  xlSrc: assetPath.optional(),
  alt: z.string().min(10),
  category: z.union([
    z.enum([
      'newborn',
      'baby-kids',
      'maternity',
      'wedding',
      'pre-wedding',
      'family',
      'events',
      'product',
      'about',
    ]),
    z.templateLiteral(['albums/', z.string().regex(/^[a-z0-9-]+$/)]),
  ]),
  orientation: z.enum(['portrait', 'landscape', 'square']),
  width: z.int().positive(),
  height: z.int().positive(),
  source: z.enum(['studio', 'stock']),
  theme: z.string().min(1),
  kind: z.enum(['photo', 'album-cover', 'album-page']),
  album: z.string().nullable(),
  albumOrder: z.int().nonnegative().nullable(),
  qualityTier: z.enum(['hero', 'fullbleed', 'grid', 'small']),
  featured: z.boolean(),
  consent: z.boolean().nullable(),
  requiresConsent: z.boolean(),
  credit: z.string().optional(),
  licenseUrl: z.url().optional(),
  originalFile: z.string().min(1),
});

// Compile-time guard: the schema and the `Photo` type must describe the same shape.
type Schema = z.infer<typeof photoSchema>;
type SameShape = [Schema] extends [Photo] ? ([Photo] extends [Schema] ? true : false) : false;
void (true satisfies SameShape);

function crossCheck(photos: Photo[]): string[] {
  const errors: string[] = [];
  const ids = new Map<string, Photo>();

  for (const p of photos) {
    if (ids.has(p.id)) errors.push(`${p.id}: duplicate id`);
    ids.set(p.id, p);

    if (p.album) {
      if (p.category !== `albums/${p.album}`)
        errors.push(`${p.id}: category should be albums/${p.album}`);
      if (p.kind === 'photo')
        errors.push(`${p.id}: album entries must be album-cover or album-page`);
      if (p.albumOrder === null) errors.push(`${p.id}: album entry without albumOrder`);
    } else {
      if (p.category.startsWith('albums/')) errors.push(`${p.id}: albums/ category without album`);
      if (p.kind !== 'photo') errors.push(`${p.id}: ${p.kind} outside an album`);
      if (p.albumOrder !== null) errors.push(`${p.id}: albumOrder outside an album`);
      if (!(p.theme in themeLabels))
        errors.push(`${p.id}: theme "${p.theme}" has no label in themes.ts`);
    }

    const expected =
      p.width === p.height ? 'square' : p.width > p.height ? 'landscape' : 'portrait';
    if (p.orientation !== expected) errors.push(`${p.id}: orientation should be ${expected}`);

    if (p.source === 'stock' && (!p.credit || !p.licenseUrl)) {
      errors.push(`${p.id}: stock photo without credit and licenseUrl`);
    }
  }

  for (const id of heroPhotoIds) {
    if (ids.get(id)?.kind !== 'photo')
      errors.push(`curation.heroPhotoIds: "${id}" is not a manifest photo`);
  }
  for (const s of services) {
    if (s.imageId && !ids.has(s.imageId))
      errors.push(`services.${s.id}.imageId: "${s.imageId}" not in manifest`);
  }
  const albumSlugs = new Set(photos.map((p) => p.album).filter(Boolean));
  for (const slug of Object.keys(albumInfo)) {
    if (!albumSlugs.has(slug)) errors.push(`curation.albumInfo: no manifest entries for "${slug}"`);
  }
  for (const slug of albumSlugs) {
    if (slug && !(slug in albumInfo))
      errors.push(`album "${slug}" has no title in curation.albumInfo`);
  }
  return errors;
}

export interface ManifestReport {
  count: number;
  errors: string[];
}

let report: ManifestReport | undefined;

/** Validates once per page load and logs problems once; later calls return the cached report. */
export function validateManifest(): ManifestReport {
  report ??= runValidation();
  return report;
}

function runValidation(): ManifestReport {
  const parsed = z.array(photoSchema).safeParse(manifest);
  const errors = parsed.success
    ? crossCheck(parsed.data)
    : parsed.error.issues.map((issue) => {
        const [index, ...field] = issue.path;
        const id = (manifest as { id?: string }[])[index as number]?.id ?? `#${String(index)}`;
        return `${id}${field.length ? `.${field.join('.')}` : ''}: ${issue.message}`;
      });

  if (errors.length > 0) {
    console.error(
      `photos.manifest.json: ${errors.length} problem(s)\n${errors.map((e) => `  • ${e}`).join('\n')}`,
    );
  }
  return { count: manifest.length, errors };
}
