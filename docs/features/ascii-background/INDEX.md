# ASCII art backgrounds

_Last updated: 2026-10-20_

Root: `ags/docs/features/ascii-background/` (written in the `features/<name>/` shape used in the Website workspace; move this folder to `Website/features/ascii-background/` and add it to `PROJECT_INDEX.md` there if that is where feature docs live).

[PLAN.md](PLAN.md) is authoritative for what changes and when; this file is structure only.

## What this is

Animated ascii.rest pieces as a faint, seasonal, randomised backdrop on every page of benjamindegryse.be, with a switch and intensity slider in the site's Settings panel. On branch `ccr-162bba21-kzgz4a` of `Silassentinel/ags`: the test suite is green and gates deploys (Phase 0), the backdrop is live on every page (Phase 1) with the Settings switch and intensity slider (Phase 2); what remains is Phase 3, the first automatic deploy from `main`.

## Structure

- [FEATURE_REQUEST.md](FEATURE_REQUEST.md): the original request (verbatim), requirements, non-goals, open questions.
- [PLAN.md](PLAN.md): current state, design, phases (0: green tests, 1: backdrop, 2: settings, 3: deploy gate), todo lists, evaluation criteria.
- [../../ascii-background.md](../../ascii-background.md): compatibility verification log and security notes for the library.
- [../../deploy.md](../../deploy.md): the deploy workflow and its one-time secret setup.
- Code: `src/components/Background/AsciiBackground.astro` (the backdrop), `src/components/Background/pieces.ts` (allow-list of lazy piece imports), `src/scripts/ui/features/AsciiBackground/seasons.ts`, `pool.ts` and `prefs.ts` (season in Belgium, seasonal pools, random pick, stored switch and intensity), `src/components/ui/Settings.tsx` (the switch and slider), `test/ts/AsciiBackground.test.ts`, `test/ts/AsciiBackgroundPrefs.test.ts`, `test/Settings.test.tsx`, `.github/workflows/deploy.yml`.

## Known gaps / open questions

See the open questions in [FEATURE_REQUEST.md](FEATURE_REQUEST.md) and "Not verified" in [PLAN.md](PLAN.md).

## Maintenance

Update the date above and the structure list whenever files are added, moved or removed in this folder.
