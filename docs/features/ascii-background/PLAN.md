# ASCII art backgrounds — plan

Source spec: [FEATURE_REQUEST.md](FEATURE_REQUEST.md) (the original request is quoted there). Compatibility notes and verification log: [../../ascii-background.md](../../ascii-background.md). Deploy pipeline: [../../deploy.md](../../deploy.md).

## Current state (checked 2026-10-20, branch `ccr-162bba21-kzgz4a`)

Verified by running it here:

- `ascii.rest` is installed from the fork, pinned to commit `25b4b18`; `npm ci` is clean without flags.
- `src/components/Background/AsciiBackground.astro` plays one allow-listed piece as a fixed, full-viewport backdrop; `pieces.ts` holds the allow-list (7 pieces today). A real `astro build` with the production config passes; headless Chromium shows no CSP violations, no external requests, animation running, first frame held under reduced motion, dark mode handled.
- Nothing is wired into a page yet.
- `.github/workflows/deploy.yml` builds and pushes to `Silassentinel/silassentinel.github.io` on push to `main`; it needs the `DEPLOY_TOKEN` secret and has not run yet (cannot be run from this session). Its `test` job is non-blocking.
- The test suite is red on `main` and on the branch alike: 21 of 30 suites fail, 18 individual tests fail. Root causes, from the jest output:
  - 13 `.tsx` suites fail to run: `@testing-library/preact` 3.x is ESM-only and `jest.config.js` `transformIgnorePatterns` only exempts `preact`, `@preact`, `preact-render-to-string`, so Jest tries to `require()` it.
  - `test/ts/PreserveBuild.test.ts` and `test/ts/UrlSchemeSanitizerPlugin.test.ts`: read the 34 real recipes in `src/pages/posts/`, which only exist after `npm run build` fetched them (`ENOENT`).
  - `test/ts/Theme.test.ts`, `test/ts/Utilities.test.ts`, `test/ts/ContentHighlight.test.ts`: expect `document.documentElement.classList.add` / `toggle`, `window.matchMedia`, `innerWidth` to be Jest mocks; under `jest-environment-jsdom` 30 they are real jsdom functions ("received value must be a mock or spy function").
  - `test/ts/ChaosMode.test.ts`: importing `ChaosMode.ts` runs `initChaosMode()` at module load against a hand-rolled `document` mock lacking `Element.remove`.
  - `test/ts/Menu.test.ts`: imports `src/scripts/ui/Menu`, which only exists as `Menu.ts.bak` (dead test).
  - `test/ts/Obfuscator.test.ts`: `onlyVisible` relies on layout jsdom does not do; `cyclicObfuscation` recurses until the stack overflows under fake timers.
  - One `PreserveBuild` end-to-end case ("preserved files survive a failed build") fails on an assertion; not yet root-caused, unverified whether it depends on the posts directory too.

Not verified: that the `transformIgnorePatterns` fix alone makes all 13 `.tsx` suites pass (they may hide further failures), and the deploy workflow end to end.

## Design

**Runtime shape (client, CSP-safe):**

```
BaseLayout.astro
└── <AsciiBackground />            fixed, inset 0, z-index -1, aria-hidden, pointer-events none
    ├── <pre class="ascii-bg__piece">  empty at build time (piece unknown until the browser picks)
    └── <script>                  bundled by Astro → external module, allowed by script-src 'self'
          prefs.read()            localStorage: asciiBackground, asciiBackgroundIntensity
          if disabled → remove wrapper, done
          season = seasonFor(new Date())          seasons.ts: month in Europe/Brussels via Intl, pure, unit-tested
          piece  = pick(POOLS[season], Math.random) pool.ts  (pure, unit-tested)
          fit()   font-size via CSSOM so cols×rows cover the viewport (existing code)
          wrap.style.opacity = opacityFor(intensity, isDark)   CSSOM, not an attribute
          mount(pre, piece, { fps: 12 })          ascii.rest
          document.addEventListener('feature-toggle', …)   id 'ascii-background' → show/hide, stop/restart
          document.addEventListener('feature-setting', …)  id 'ascii-background-intensity' → opacity
          MutationObserver on <html class> → recompute opacity when dark mode flips
```

**Seasonal pools (text pieces only, all verified present in the library; native fps in brackets, capped to 12 at mount):**

| season (meteorological) | pool |
|---|---|
| lente, Mar–May | cherry-blossom (15), rain (30), fern (20), butterfly (30), pond-ripples (20) |
| zomer, Jun–Aug | fireflies (15), sea-swell (20), starfield (30), sunrise (15), wind (15) |
| herfst, Sep–Nov | wind (15), rain (30), flow-field (20), lightning (20), ruled-mountains (10) |
| winter, Dec–Feb | snowfall (20), starfield (30), aurora (20), contour-map (8), moon-phases (15) |

`pieces.ts` is the union of these pools (17 pieces, lazy imports, one small chunk each).

**Preferences (localStorage, same conventions as `Settings.tsx`):**

| key | values | default |
|---|---|---|
| `asciiBackground` | `enabled` / `disabled` | `enabled` |
| `asciiBackgroundIntensity` | `0`…`100` | `30` |

