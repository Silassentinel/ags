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
const targetRelPath = 'src/pages/posts/__gitignore-regression-test.md';

describe('.gitignore src/pages/posts rule', () => {
  test('.gitignore no longer uses the broken "./" relative prefix', () => {
    const gitignore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8');
    expect(gitignore).not.toContain('./src/pages/posts/*');
    expect(gitignore).toMatch(/^src\/pages\/posts\/$/m);
  });

  // RT-2026-09-06-09: this test used to `writeFileSync` a real,
  // frontmatter-less file into the tracked `src/pages/posts/` directory
  // (cleaned up only in a `finally`), so a process kill mid-test (or a
  // busy-poll observing the directory during the window) could leave a
  // stray, build-breaking file behind that `git status` can't see (the
  // directory is gitignored). `git check-ignore` is a pure pattern check —
  // it does not require the path to exist on disk — so the file never
  // needs to be created at all to verify the ignore rule matches it.
  test('a new file under src/pages/posts would be ignored by git (repro from RT-2026-07-30-03), without creating any real file', () => {
    expect(fs.existsSync(path.join(projectRoot, targetRelPath))).toBe(false);

    // git check-ignore exits 0 when the path matches an ignore rule, and
    // prints the matching rule with -v. It exits 1 for untracked, not
    // ignored paths — which was the bug being tested for here. It works
    // on a path string alone; nothing is written to disk.
    const output = execFileSync('git', ['check-ignore', '-v', targetRelPath], {
      cwd: projectRoot,
      encoding: 'utf8',
    });
    expect(output).toContain('.gitignore');
    expect(output).toContain('src/pages/posts/');

    // The real directory was never touched by this test.
    expect(fs.existsSync(path.join(projectRoot, targetRelPath))).toBe(false);
  });
});
