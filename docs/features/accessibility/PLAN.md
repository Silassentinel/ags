# Accessibility — plan

Source spec: [FEATURE_REQUEST.md](FEATURE_REQUEST.md). Related: [../ascii-background/PLAN.md](../ascii-background/PLAN.md) (the backdrop's reduced-motion handling), [../../deploy.md](../../deploy.md) (the gate runs in the deploy workflow).

## Current state (checked 2026-10-20, branch `ccr-162bba21-kzgz4a` off `main` e0429b6)

Audit before the work, on the production build with axe-core 4.14 (tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice) over `/`, `/blog/`, `/repos/`, `/tags/`, `/seizoenskalender/` in light and dark mode, plus a scripted keyboard walk:

| finding | pages | status |
|---|---|---|
| `color-contrast` (serious): `.count` #888 on white 3.54:1 | seizoenskalender | fixed (#595959 light, #b0b0b0 dark) |
| `heading-order` (moderate): H1 → H3 | home, blog | fixed (greeting is H2, Settings heading H2) |
| `landmark-unique` (moderate): two unnamed `nav` | seizoenskalender | fixed (`aria-label` Main, Maanden, Sections) |
| `region` (moderate): H1 and the Settings panel outside landmarks | all | fixed (H1 inside `main`, panel in an `aside`) |
| Keyboard walk: no focus ring on any `button` (`outline: none`) | all | fixed (`:focus-visible` ring, 3 px, text colour) |
| Hamburger is a `div`: no keyboard access, name or state | all | fixed (`button`, `aria-label`, `aria-expanded`, `aria-controls`, Escape) |
| Settings controls focusable while the panel is closed | all | fixed (`inert` + `aria-hidden` while closed) |
| No skip link | all | fixed |
| Dates #ff0000 on white 4.0:1 (axe did not see them: no recipes in the local build) | recipe pages | fixed (#c00000, 6.5:1) |
| "click me" blog links; `alt="..."`; `button > a` | blog list, cards | fixed |
| `lang="en"` on the Dutch seizoenskalender | seizoenskalender | fixed (`lang="nl"` through a layout prop) |
| Theme button without pressed state | all | fixed (`aria-pressed`, kept in sync with the Settings switch) |
| Content Highlighter ignored its own Settings switch (pre-existing) | all | fixed (reacts live to `feature-toggle`) |
| Effects animate under `prefers-reduced-motion: reduce` | all | Content Highlighter and backdrop off by default for those visitors; Chaos Mode and Obfuscator were off already |

Not verified here: real screen readers (no assistive technology in this environment), the CI run on GitHub (Chromium is installed in the `test` job with `npx playwright install --with-deps chromium`; the first push to `main` proves it), and the site on a phone with a hardware keyboard or switch access.

## Design

- **Focus**: one global rule, `:focus-visible { outline: 3px solid currentColor; outline-offset: 3px }`, so the ring follows the text colour in both themes; controls that invert on focus draw it inside their box. Transitions name their properties instead of `all`, so the ring is never animated in (the walk caught `outline: 0px` mid-transition).
- **Skip link**: visually hidden until focused, first in `<body>`, targets `main#main[tabindex=-1]`; Dutch label on Dutch pages.
- **Menu**: `src/scripts/ui/Menu.ts` owns the state (`setNavMenu(open)`), updates `aria-expanded`, closes on Escape and returns focus; `Menu.tsx` only mounts it.
- **Settings**: an `aside[aria-label]` landmark; the gear is a disclosure (`aria-expanded`, `aria-controls`); the panel is `inert` and `aria-hidden` while closed, labelled by its H2; Escape closes it and focuses the gear. The reduced-motion default lives next to the stored-choice logic (`storedEnabled`, `prefs.readEnabled`).
- **Gate**: `test/ts/Accessibility.test.ts` (node environment) builds the site with the production config into a scratch directory, serves it from a tiny static server, drives headless Chromium through Playwright with `bypassCSP` (only so the injected axe script may run; the pages are otherwise untouched), runs axe in both themes and walks the keyboard. About 25 s locally.

## Phasing

- **Phase 1 — audit, fixes, gate** (this change). Done 2026-10-20.
- **Phase 2 — manual assistive-technology pass** on the live site (owner, VoiceOver or NVDA), fixing what it finds.
- Backlog: a pull-request `ci.yml`; a wider contrast review (every colour pair in both themes, 7:1 where cheap); `aria-expanded` on the repo cards' "read more" flip; Dutch UI strings on Dutch pages.

## Todo — Phase 1 — done

- [x] Audit script and findings (above).
- [x] Layout: skip link, H1 inside `main`, `lang` prop, named main nav.
- [x] Hamburger button + `Menu.ts` state, Escape; tests.
- [x] Focus-visible ring, `outline: none` removed, transitions named; dates and counts to AA.
- [x] Settings panel landmark, disclosure state, `inert`, Escape, H2, reduced-motion defaults; tests.
- [x] Theme toggle `aria-pressed` (component and script); tests.
- [x] Content Highlighter honours its switch and reduced motion; tests.
- [x] Blog list link text and structure; card image alt; link-styled button; tag page heading; Greeting H2; sub-menu as `nav`.
- [x] `test/ts/Accessibility.test.ts` gate; `playwright` 1.56.1 and `axe-core` 4.14.0 as exact dev dependencies; Chromium install step in the CI `test` job.
- [x] Full suite green locally (33 suites); `astro check` 0 errors.
- [ ] First CI run on `main` green with the Chromium install step (verify after merge).

## Security / operational considerations

- Playwright is a dev dependency only; it never ships to the site. The gate's `bypassCSP` applies to the test browser context, not to the built pages, whose CSP is unchanged and still covered by `CspBuild.test.ts`.
- The CI `test` job downloads Chromium on every run (about 150 MB, cached by GitHub between runs); it adds roughly a minute.
- No new network access at runtime; the changes are markup, CSS and client-side state.

## Evaluation criteria (definition of done)

1. axe-core reports zero violations on every sampled page in both themes (gate).
2. Keyboard walk: the skip link is the first stop and lands in `main`; every control reached by Tab shows a ring; nothing inside the closed Settings panel is reachable; the mobile menu opens and closes from the keyboard (gate).
3. Unit tests cover the menu state, theme pressed state, Settings disclosure and inert panel, reduced-motion defaults, and the Content Highlighter switch.
4. Full suite green locally and in the CI `test` job; deploy on `main` succeeds.
5. Anything not verified is written down here as unverified.

## Maintenance

Update this file when a phase's status changes or an open question in FEATURE_REQUEST.md is settled.