Opacity = intensity / 100 × 0.6, multiplied by 1.5 in dark mode and capped at 0.6. Default 30 gives today's 0.18 light / 0.27 dark.

**Settings panel:** `FeatureToggle` gets an optional `control: { type: 'range'; min; max; step; storageKey; value }`. The list renders a `<input type="range">` under the switch when present, writes the value to localStorage on input, and dispatches `feature-setting` with `{ id, value }`. The existing `feature-toggle` dispatch covers the switch. The range input is labelled and keyboard operable (native control).

**Why the first frame is no longer pre-rendered:** the owner chose a fresh random pick per page load (2026-10-20), so the server cannot know the piece. The wrapper is `position: fixed`, so an empty `<pre>` causes no layout shift; the piece appears when the module runs (tens of milliseconds after HTML). If open question 1 resolves to "stable per page", the build-time pick returns and the first frame comes back for free.

## Phasing

- **Phase 0 — green test suite** (prerequisite for gating deploys; Requirement 9). Done 2026-10-20; CI confirmation pending the first run on `main`.
- **Phase 1 — seasonal random backdrop on every page** (Requirements 1–3, 6–8). Done 2026-10-20.
- **Phase 2 — Settings switch and intensity slider** (Requirements 4–5), with tests. Done 2026-10-20.
- **Phase 3 — turn on the deploy gate, ship**: make `test` a `needs:` of `deploy`, merge to `main`, confirm the first automatic deploy, check the live site with `/verify-deploy`.
- Backlog: canvas scenes, visitor piece picker, Belgium-fixed season, Dockerfile Node 22.

## Todo — Phase 0 (green test suite) — done 2026-10-20

Result: 29 of 29 suites pass, 173 tests, 2 skipped (they need the fetched recipes and run in CI), stable over three consecutive runs; `astro check` 0 errors.

- [x] `jest.config.js`: `@testing-library` exempted from `transformIgnorePatterns`; its ESM-only `.mjs` is compiled by ts-jest (`allowJs`, CommonJS). This won over native ESM mode and Node 24 because it needed no change to how tests are written or run. The `preact` module mocks were removed: they stubbed `render` and `act`, so no component test could ever render.
- [x] `jest.setup.ts` rewritten: real jsdom DOM, only `IntersectionObserver`, `ResizeObserver`, `matchMedia`, viewport size and a non-networking `fetch` are provided; DOM and storage reset before every test. The old setup replaced `document.documentElement`, `body` and the query methods with `jest.fn()` objects, which is why 13 suites could not find what they rendered.
- [x] `test/ts/Menu.test.ts`: `src/scripts/ui/Menu.ts` restored from `Menu.ts.bak` (no self-start on import; `initNavMenu` returns a cleanup) and `Menu.tsx` delegates to it. The test for the removed `DOMContentLoaded` self-start was dropped.
- [x] `test/ts/Theme.test.ts`, `Utilities.test.ts`, `ContentHighlight.test.ts`, `test/Theme.test.tsx`: rewritten against the real DOM with `jest.spyOn`; `GetScreenDimensions` exported.
- [x] `ChaosMode.ts` / `Index.ts` no longer self-start on import (the component calls `initChaosMode()`), and `initialize()` is idempotent (a re-mount used to double-count clicks). `test/ts/ChaosMode.test.ts` and `test/ChaosMode.test.tsx` rewritten to test thresholds, the Settings switch and the user-disabled guard.
- [x] `test/ts/Obfuscator.test.ts` rewritten (visibility via `getBoundingClientRect`, fake timers for the cycle); the duplicate `test/Obfuscator.test.tsx` removed.
- [x] Recipes-dependent suites: `npm run fetch:recipes` (`scripts/fetch-recipes.js`, same code path as the build) runs in the CI `test` job before the suite; the two tests that read the real recipes skip with the reason in their name when `src/pages/posts/` is empty.
- [x] Remaining `PreserveBuild` end-to-end failure root-caused: `backupItem()`/`restoreItem()` shelled out to `rsync`, which is not installed here (and may not be where the build runs); a failed backup silently lost `.git`. Both now use `fs.cpSync`.
- [x] `RecipeFetcher.tsx` uses the same not-a-recipe list as the build script (`1ATEMPLATE.MD`, `README.md`, `test-recipe.md`); its test assumed that.
- [x] `test/Greeting.test.tsx`: the mocked `Math.random` sequence was off by one; now spied and restored per test.
- [x] `npm run test:ci` green three times in a row.
- [x] Deploy gate on: `deploy` now `needs: test` in `.github/workflows/deploy.yml`.
- [ ] A `ci.yml` on pull requests (not only pushes to `main`): still to do; cheap, see backlog.

## Todo — Phase 1 (seasonal random backdrop) — done 2026-10-20

