/**
 * Regression test for RT-2026-07-30-03: the `.gitignore` rule
 * `./src/pages/posts/*` was a no-op because gitignore patterns are not
 * resolved relative to `./`, so fetched recipe content (including any XSS
 * payload from RT-2026-07-30-01) was tracked into the repo instead of
 * ignored.
 *
 * This test reproduces the red-team repro steps verbatim:
 *   git check-ignore -v src/pages/posts/bbq.md   (must now exit 0 / match)
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const projectRoot = path.resolve(__dirname, '../..');

describe('.gitignore src/pages/posts rule', () => {
  test('.gitignore no longer uses the broken "./" relative prefix', () => {
    const gitignore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8');
    expect(gitignore).not.toContain('./src/pages/posts/*');
    expect(gitignore).toMatch(/^src\/pages\/posts\/$/m);
  });

  test('a new file under src/pages/posts is now ignored by git (repro from RT-2026-07-30-03)', () => {
    const target = path.join(projectRoot, 'src/pages/posts', '__gitignore-regression-test.md');
    fs.writeFileSync(target, '# temp file for gitignore regression test\n');

    try {
      // git check-ignore exits 0 when the path matches an ignore rule, and
      // prints the matching rule with -v. It exits 1 for untracked, not
      // ignored paths — which was the bug being tested for here.
      const output = execFileSync(
        'git',
        ['check-ignore', '-v', 'src/pages/posts/__gitignore-regression-test.md'],
        { cwd: projectRoot, encoding: 'utf8' }
      );
      expect(output).toContain('.gitignore');
      expect(output).toContain('src/pages/posts/');
    } finally {
      fs.rmSync(target, { force: true });
    }
  });
});
