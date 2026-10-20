# ASCII art backgrounds (ascii.rest) — preparation notes

Status: **prepared, not wired in**. The library is installed and a backdrop
component exists, but no page uses it yet. Decisions for the site owner are
listed at the end.

## What was checked (2026-10-20)

| Check | Result |
|---|---|
| Library | [Silassentinel/ascii](https://github.com/Silassentinel/ascii), fork of `bas3line/ascii`, pinned to commit `fcb6444`. MIT. |
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

`piece` is any name from the ascii.rest catalogue (type-checked at build time;
a wrong name fails the build). `fps` is optional and lowers CPU use.

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

- **Pinned to a commit**, not a branch: `github:Silassentinel/ascii#fcb6444…`.
  Bump deliberately after reviewing upstream changes.
- The package runs a `prepare` script (`tsc`) on install, i.e. code from the
  fork executes at `npm ci` time. Pinning to a reviewed commit on the fork
  you control is the mitigation.
- The fork's `package-lock.json` resolves its dev dependencies from
  `registry.npmmirror.com` (upstream author's mirror). Every `npm ci` of this
  site therefore pulls TypeScript 7 and friends from that mirror. Consider
  regenerating that lockfile against `registry.npmjs.org` in the fork.
- No runtime network access, no `eval`, no `innerHTML`: pieces are pure
  functions returning strings; the component sets `textContent` or draws on a
  canvas.
- The `<div class="ascii-bg">` is `aria-hidden`, `pointer-events: none` and
  `z-index: -1`, so it cannot overlay or intercept anything.

## Build-output note

`load[name]` keeps every piece reachable, so the static build emits all 191
pieces as lazy chunks (≈1.2 MB in `_astro/`, about 200 files). A visitor only
downloads the one piece used, but all files land in the deploy repository. If
that matters, switch the component to a small allow-list of static imports.

## Known pre-existing issue (not introduced here)

`npm ci` on `main` fails with an ERESOLVE peer conflict
(`@testing-library/preact-hooks@1.1.0` wants `@testing-library/preact@^2`,
the project has `^3.2.4`). `npm ci --legacy-peer-deps` works and is what was
used here.

## Decisions needed before wiring it in

1. **Where**: every page (in `BaseLayout.astro`) or only the home page?
2. **Which piece** (and fps): see the candidates above. One fixed piece, a
   piece per page, or random per visit?
3. **Opacity**: currently 0.18 light / 0.28 dark in the component's CSS.
4. **Settings toggle**: should the existing Settings panel get an
   "ascii background" switch (localStorage), like Chaos Mode?
5. **Fork lockfile**: regenerate against npmjs.org (see security notes)?
