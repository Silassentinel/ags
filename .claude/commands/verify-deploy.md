---
description: Verify the live site matches the local build — compare assets, test features in-browser, and check for regressions. Run after every deploy.
allowed-tools: [Bash, Read, Agent, mcp__Claude_Browser__preview_start, mcp__Claude_Browser__navigate, mcp__Claude_Browser__computer, mcp__Claude_Browser__read_page, mcp__Claude_Browser__javascript_tool, mcp__Claude_Browser__read_console_messages, mcp__Claude_Browser__read_network_requests, mcp__Claude_Browser__resize_window, mcp__Claude_Browser__tabs_context, mcp__Claude_Browser__tabs_create, mcp__Claude_Browser__tabs_select, mcp__Claude_Browser__find, mcp__Claude_Browser__form_input, mcp__Claude_Browser__get_page_text]
---

# Verify Deploy

Verify the live website at https://benjamindegryse.be matches the local build from the ags repo.

## Step 1: Asset integrity

Compare the JS/CSS asset hashes referenced in the local build output (`../silassentinel.github.io/index.html`) against what the live site actually serves. Every `_astro/*.js` and `_astro/*.css` referenced in `index.html` must return HTTP 200 from the live domain. Report any 404s or mismatches.

```bash
# Extract asset refs from local build
grep -o '_astro/[A-Za-z0-9_.-]*\.\(js\|css\)' ../silassentinel.github.io/index.html | sort -u

# Check each one against live
for f in $(grep -o '_astro/[A-Za-z0-9_.-]*\.\(js\|css\)' ../silassentinel.github.io/index.html | sort -u); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://benjamindegryse.be/$f")
  echo "$code $f"
done
```

## Step 2: Open the live site in the browser

Open https://benjamindegryse.be in the Browser pane. Clear localStorage first to get a fresh state.

Check for:
- Console errors (read_console_messages with onlyErrors)
- Failed network requests (read_network_requests)
- Page renders with full styling (screenshot — should show dark brutalist theme, not unstyled HTML)

## Step 3: Feature smoke tests

Test these interactive features on the live site:

### Navigation
- Click each nav link (Home, About, Repos, Blog, Tags) and verify the page loads without errors

### ChaosMode easter egg
- Click 5+ times on a non-link area — chaos-mode class should appear on body, theme should flip
- Click 25+ times — ultra-chaos-mode class should appear, page should skew

### Settings panel
- The gear icon (bottom-right) should be present and clickable
- Toggling features should persist in localStorage

### Greeting
- "NEW GREETING" button should cycle greetings

## Step 4: Mobile verification

Resize the browser to mobile (375x812) and repeat:
- Page should be responsive (no horizontal overflow)
- Navigation should collapse to hamburger menu
- ChaosMode should respond to taps (touch events)

## Step 5: Compare with local dev server

Start the local dev server (`npm run dev` in the ags directory) and open it in a second browser tab. Visually compare key pages (Home, About, Blog) between local and live — they should be identical in structure and styling.

## Step 6: Report

Summarize findings as a checklist:
- [ ] All assets serve HTTP 200
- [ ] No console errors
- [ ] No failed network requests
- [ ] Full styling renders (dark theme, brutalist layout)
- [ ] Navigation works across all pages
- [ ] ChaosMode triggers at correct click thresholds
- [ ] Settings panel renders and toggles persist
- [ ] Mobile layout is responsive
- [ ] Touch events work for ChaosMode on mobile viewport
- [ ] Local and live versions match