- [x] `src/scripts/ui/features/AsciiBackground/seasons.ts`: `seasonFor(date)` from the month in `Europe/Brussels` via `Intl.DateTimeFormat`; tests cover every month and two UTC instants that are already the next month in Brussels (CET and CEST).
- [x] `src/scripts/ui/features/AsciiBackground/pool.ts`: `POOLS` typed `satisfies Record<Season, readonly BackdropName[]>` (a piece that is not allow-listed fails `astro check`), `pick()` clamps a `random()` of 1 or below 0; tests for coverage and uniformity.
- [x] `src/components/Background/pieces.ts`: 17 pool pieces as lazy imports (`() => import("ascii.rest/pieces/…")`), one chunk each, fetched only when that piece plays.
- [x] `AsciiBackground.astro`: `piece` is an optional override (first frame pre-rendered when given); otherwise the client script picks from the season's pool; fps defaults to 12; CSSOM-only styling; the wrapper carries `data-season` and the `<pre>` the chosen `data-piece` for inspection.
- [x] Mounted in `BaseLayout.astro`.
- [x] Production-config build: 28 files, 156 KB in `_astro/`. Headless Chromium on `/`, `/tags/` and `/seizoenskalender/`: season `herfst`, pieces vary across loads (rain, lightning, flow-field, wind seen), zero CSP violations, zero external requests, animation runs, frame held under `prefers-reduced-motion: reduce`, ink flips with `html.dark`.
- [ ] CPU measurement on a throttled profile: not measured here (headless Chromium gives no reliable main-thread figure). Check once on a real phone; the fps cap of 12 and the pause-when-hidden behaviour are the mitigations.
- [x] Docs updated.

## Todo — Phase 2 (switch and slider) — done 2026-10-20

- [x] `src/scripts/ui/features/AsciiBackground/prefs.ts`: the two keys (`asciiBackground`, `asciiBackgroundIntensity`), defaults (on, 30), clamping, a guarded storage access, `opacityFor(intensity, dark)` (intensity / 100 × 0.6, × 1.5 in dark mode, capped at 0.6); unit tests.
- [x] `Settings.tsx`: an optional `control` per feature; the "ASCII Background" entry (on by default) with an Intensity range (0–100, step 5) under its switch; `feature-setting` event `{ id: 'ascii-background-intensity', value }`. The panel now reads the stored choices in its first render instead of in an effect, so it no longer briefly writes the defaults over the visitor's choices and announces a state they did not pick (that transient affected every feature, Chaos Mode included). Tests in `test/Settings.test.tsx` (rewritten against the real DOM).
- [x] Client script: honours the switch on load (`hidden` wrapper, nothing loaded or played when off), reacts live to both events, stops the animation and observers when switched off, restarts with the same piece when switched on, re-applies the opacity when `html.dark` flips (MutationObserver).
- [x] `global.css`: the `.feature-range` control, light and dark.
- [ ] Manual check on a phone-sized viewport: slider usable, text readable at 100 %. Not done here; headless check at 1200×800 only.

## Backlog (later phases)

- Stable-per-page variant with a pre-rendered first frame, if open question 1 flips.
- Canvas scenes (night-coast, aurora-fjord) as optional "cover" backdrops, with a per-pool fps cap.
- A visitor-facing piece picker, or an "ascii art" page showing the pool.
- Dockerfile: Node 22 base image (currently 18; the project's `engines` already exclude it).
- A `ci.yml` that runs the suite on pull requests.

## Security / operational considerations

- **Write scope**: the feature writes two localStorage keys and touches only its own wrapper element; it never injects HTML (`textContent`/canvas only).
- **CSP**: unchanged; all styling is stylesheet or CSSOM. The build-time CSP test (`CspBuild.test.ts`) stays as the guard, and the Chromium check is part of each phase's done criteria.
- **Supply chain**: `ascii.rest` stays pinned to a commit on the owner's fork; bumping it is a deliberate, reviewed change. The fork branch with the lockfile fix must be merged so the pinned commit stays reachable.
- **Deploy**: the gate (Phase 3) means a red suite blocks a deploy; until then the `test` job is advisory. `DEPLOY_TOKEN` is scoped to one repository, Contents read/write.
- **Privacy**: no network requests at runtime; nothing about the visitor is stored beyond two preference keys.

## Evaluation criteria (definition of done)

1. `npm run test:ci` is green locally and in the CI `test` job; `deploy` has `needs: test`.
2. Production-config build passes; on three representative pages headless Chromium reports zero CSP violations, zero third-party requests, a running animation, a held first frame under reduced motion, and the correct ink in dark mode.
3. The Settings switch and slider persist across pages and reloads and apply without reload; disabling stops the animation loop.
4. Season and pool selection are unit-tested at every month boundary; every pool piece is allow-listed and bundled (no 191-chunk regression: fewer than 30 files in `_astro/`).
5. The first automatic deploy from `main` succeeds and the live site shows the backdrop (`/verify-deploy`).
6. Anything not verified is written down here as unverified, not claimed.

## Later changes

- 2026-10-20, accessibility work ([../accessibility/PLAN.md](../accessibility/PLAN.md)): with `prefers-reduced-motion: reduce` and no stored choice the backdrop now starts off; the Settings switch opts in. The first automatic deploy from `main` succeeded the same day (Phase 3 done).

## Maintenance

Update this file when a phase's status changes or a decision in FEATURE_REQUEST.md's open questions is settled.
