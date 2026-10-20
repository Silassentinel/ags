# ASCII art backgrounds (ascii.rest) — preparation notes

Status: **prepared, not wired in**. The library is installed and a backdrop
component exists, but no page uses it yet. Decisions for the site owner are
listed at the end.

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

## How to try it

```astro
---
import BaseLayout from "../layout/BaseLayout.astro";
import AsciiBackground from "../components/Background/AsciiBackground.astro";
---
<BaseLayout pageTitle="Home">
  <AsciiBackground piece="matrix-rain" fps={12} />
  …
</BaseLayout>
```

`piece` is one of the names allow-listed in `src/components/Background/pieces.ts`
(type-checked at build time; a wrong name fails the build). `fps` is optional
and lowers CPU use.

Good backdrop candidates (all text pieces unless noted):

| piece | size | native fps | note |
|---|---|---|---|
| `matrix-rain` | 63×24 | 20 | the obvious one |
| `starfield` | 64×24 | 30 | options `{ stars, speed }` |
| `rain`, `snowfall` | 64×20 / 64×22 | 30 / 20 | quiet |
| `flow-field`, `plasma` | 64×22 | 20 / 24 | generative |
| `contour-map` | 72×20 | 8 | very cheap |
| `night-coast`, `aurora-fjord` | 200×100 | 15 | coloured scenes on a `<canvas>`, dark ground |

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

Only the pieces allow-listed in `src/components/Background/pieces.ts` are
bundled (static imports), so the deploy repository gets a handful of chunks
instead of all 191. To use another piece, add one import line there.

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
