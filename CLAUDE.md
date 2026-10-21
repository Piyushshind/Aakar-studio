# Aakar Digital Photo Studio website

## Source of truth

- The spec is `md/PROJECT_SPEC.md`. Read it at the start of every session. It wins over anything else; keep it in `md/`.
- Work phase by phase (spec section 14). At the end of each phase, report, suggest commit messages and wait for approval before starting the next.
- Claude suggests commit messages; the user commits and pushes. Claude never runs `git commit` or `git push`.
- Claude does not run builds (`pnpm build`, `vite build`, fresh-clone builds): say which build to run and what to check, and the user runs it.
- Ask before architectural changes the spec doesn't describe.

## Hard rules

- pnpm only. Never npm or yarn, never create `package-lock.json` or `yarn.lock`.
- No AI-generated images anywhere, including placeholders and decoration.
- No stock photos in portfolio areas (hero, gallery, albums, before/after, service cards). See spec 7.1.
- Never invent prices, stats, years in business, phone numbers or reviews. Empty data hides its section.
- Respect the consent gate: `isPublishable(photo)`; launch builds use `VITE_ENFORCE_CONSENT=true`.
- Never import from `src/haveToProcessImages/` or `src/assets/photos/_review/`.
- The repo is public during development: never commit client photos. `src/assets/photos/`, `src/haveToProcessImages/` and `scripts/images/out/` are git-ignored; only `src/data/photos.manifest.json` is committed. Before every push, `git log --all -- scripts/images/out src/assets/photos` must return nothing.

## Images

- The image pipeline is done: `scripts/images/` produced the WebP masters in `src/assets/photos/` and `src/data/photos.manifest.json`.
- Don't re-run `images:*` unless asked. Only `consent` and `featured` may be hand-edited in the manifest.
- Render photos only through the `ResponsiveImage` component, using data from `src/lib/photos.ts`.

## Animation

- GSAP in React: always `useGSAP(() => {...}, { scope: ref })`, never raw `useEffect`. Register plugins once in `src/lib/gsap.ts`.
- Reduced motion is mandatory (spec 8.3): native scroll, no preloader, pinning, parallax or WebGL; only short fades.
- Animate `transform` and `opacity` only. One library per property per element.

## Commands

- `pnpm dev` / `pnpm build` / `pnpm preview`
- `pnpm lint` / `pnpm typecheck` / `pnpm format` / `pnpm format:check`
- `pnpm analyze` (bundle visualizer, `ANALYZE=true`)
- `pnpm brand:build` (logo SVGs, PNGs, favicons, manifest, OG image, `logoArt.ts`; Python only when logo text changes)
- `pnpm images:analyze|dedupe|sheets|classify|export|report` (only when asked)
