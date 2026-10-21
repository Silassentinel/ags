# Deploying benjamindegryse.be

The site is built from this repository and served by GitHub Pages from
[Silassentinel/silassentinel.github.io](https://github.com/Silassentinel/silassentinel.github.io)
(branch `main`, custom domain in `CNAME`). The build output is committed to
that repository; this repository only holds the source.

## Automatic deploy

`.github/workflows/deploy.yml` runs on every push to `main` (and by hand via
*Actions → Deploy site → Run workflow*). It:

1. checks out this repository into `ags/` and the deploy repository into
   `silassentinel.github.io/` next to it, the layout `astro.config.mjs`
   expects (`outDir: "../silassentinel.github.io/"`);
2. runs `npm ci` (after the `test` job passed);
3. runs `npm run build` (`scripts/preserve-build.js`), which fetches the
   recipes, builds with Astro and keeps the deploy checkout's `.git`,
   `CNAME` and `.nojekyll`;
4. commits the result as `github-actions[bot]` and pushes it to `main` of the
   deploy repository. Nothing is pushed when the output did not change.

Deploys never overlap: a second push waits for the running deploy.

A separate `test` job installs headless Chromium (`npx playwright install
--with-deps chromium`, for the accessibility gate in
`test/ts/Accessibility.test.ts`), runs `npm run fetch:recipes` (so the
recipe-dependent tests have the real recipes) and `npm run test:ci` on the
same push. The
deploy job `needs` it: a red suite blocks the deploy. The suite was fixed on
2026-10-20 (it had been red on `main`, 21 of 30 suites); locally it is green
three runs in a row with the two recipe-dependent tests skipped, since they
only run once `npm run fetch:recipes` has populated `src/pages/posts/`.

## One-time setup: the `DEPLOY_TOKEN` secret

The workflow's own `GITHUB_TOKEN` cannot push to another repository, so it
needs a token you create:

1. GitHub → *Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token*.
2. Resource owner: your account. Repository access: **only**
   `silassentinel.github.io`. Permissions: *Contents: Read and write*
   (nothing else). Set an expiry and note it; the deploy stops when it
   expires.
3. In **this** repository: *Settings → Secrets and variables → Actions →
   New repository secret*, name `DEPLOY_TOKEN`, paste the token.

Rotate it by generating a new token and updating the secret; revoke the old
one afterwards.

## Security notes

- The token is scoped to one repository and one permission. It is never
  written to the checkout of this repository (`persist-credentials: false`).
- The workflow itself has `contents: read` only; the push uses the
  `DEPLOY_TOKEN` credential stored by the deploy-repo checkout.
- The recipes are still fetched from `Silassentinel/Recipes` at build time
  and sanitised by `scripts/sanitize-url-schemes.mjs` plus the CSP; see
  `.security/findings.md`. The build now sends the runner's `GITHUB_TOKEN`
  on those API calls to avoid the unauthenticated rate limit.

## Manual deploy (as before)

Clone the deploy repository next to this one as `silassentinel.github.io`,
then `npm run build` and push from that directory.
