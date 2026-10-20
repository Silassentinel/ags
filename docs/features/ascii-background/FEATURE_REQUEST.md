# ASCII art backgrounds — feature request

## Original request (verbatim, from the Claude Code session of 2026-10-20)

> OK this is something of an artsy try i would like some Ascii arts as background as this is astro can you check if this is compatible (the ascii repo) and in the ags make a branch to do the implementation / preparation on?

Follow-up answers to the clarifying questions, same session:

> Where should the ASCII backdrop appear? — "Every page but randomised for every page"
> Which piece should play as the backdrop? — "Seasonal"
> How strong should the backdrop be, and should visitors be able to switch it off? — "Toggle plus intensity slider"
> Should fixing the red test suite (21 of 30 suites failing on main) be part of this plan? — "Yes, in this plan"

The original wording is kept as the ground truth; everything below is derived from it.

## Problem / motivation

benjamindegryse.be is a deliberately plain, brutalist, monospace site. The owner wants a little motion on it without giving up that style. Animated ASCII art fits: it is text, it is monospace, and the [ascii.rest](https://ascii.rest) library (fork: [Silassentinel/ascii](https://github.com/Silassentinel/ascii)) already ships 191 pieces with an Astro-friendly API. Compatibility was verified on 2026-10-20 ([../../ascii-background.md](../../ascii-background.md)): it builds with the site's strict Content Security Policy, makes no third-party requests when used through the site's own component, and respects reduced motion.

Precedent in this repository: the Settings panel (`src/components/ui/Settings.tsx`) already toggles features such as Chaos Mode and Content Highlighter with localStorage and a `feature-toggle` event, and `src/scripts/ContentBuilder/Season/seasonCalendar.ts` already encodes Belgian seasonality (by month). This feature extends both patterns rather than adding a new one.

## Goal

Every page of the site plays one faint, animated ASCII piece behind its content, chosen at random from a pool that matches the current season, with a visitor-controlled on/off switch and intensity slider in the existing Settings panel. The test suite is green so the deploy workflow can gate on it.

## Requirements

1. **Every page**: the backdrop is mounted once in `src/layout/BaseLayout.astro`, so all pages (home, blog, posts/recipes, repos, tags, seizoenskalender) get it.
2. **Randomised per page**: each page load picks a piece at random from the current season's pool (see open question 1 for the alternative reading).
3. **Seasonal**: four pools, one per meteorological season, with pieces that evoke it (snowfall in winter, cherry blossom in spring, …). The season is derived from the date.
4. **Toggle**: a switch "ASCII background" in the Settings panel, remembered in localStorage like the other features; default on.
5. **Intensity slider**: a range control in the same panel that sets how visible the backdrop is, remembered in localStorage; changes apply immediately without reload.
6. **Readability first**: the backdrop sits behind all content, is `aria-hidden`, never intercepts pointer events, and its maximum intensity still leaves body text readable.
7. **Respect the visitor**: `prefers-reduced-motion: reduce` holds the first frame (library behaviour); the animation pauses while the tab is hidden; frame rate is capped to keep CPU use low on phones.
8. **Security posture unchanged**: no inline styles or scripts (the CSP has no `unsafe-inline`), no runtime requests to third parties, the dependency stays pinned to a reviewed commit, only allow-listed pieces are bundled.
9. **Green test suite**: the pre-existing failures in `test/` are fixed and the new logic (season selection, pool pick, preference handling, Settings slider) has unit tests, so `.github/workflows/deploy.yml` can make the test job a gate.

## Non-goals

- Coloured canvas scenes (night-coast etc.) as backdrops: possible with the current component, but the seasonal pools use text pieces only, which are cheaper and need no `<canvas>`.
- A piece picker for visitors ("choose your backdrop"): the slider and switch are the whole UI for now.
- Per-page curated art (a specific piece for a specific post).
- Changing the site's visual design otherwise (colours, fonts, layout).
- Fixing the Dockerfile's Node 18 base image (noted separately; unrelated).

## Open questions

Settled on 2026-10-20 (owner's answers):

1. **"Randomised for every page"**: a fresh random pick on every page load, in the browser. The owner had no preference; the recommended reading was kept. The first frame is therefore not pre-rendered.
2. **Season source**: Belgium's date (`Europe/Brussels`) regardless of where the visitor is, with meteorological boundaries (Mar–May, Jun–Aug, Sep–Nov, Dec–Feb).
3. **Pools**: as proposed in [PLAN.md](PLAN.md), accepted unchanged.

Still open:

4. **Intensity scale and defaults**: proposed 0–100 slider mapped to opacity 0–0.6, default 30 (0.18 light), dark mode scaled up by 1.5 (capped). Numbers to be confirmed visually in Phase 2.
5. **Test-fix strategy for ESM**: three options exist (see PLAN.md Phase 0); the plan picks one but it must be proven on the branch first.
6. **Recipes in tests**: two suites read the 34 real recipe pages that only exist after a build fetches them. Make the tests fetch, skip, or ship fixtures?

## Relationship to existing precedent

- Extends the Settings panel pattern (`Settings.tsx`, `feature-toggle` event, localStorage keys) with a second control type (range) rather than inventing a new preferences mechanism.
- Reuses the idea of `seasonCalendar.ts` (month-based seasonality for Belgium) but needs only a four-season mapping, so it adds a tiny `seasons.ts` instead of extending the produce calendar.
- Builds on the preparation already on branch `ccr-162bba21-kzgz4a` (`src/components/Background/AsciiBackground.astro`, `pieces.ts`, the pinned dependency, the deploy workflow).
