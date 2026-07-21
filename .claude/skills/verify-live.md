---
name: verify-live
description: This skill MUST be used whenever UI changes are made, a build is deployed, features are added or modified, or any frontend code is changed. Enforces live-site verification against benjamindegryse.be and requires UI tests for any new interactive feature.
---

# Live Verification & UI Testing Policy

## Rule 1: Always verify against the live site

After ANY deploy to silassentinel.github.io, you MUST:

1. Open https://benjamindegryse.be in the Browser pane
2. Confirm all `_astro/` assets return HTTP 200 (not 404)
3. Check the browser console for errors
4. Check network requests for failures
5. Take a screenshot and confirm the page renders with full styling
6. Test the specific feature that was changed

Never report a deploy as "done" based solely on `git push` succeeding. GitHub Pages can silently break (Jekyll dropping `_astro/`, cache staleness, CNAME misconfiguration). The live site is the source of truth.

## Rule 2: Compare local and live

When verifying, always compare the local build against the live site:
- Asset hashes in `index.html` must match between local and live
- Visual rendering should be identical
- Interactive features must behave the same way

Use `/verify-deploy` to run the full verification checklist.

## Rule 3: UI tests are required for interactive features

Any new or modified interactive feature (click handlers, touch events, animations, toggles, form inputs) MUST have corresponding UI tests.

### Test framework: Playwright

The project should use Playwright for UI tests. Test files live in `tests/e2e/`.

### What to test

For every interactive feature, write tests that cover:
- **Golden path**: the feature works as intended
- **Edge cases**: boundary conditions, rapid interactions, state persistence
- **Mobile**: touch equivalents of mouse interactions
- **Cross-page**: features that persist across navigation (e.g. localStorage state)

### Example test structure

```typescript
// tests/e2e/chaos-mode.spec.ts
import { test, expect } from '@playwright/test';

test.describe('ChaosMode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('activates after 5 clicks', async ({ page }) => {
    for (let i = 0; i < 6; i++) {
      await page.click('body', { position: { x: 400, y: 400 } });
    }
    const bodyClass = await page.evaluate(() => document.body.className);
    expect(bodyClass).toContain('chaos-mode');
  });

  test('activates ultra chaos after 25 clicks', async ({ page }) => {
    for (let i = 0; i < 26; i++) {
      await page.click('body', { position: { x: 400, y: 400 } });
    }
    const bodyClass = await page.evaluate(() => document.body.className);
    expect(bodyClass).toContain('ultra-chaos-mode');
  });

  test('persists click count in localStorage', async ({ page }) => {
    await page.click('body', { position: { x: 400, y: 400 } });
    const count = await page.evaluate(() => localStorage.getItem('chaosClickCount'));
    expect(Number(count)).toBeGreaterThan(0);
  });
});
```

### When to write tests

- Adding a new interactive feature: write tests before reporting the feature as complete
- Fixing a bug in an interactive feature: write a regression test that reproduces the bug
- Modifying an existing feature: update existing tests to match new behavior

### When to skip tests

- Pure content changes (adding/editing markdown recipes)
- CSS-only changes with no interactive behavior
- Dependency bumps (covered by build verification)

## Enforcement

If you complete a UI change without live verification or without adding/updating UI tests for interactive features, flag it explicitly: "WARNING: This change has not been verified on the live site" or "WARNING: No UI tests were added for this interactive feature."
