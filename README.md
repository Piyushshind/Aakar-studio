# Aakar Digital Photo Studio website

Static, animated single-page site for Aakar Digital Photo Studio, Jalgaon. React 19, TypeScript, Vite, Tailwind CSS v4, GSAP.

The full specification is [md/PROJECT_SPEC.md](md/PROJECT_SPEC.md).

## Commands (pnpm only)

```sh
pnpm install
pnpm dev            # dev server
pnpm build          # typecheck + production build to dist/, pre-rendered (SEO HTML, robots.txt, sitemap.xml)
pnpm lint           # oxlint
pnpm typecheck
pnpm format         # prettier --write
pnpm analyze        # bundle report at dist/stats.html
```

## Photos

The website's photos (WebP masters in `src/assets/photos/`) and `src/data/photos.manifest.json` are committed. The owner's camera originals are not: they stay git-ignored and the masters are regenerated from them with the `images:*` scripts (spec section 7.2).
