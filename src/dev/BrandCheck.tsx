// TEMPORARY (Phase 3): dev-only brand check. Loaded only when import.meta.env.DEV.
// Delete this folder in Phase 5 when the real sections arrive.
import type { ReactNode } from 'react';
import { Logo, type LogoTone, type LogoVariant } from '@/components/ui/Logo';

// The reference banner is git-ignored (it contains a baby photo), so a fresh clone has no file.
// import.meta.glob returns {} instead of failing the build when it's missing.
const reference = Object.values(
  import.meta.glob<string>('/src/assets/brand/reference-banner.jpg', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)[0];

const BACKGROUNDS: { name: string; color: string; tone: LogoTone }[] = [
  { name: 'Dark #121010', color: '#121010', tone: 'light' },
  { name: 'Cream #f3ebe1', color: '#f3ebe1', tone: 'dark' },
  { name: 'White #ffffff', color: '#ffffff', tone: 'dark' },
];
const LOCKUPS: { variant: LogoVariant; width: string }[] = [
  { variant: 'horizontal', width: 'w-80' },
  { variant: 'stacked', width: 'w-60' },
  { variant: 'tagline', width: 'w-96' },
  { variant: 'mark', width: 'w-28' },
];
const MARK_SIZES = [16, 24, 32, 48, 64, 128];

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">{title}</h2>
      {children}
    </section>
  );
}

export default function BrandCheck() {
  return (
    <div id="brand-check" className="mx-auto max-w-6xl space-y-10 px-6 py-16">
      <p className="text-xs font-semibold tracking-[0.4em] text-muted uppercase">
        Brand check · dev only · Phase 3
      </p>

      <Block title="Lockups on dark, cream and white">
        <div className="grid gap-4 lg:grid-cols-3">
          {BACKGROUNDS.map((bg) => (
            <div
              key={bg.name}
              data-bg={bg.name}
              className="flex flex-col items-center gap-8 rounded-lg border border-line p-6"
              style={{ backgroundColor: bg.color }}
            >
              {LOCKUPS.map((l) => (
                <Logo
                  key={l.variant}
                  variant={l.variant}
                  tone={bg.tone}
                  className={`${l.width} max-w-full`}
                />
              ))}
              <span
                className="text-xs"
                style={{ color: bg.tone === 'light' ? '#a39a90' : '#8a7666' }}
              >
                {bg.name} · tone “{bg.tone}”
              </span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Mark at 16 / 24 / 32 / 48 / 64 / 128 px (full, simple, tiny)">
        {BACKGROUNDS.map((bg) => (
          <div
            key={bg.name}
            data-sizes={bg.name}
            className="flex flex-wrap items-end gap-6 rounded-lg border border-line p-4"
            style={{ backgroundColor: bg.color }}
          >
            {MARK_SIZES.map((size) => (
              <div key={size} className="flex items-end gap-2">
                {(['full', 'simple', 'tiny'] as const).map((kind) => (
                  <div key={kind} style={{ width: size, height: size }}>
                    <Logo
                      variant="mark"
                      simple={kind === 'simple'}
                      tiny={kind === 'tiny'}
                      tone={bg.tone}
                      className="size-full"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </Block>

      <Block title="Favicons and app icons (as delivered)">
        <div className="flex flex-wrap items-end gap-8 rounded-lg border border-line bg-surface p-6 text-xs text-muted">
          {[
            ['Light tab', 'bg-[#dee1e6] text-[#202124]'],
            ['Dark tab', 'bg-[#35363a] text-[#e8eaed]'],
          ].map(([label, colors]) => (
            <figure key={label} className="space-y-2">
              <div className={`flex items-center gap-3 rounded-md px-3 py-2 ${colors}`}>
                {[16, 24, 32].map((s) => (
                  <img key={s} src="/favicon/favicon.svg" width={s} height={s} alt="" />
                ))}
                <span>{label}</span>
              </div>
              <figcaption>favicon.svg @16 / 24 / 32</figcaption>
            </figure>
          ))}
          {[16, 24, 32, 48].map((s) => (
            <figure key={s} className="space-y-2">
              <img src="/favicon/favicon.ico" width={s} height={s} alt="" />
              <figcaption>favicon.ico @{s}</figcaption>
            </figure>
          ))}
          <figure className="space-y-2">
            <img
              src="/favicon/apple-touch-icon.png"
              width={90}
              height={90}
              alt=""
              className="rounded-[22%]"
            />
            <figcaption>apple-touch-icon (iOS mask)</figcaption>
          </figure>
          <figure className="space-y-2">
            <img
              src="/favicon/icon-192.png"
              width={96}
              height={96}
              alt=""
              className="rounded-2xl"
            />
            <figcaption>icon-192</figcaption>
          </figure>
          <figure className="space-y-2">
            <img
              src="/favicon/icon-512-maskable.png"
              width={96}
              height={96}
              alt=""
              className="rounded-full"
            />
            <figcaption>maskable (circle mask)</figcaption>
          </figure>
        </div>
      </Block>

      <Block title="OG image (1200×630)">
        <img
          src="/og-image.jpg"
          width={600}
          height={315}
          alt=""
          className="rounded-lg border border-line"
        />
      </Block>

      <Block title="Reference banner vs redrawn logo (dev only)">
        <div className="grid items-center gap-4 md:grid-cols-2">
          {reference ? (
            <img src={reference} alt="" className="w-full rounded-lg [image-rendering:auto]" />
          ) : (
            <p className="text-sm text-muted">reference-banner.jpg not present (git-ignored).</p>
          )}
          <div className="rounded-lg bg-cream-bg p-6">
            <Logo variant="tagline" tone="dark" className="w-full" />
          </div>
        </div>
      </Block>
    </div>
  );
}
