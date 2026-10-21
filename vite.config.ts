import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { imagetools, resolveConfigs } from 'vite-imagetools';
import {
  AVIF_SETTINGS,
  PLACEHOLDER_WIDTH,
  photoBlockReason,
  responsiveFormats,
  responsiveWidths,
} from './src/lib/imagePolicy.ts';
import type { Photo } from './src/types/content.ts';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PHOTO_QUERY = /[?&](responsive|placeholder)(?:[=&]|$)/;

/**
 * Build-time consent and exclusion gate (spec 6). Runs before imagetools: a photo that is not in
 * the manifest, is excluded, or (with VITE_ENFORCE_CONSENT=true) lacks consent resolves to
 * `undefined`, so its image files are never encoded or emitted into dist/.
 */
function photoGate(enforceConsent: boolean): Plugin {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'src/data/photos.manifest.json'), 'utf8'),
  ) as Photo[];
  const bySrc = new Map<string, Photo>();
  for (const p of manifest) {
    bySrc.set(p.src, p);
    if (p.xlSrc) bySrc.set(p.xlSrc, p);
  }
  return {
    name: 'aakar-photo-gate',
    enforce: 'pre',
    load(id) {
      const [file, query = ''] = id.split('?');
      if (!PHOTO_QUERY.test(`?${query}`)) return null;
      const rel = path.relative(ROOT, file).replaceAll('\\', '/');
      if (!rel.startsWith('src/assets/photos/')) return null;
      const photo = bySrc.get(rel);
      if (photo && !photoBlockReason(photo, enforceConsent)) return null;
      return 'export default undefined;';
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, ROOT, 'VITE_');
  // `pnpm dev`: WebP at two widths only; builds get the full set (src/lib/imagePolicy.ts).
  const dev = command === 'serve';
  // Bundle report only on demand: `pnpm analyze` (mode) or ANALYZE=true.
  const analyze = mode === 'analyze' || process.env.ANALYZE === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
      photoGate(env.VITE_ENFORCE_CONSENT === 'true'),
      imagetools({
        // Encoded images are cached here (git-ignored with node_modules), so warm builds and
        // dev restarts don't re-encode every photo.
        cache: { enabled: true, dir: 'node_modules/.cache/imagetools' },
        // AVIF encoder settings apply to AVIF outputs only (directives would hit WebP too).
        resolveConfigs: (entries, formats) =>
          resolveConfigs(entries, formats).map((config) =>
            config.format === 'avif'
              ? {
                  ...config,
                  effort: String(AVIF_SETTINGS.effort),
                  quality: String(AVIF_SETTINGS.quality),
                }
              : config,
          ),
        // Spec 7.2: `?responsive` = AVIF + WebP srcsets at the allowed widths;
        // `?placeholder` = a tiny inline WebP for the blur-up.
        defaultDirectives: async (url, metadata) => {
          if (url.searchParams.has('placeholder')) {
            return new URLSearchParams({
              w: String(PLACEHOLDER_WIDTH),
              format: 'webp',
              quality: '40',
              inline: '',
            });
          }
          if (url.searchParams.has('responsive')) {
            const { width = 0 } = await metadata();
            return new URLSearchParams({
              w: responsiveWidths(url.pathname, width, { dev }).join(';'),
              format: responsiveFormats({ dev }).join(';'),
              as: 'picture',
            });
          }
          return new URLSearchParams();
        },
      }),
      analyze &&
        visualizer({
          filename: 'dist/stats.html',
          template: 'treemap',
          gzipSize: true,
          brotliSize: true,
          open: true,
        }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
