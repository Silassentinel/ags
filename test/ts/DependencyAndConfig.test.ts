/**
 * Regression tests for:
 *  - RT-2026-07-30-04: sharp@0.34.5 (transitive via astro) carries known
 *    libvips CVEs, fixed in >=0.35.0.
 *  - The stale `site:` RSS config (pointing at astrogettingstarted.netlify.app
 *    instead of benjamindegryse.be), found during a scan of the generated
 *    build output.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const projectRoot = path.resolve(__dirname, '../..');

describe('sharp dependency version (RT-2026-07-30-04)', () => {
  test('package.json overrides sharp to a version without the libvips CVEs', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    expect(pkg.overrides?.sharp).toBeDefined();
  });

  test('the installed sharp version actually resolves to >=0.35.0', () => {
    const output = execSync('npm ls sharp --json', { cwd: projectRoot, encoding: 'utf8' });
    const parsed = JSON.parse(output);
    const sharpVersion = parsed.dependencies?.astro?.dependencies?.sharp?.version;
    expect(sharpVersion).toBeDefined();

    const [major, minor] = sharpVersion.split('.').map(Number);
    const isPatched = major > 0 || (major === 0 && minor >= 35);
    expect(isPatched).toBe(true);
  });
});

describe('astro.config.mjs site URL', () => {
  test('site points at the real production domain, not the stale Netlify placeholder', () => {
    const config = fs.readFileSync(path.join(projectRoot, 'astro.config.mjs'), 'utf8');
    expect(config).not.toContain('astrogettingstarted.netlify.app');
    expect(config).toMatch(/site:\s*['"]https:\/\/benjamindegryse\.be\/?['"]/);
  });

  test('a Content-Security-Policy is enabled for the built site (RT-2026-07-30-01)', () => {
    const config = fs.readFileSync(path.join(projectRoot, 'astro.config.mjs'), 'utf8');
    expect(config).toMatch(/csp:\s*true/);
  });
});
