# Accessibility — feature request

## Original request (verbatim, Claude Code session of 2026-10-20)

> next i want you to add accessibility stuff for the impaired

Answers to the clarifying questions, same session:

> What target should the work aim for? — "WCAG 2.2 AA"
> Which areas should be in scope? — "Keyboard and focus, Screen-reader semantics"
> When a visitor's system asks for reduced motion, what should the playful features do? — "Off by default, opt-in via Settings"
> Should an automated accessibility check gate deploys? — "Yes, axe-core in the test suite"

## Problem / motivation

An audit of the built site on 2026-10-20 (axe-core 4.14 on every main page in light and dark mode, plus a keyboard walk) found that a keyboard-only or screen-reader visitor could not use parts of benjamindegryse.be: the mobile menu button was a `div` with no keyboard access or name; every button had its focus ring removed by `button { outline: none }`; the Settings panel's controls stayed focusable while the panel was closed; there was no skip link; headings jumped from H1 to H3; two navigation landmarks had no name; the Dutch seizoenskalender was declared English; blog links read "click me"; the theme button had no pressed state; a button nested a link. Two colours failed the AA contrast minimum (dates in red, grey produce counts). Chaos Mode, the marquee, the glitch effect and the Content Highlighter animated regardless of the visitor's reduced-motion setting. The ASCII backdrop already respected it.

Belgian and EU public-sector rules reference WCAG 2.1/2.2 AA through EN 301 549; a personal site is not bound by them, but AA is the recognised bar.

## Goal

The site meets WCAG 2.2 AA for keyboard operation and screen-reader semantics on every page, visitors who ask for reduced motion get the animated extras off by default with an opt-in in Settings, and an automated check keeps it that way by failing the deploy on any regression.

## Requirements

1. **Keyboard**: every interactive element is reachable and operable with the keyboard, shows a visible focus indicator, and nothing hidden is focusable. The mobile menu opens and closes from the keyboard, Escape closes it.
2. **Skip link**: the first Tab stop on every page skips the navigation and moves focus to the main content.
3. **Semantics**: one H1 per page, no skipped heading levels, named landmarks, descriptive link text, state on toggle and disclosure buttons (`aria-pressed`, `aria-expanded`), valid nesting, correct `lang` per page.
4. **Settings panel**: a named landmark whose controls are inert and hidden from assistive tech while closed; the gear button announces open/closed; Escape closes and returns focus.
5. **Reduced motion**: with `prefers-reduced-motion: reduce` and no stored choice, Content Highlighter and the ASCII backdrop start off (Chaos Mode and the Obfuscator are off by default already). The Settings panel lets the visitor turn each on; a stored choice always wins.
6. **Gate**: `npm test` builds the real site, runs axe-core (WCAG 2.x A/AA and best-practice rules) on a sample of pages in both themes and walks the keyboard; any violation fails the suite and therefore the deploy.
7. **Contrast, minimal**: only the two measured AA failures are corrected (dates, counts), because the gate cannot pass otherwise. A wider contrast review is out of scope.

## Non-goals

- A full colour-contrast and visual review (out of scope by the owner's choice; only the two gate-blocking values changed).
- Replacing or redesigning Chaos Mode, the Obfuscator or the marquee; they stay opt-in effects.
- Screen-reader testing with real assistive technology (NVDA, VoiceOver): not possible from this environment; see open questions.
- Translating the site's English UI strings into Dutch.

## Open questions

1. **Manual assistive-technology pass**: axe and the keyboard walk catch the mechanical failures; a short run with VoiceOver (iOS/macOS) or NVDA on the live site would confirm announcements read sensibly. Owner's call when.
2. **Reduced-motion defaults persist**: the Settings panel stores the resolved default on first visit, so a visitor who later turns reduced motion off at system level keeps the features off until they toggle them. Acceptable, or should an unset choice stay unset?
3. **Pull-request CI**: the gate runs on pushes to `main` only, like the rest of the suite. A `ci.yml` on pull requests is still in the backlog.
