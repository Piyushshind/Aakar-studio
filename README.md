# Aakar Digital Photo Studio website

Static, animated single-page site for Aakar Digital Photo Studio, Jalgaon. React 19, TypeScript, Vite, Tailwind CSS v4, GSAP.

The full specification is [md/PROJECT_SPEC.md](md/PROJECT_SPEC.md).

## Commands (pnpm only)

```sh
pnpm install
pnpm dev            # dev server
pnpm build          # typecheck + production build to dist/
pnpm lint           # oxlint
pnpm typecheck
pnpm format         # prettier --write
pnpm analyze        # bundle report at dist/stats.html
```

## Photos

Client photos are not in git. `src/assets/photos/` is git-ignored and regenerated from the owner's originals with the `images:*` scripts (spec section 7.2). `src/data/photos.manifest.json` is committed.
