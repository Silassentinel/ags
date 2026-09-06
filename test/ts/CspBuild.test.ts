/**
 * End-to-end regression test for RT-2026-07-30-01's CSP remediation: builds
 * the real site (via the real astro binary, not npm run build, to avoid
 * touching the deploy repo) into a scratch output directory and asserts the
 * emitted HTML carries a Content-Security-Policy meta tag that would block
 * an attacker-injected inline <script> (no 'unsafe-inline', and a payload's
 * hash will never match the allow-listed hashes of Astro's own bundled
 * scripts).
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const projectRoot = path.resolve(__dirname, '../..');

describe('Content-Security-Policy is emitted in the built output', () => {
  jest.setTimeout(60000);

  let scratchOutDir: string;
  let scratchConfigPath: string;
  const scratchConfigName = 'astro.config.csp-regression-test.mjs';

  beforeAll(() => {
    // Defensive cleanup: an unrelated, pre-existing placeholder test
    // (test/ts/RecipeFetcher.test.ts) writes a real, frontmatter-less
    // src/pages/posts/test-recipe.md as a side effect when it runs in the
    // same suite. That file is unrelated to this fix; remove it so this
    // real `astro build` isn't broken by that pre-existing test-pollution
    // bug (out of scope for this security fix — noted separately).
    fs.rmSync(path.join(projectRoot, 'src/pages/posts/test-recipe.md'), { force: true });

    scratchOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ags-csp-build-'));
    scratchConfigPath = path.join(projectRoot, scratchConfigName);

    fs.writeFileSync(
      scratchConfigPath,
      `import { defineConfig } from 'astro/config';\n` +
        `import preact from '@astrojs/preact';\n` +
        `export default defineConfig({\n` +
        `  site: 'https://benjamindegryse.be/',\n` +
        `  base: '/',\n` +
        `  output: 'static',\n` +
        `  compressHTML: true,\n` +
        `  integrations: [preact()],\n` +
        `  outDir: ${JSON.stringify(scratchOutDir)},\n` +
        `  security: { csp: true }\n` +
        `});\n`
    );

    // astro's --config resolution joins `root` with the given configFile
    // path segment-wise, so an absolute path here would resolve incorrectly;
    // pass the filename relative to `cwd` (projectRoot) instead.
    execFileSync(
      path.join(projectRoot, 'node_modules/.bin/astro'),
      ['build', '--config', scratchConfigName],
      { cwd: projectRoot, stdio: 'pipe' }
    );
  });

  afterAll(() => {
    fs.rmSync(scratchConfigPath, { force: true });
    fs.rmSync(scratchOutDir, { recursive: true, force: true });
  });

  test('homepage ships a script-src CSP with no unsafe-inline', () => {
    const html = fs.readFileSync(path.join(scratchOutDir, 'index.html'), 'utf8');
    const match = html.match(/<meta http-equiv="content-security-policy"[^>]*content="([^"]*)"/i);

    expect(match).not.toBeNull();
    const cspContent = match![1];
    expect(cspContent).toContain("script-src 'self'");
    expect(cspContent).not.toContain('unsafe-inline');
  });
});
