# Accessibility

_Last updated: 2026-10-20_

Root: `ags/docs/features/accessibility/` (written in the `features/<name>/` shape used in the Website workspace; move it there and list it in `PROJECT_INDEX.md` if that is where feature docs live).

[PLAN.md](PLAN.md) is authoritative for what changes and when; this file is structure only.

## What this is

WCAG 2.2 AA keyboard and screen-reader work on benjamindegryse.be: skip link, focus rings, a real menu button, an inert Settings panel with disclosure state, named landmarks, heading order, link text, per-page language, pressed state on the theme toggle, animated extras off by default under reduced motion, and an axe-core plus keyboard gate in the test suite that blocks deploys on regressions.

## Structure

- [FEATURE_REQUEST.md](FEATURE_REQUEST.md): the original request (verbatim), the audit's motivation, requirements, non-goals, open questions.
- [PLAN.md](PLAN.md): findings table with status, design, phases, todo, evaluation criteria.
- Code: `src/layout/BaseLayout.astro` (skip link, `lang`, H1 in `main`), `src/components/Header/*.astro` (menu button, named nav, theme toggle), `src/scripts/ui/Menu.ts`, `src/components/ui/Settings.tsx`, `src/components/ui/Theme.tsx`, `src/components/features/ContentHighlight/ContentHighlight.tsx`, `src/styles/global.css` (focus ring, skip link), `test/ts/Accessibility.test.ts` (the gate).

## Known gaps / open questions

See the open questions in [FEATURE_REQUEST.md](FEATURE_REQUEST.md) and "Not verified" in [PLAN.md](PLAN.md).

## Maintenance

Update the date above and the structure list whenever files are added, moved or removed in this folder.
