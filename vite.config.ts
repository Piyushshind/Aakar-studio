import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { imagetools } from 'vite-imagetools';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Bundle report only on demand: `pnpm analyze` (mode) or ANALYZE=true.
  const analyze = mode === 'analyze' || process.env.ANALYZE === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
      imagetools(),
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
