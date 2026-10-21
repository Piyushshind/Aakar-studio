// TEMPORARY dev-only check panels (Phases 2–4). Shown at `?dev` in `pnpm dev`; never in production
// (App.tsx only imports this behind import.meta.env.DEV). Delete when no longer useful.
import BrandCheck from './BrandCheck';
import FoundationCheck from './FoundationCheck';
import ImagesCheck from './ImagesCheck';

export default function DevPanels() {
  return (
    <>
      <BrandCheck />
      <ImagesCheck />
      <FoundationCheck />
    </>
  );
}
