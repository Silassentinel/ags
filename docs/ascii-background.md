# ASCII art backgrounds (ascii.rest) — preparation notes

Status: **wired in on every page** (Phase 1 of
[features/ascii-background/PLAN.md](features/ascii-background/PLAN.md), 2026-10-20).
The Settings switch and intensity slider (Phase 2) are still to come; the
decisions at the end of this file were answered on 2026-10-20.

## What was checked (2026-10-20)

| Check | Result |
|---|---|
| Library | [Silassentinel/ascii](https://github.com/Silassentinel/ascii), fork of `bas3line/ascii`, pinned to commit `25b4b18` (upstream `fcb6444` + lockfile fix). MIT. |
| Astro version here | 7.3.4 (static output, Preact islands, `security.csp: true`) |
| Installs via `npm ci`? | Yes. npm clones the fork, runs its `prepare` (TypeScript 7 build of `dist/`), then installs `dist/` + `src/astro/`. |
| Builds with the real `astro.config.mjs`? | Yes, no errors or warnings from the library. |
| CSP intact? | Yes. Pages still get `script-src 'self' …; style-src 'self' …` with no `unsafe-inline`; `test/ts/CspBuild.test.ts` passes. |
| Runtime CSP violations in Chromium? | None (headless Chromium, `securitypolicyviolation` listener). |
| Third-party requests at runtime? | None with the site's own component (see below). |
| Animation runs / pauses? | Runs; holds the first frame under `prefers-reduced-motion: reduce`; pauses when the tab is hidden (library behaviour). |
| Dark mode (`html.dark`)? | Works: the piece's ink flips with the theme and the shaded pieces flip their ramp. |
| `astro check` | 0 errors in the new component. |

## Why not use the library's own `<Ascii>` Astro component

`import Ascii from "ascii.rest/astro"` compiles and builds fine here, but for a
*background* on *this* site it has three drawbacks:

1. It fetches a fallback font from `https://ascii.rest/fonts/…woff2` at runtime
   and its `<ascii-art>` element injects a `<style>` tag from script. The site's
   CSP (no `unsafe-inline`) blocks the injected style (console error, harmless)
   and the font fetch is a third-party request on every page view (privacy; IP
   leaks to ascii.rest / Cloudflare).
2. For coloured pieces it renders an inline `style=""` attribute, which the
   CSP also blocks.
3. It has no "cover the viewport" sizing.

So `src/components/Background/AsciiBackground.astro` uses the library's
lower-level `mount()` / `load` API directly, exactly as ascii.rest's own site
does. It renders the first frame at build time, scales the piece to cover the
viewport from script (CSSOM only, no inline style attributes) and keeps all
styling in a scoped stylesheet.

## How it is used

`src/layout/BaseLayout.astro` mounts `<AsciiBackground />` once, so every
page gets a backdrop. On each page load the browser picks a random piece
from the pool of the current season in Belgium
(`src/scripts/ui/features/AsciiBackground/seasons.ts` and `pool.ts`):

| season (Europe/Brussels, meteorological) | pool |
|---|---|
| lente, Mar–May | cherry-blossom, rain, fern, butterfly, pond-ripples |
| zomer, Jun–Aug | fireflies, sea-swell, starfield, sunrise, wind |
| herfst, Sep–Nov | wind, rain, flow-field, lightning, ruled-mountains |
| winter, Dec–Feb | snowfall, starfield, aurora, contour-map, moon-phases |

For a demo or a one-off page a fixed piece can be forced; its first frame
is then rendered at build time:

```astro
<AsciiBackground piece="snowfall" fps={10} />
```

`piece` must be one of the names allow-listed in
`src/components/Background/pieces.ts` (type-checked; a wrong name fails the
build). `fps` defaults to 12.

## Security / supply-chain notes

- **Pinned to a commit**, not a branch: `github:Silassentinel/ascii#25b4b18…`
  (the fork's branch with the lockfile fix below). Bump deliberately after
  reviewing upstream changes. If that branch is ever deleted without being
  merged, the commit becomes unreachable and `npm ci` breaks: merge it.
- The package runs a `prepare` script (`tsc`) on install, i.e. code from the
  fork executes at `npm ci` time. Pinning to a reviewed commit on the fork
  you control is the mitigation.
- Fixed: the fork's `package-lock.json` used to resolve its dev dependencies
  from `registry.npmmirror.com`; commit `25b4b18` on the fork resolves them
  from `registry.npmjs.org`. Verified: a clean `npm ci` here needs no
  registry override any more.
- No runtime network access, no `eval`, no `innerHTML`: pieces are pure
  functions returning strings; the component sets `textContent` or draws on a
  canvas.
- The `<div class="ascii-bg">` is `aria-hidden`, `pointer-events: none` and
  `z-index: -1`, so it cannot overlay or intercept anything.

## Build-output note

Only the 17 pieces allow-listed in `src/components/Background/pieces.ts`
are bundled, each as its own lazy chunk that is fetched only when it plays:
28 files, 156 KB in `_astro/` for the whole site (was about 200 files and
1.2 MB with the library's `load[]` lookup). To use another piece, add one
line there and, if it should play by itself, put it in a pool.

## Fixed pre-existing issue

`npm ci` on `main` used to fail with an ERESOLVE peer conflict
(`@testing-library/preact-hooks@1.1.0` wants `@testing-library/preact@^2`).
`@testing-library/preact@3` exports `renderHook` itself, so the stale package
was removed and the two tests import `renderHook` from there. `npm ci` now
works without `--legacy-peer-deps`.

## Decisions needed before wiring it in

1. **Where**: every page (in `BaseLayout.astro`) or only the home page?
2. **Which piece** (and fps): see the candidates above. One fixed piece, a
   piece per page, or random per visit?
3. **Opacity**: currently 0.18 light / 0.28 dark in the component's CSS.
4. **Settings toggle**: should the existing Settings panel get an
   "ascii background" switch (localStorage), like Chaos Mode?
5. **Fork lockfile**: done on the fork's branch; merge that branch in the
   fork so the pinned commit stays reachable.
