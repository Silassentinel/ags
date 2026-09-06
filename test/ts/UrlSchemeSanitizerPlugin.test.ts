/**
 * Tests for scripts/sanitize-url-schemes.mjs — the AST-level (Sätteri
 * hastPlugins) replacement for the removed markdown-source regex sanitizer.
 *
 * See .security/findings.md:
 *  - RT-2026-07-30-01 / RT-2026-09-06-01: markdown-native `javascript:`/
 *    `data:` link & image destinations as a stored-XSS vector.
 *  - RT-2026-09-06-04: bypasses of the markdown-source regex sanitizer
 *    (backslash-escaped colons, uppercase hex character references,
 *    reference definitions nested in blockquotes/list items, escaped-`]`
 *    reference labels) — this plugin closes all of them structurally by
 *    operating on the already-parsed HTML AST instead of markdown source.
 *  - RT-2026-09-06-05: quadratic-time build DoS in the removed regex —
 *    closed as a side effect of removing the regex entirely (covered in
 *    test/ts/PreserveBuild.test.ts).
 *
 * scripts/sanitize-url-schemes.mjs is a plain ESM .mjs file, consistent
 * with how scripts/preserve-build.js is tested elsewhere in this suite:
 * unit tests run the real module via a Node subprocess, and the end-to-end
 * tests exercise the real @astrojs/markdown-satteri renderer / a real
 * `astro build` (mirroring test/ts/CspBuild.test.ts), not a re-implementation.
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const projectRoot = path.resolve(__dirname, '../..');
const pluginPath = path.join(projectRoot, 'scripts/sanitize-url-schemes.mjs');

/** Runs a small ESM snippet and returns its last line of JSON output. */
function runSnippet(code: string): any {
  const output = execFileSync('node', ['--input-type=module', '-e', code], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  const lastLine = output.trim().split('\n').pop() as string;
  return JSON.parse(lastLine);
}

describe('isSafeElementUrl', () => {
  const safe = [
    'https://example.com/page',
    'http://example.com/page',
    'mailto:a@b.com',
    './other-post',
    '../other-post',
    '#section',
    'image.png',
    '',
  ];
  const unsafe = [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'vbscript:alert(1)',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
  ];

  test.each(safe)('treats %s as safe', (url) => {
    const result = runSnippet(`
      import { isSafeElementUrl } from ${JSON.stringify(pluginPath)};
      console.log(JSON.stringify({ safe: isSafeElementUrl(${JSON.stringify(url)}) }));
    `);
    expect(result.safe).toBe(true);
  });

  test.each(unsafe)('treats %s as unsafe', (url) => {
    const result = runSnippet(`
      import { isSafeElementUrl } from ${JSON.stringify(pluginPath)};
      console.log(JSON.stringify({ safe: isSafeElementUrl(${JSON.stringify(url)}) }));
    `);
    expect(result.safe).toBe(false);
  });
});

describe('createUrlSchemeSanitizerPlugin via a real @astrojs/markdown-satteri render', () => {
  /**
   * Renders `markdown` through the real production markdown engine with
   * the real plugin wired in exactly as astro.config.mjs does, and returns
   * the HTML. This exercises the actual parser (so escapes/entities/
   * references are resolved by CommonMark, not approximated) and the
   * actual plugin (not a re-implementation).
   */
  function renderWithPlugin(markdown: string): string {
    const output = execFileSync(
      'node',
      [
        '--input-type=module',
        '-e',
        `
        import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
        import { createUrlSchemeSanitizerPlugin } from ${JSON.stringify(pluginPath)};
        const processor = await createSatteriMarkdownProcessor({
          hastPlugins: [createUrlSchemeSanitizerPlugin],
        });
        const rendered = await processor.render(${JSON.stringify(markdown)});
        console.log(JSON.stringify({ html: rendered.code }));
        `,
      ],
      { cwd: projectRoot, encoding: 'utf8' }
    );
    return JSON.parse(output.trim().split('\n').pop() as string).html;
  }

  // Original RT-2026-07-30-01 / RT-2026-09-06-01 payloads.
  const originalPayloads: Array<[string, string]> = [
    ['plain javascript: link', '[CLICK-ME-JSURI](javascript:alert(document.domain))'],
    ['javascript: image', '![imgjsuri](javascript:alert(1))'],
    ['entity-obfuscated javascript: (lowercase hex)', "[jsuri-obfuscated](java&#115;cript:alert('obf'))"],
    ['data: URI', '[datauri](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)'],
    ['reference-style definition', '[refstyle-def][1]\n\n[1]: javascript:alert(1)'],
  ];

  // RT-2026-09-06-04 bypasses of the old markdown-source regex sanitizer —
  // the whole point of moving to an AST-level plugin is that these no
  // longer need special-casing at all: the parser has already resolved
  // them into a plain href/src by the time our plugin runs.
  const bypassPayloads: Array<[string, string]> = [
    ['backslash-escaped colon (link)', '[BYPASS-1](javascript\\:alert(1))'],
    ['backslash-escaped colon (image)', '![BYPASS-2](javascript\\:alert(1))'],
    ['uppercase-X hex character reference', '[BYPASS-3](&#X6A;avascript:alert(1))'],
    [
      'reference definition nested inside a blockquote',
      '> [bq]: javascript:alert(1)\n\n[BYPASS-4][bq]',
    ],
    [
      'reference label containing an escaped ]',
      '[a\\]b]: javascript:alert(1)\n\n[BYPASS-5][a\\]b]',
    ],
    ['backslash-escaped colon data: URI', '[BYPASS-6](data\\:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)'],
  ];

  test.each([...originalPayloads, ...bypassPayloads])('%s renders with no live javascript:/data: href or src', (_label, payload) => {
    const html = renderWithPlugin(payload);
    expect(html).not.toMatch(/href="javascript:/i);
    expect(html).not.toMatch(/src="javascript:/i);
    expect(html).not.toMatch(/href="data:/i);
    expect(html).not.toMatch(/src="data:/i);
  });

  test('does not alter safe schemes (http/https/mailto) or relative/anchor links', () => {
    const safe =
      '[normal](https://example.com/page)\n\n' +
      '[secure](http://example.com/page)\n\n' +
      '[email](mailto:a@b.com)\n\n' +
      '[relative](./other-post)\n\n' +
      '[anchor](#section)\n';
    const html = renderWithPlugin(safe);
    expect(html).toContain('href="https://example.com/page"');
    expect(html).toContain('href="http://example.com/page"');
    expect(html).toContain('href="mailto:a@b.com"');
    expect(html).toContain('href="./other-post"');
    expect(html).toContain('href="#section"');
    expect(html).not.toContain('#blocked-by-sanitizer');
  });
});

describe('end-to-end: a real `astro build` blocks every bypass payload (RT-2026-09-06-04 / RT-2026-09-06-05)', () => {
  // RT-2026-09-06-07: this suite used to write a real
  // src/pages/posts/URL-SANITIZER-PLUGIN-TEST-TEMP.md into the tracked
  // (albeit gitignored) source tree and only removed it in `afterAll` — if
  // the process were killed mid-build, the file would survive, `git
  // status` would show nothing (RT-2026-07-30-03 made the directory
  // untracked), and the next real `npm run build` would publish it. Instead
  // of touching the real posts directory at all, build an isolated,
  // throwaway copy of the whole project (root override, matching the
  // pattern in test/ts/PreserveBuild.test.ts's end-to-end suite) with the
  // test post written only inside that copy, so there is nothing to leak
  // into the real tree even under a hard kill.
  jest.setTimeout(60000);

  const tempPostName = 'URL-SANITIZER-PLUGIN-TEST-TEMP.md';
  const realPostsDir = path.join(projectRoot, 'src/pages/posts');
  let scratchProjectDir: string;
  let scratchOutDir: string;

  const body = [
    '[BYPASS-1-backslash](javascript\\:alert(document.domain))',
    '',
    '![BYPASS-2-img](javascript\\:alert(1))',
    '',
    '[BYPASS-3-upperX](&#X6A;avascript:alert(document.domain))',
    '',
    '> [bq]: javascript:alert(document.domain)',
    '',
    '[BYPASS-4-blockquote-ref][bq]',
    '',
    '[a\\]b]: javascript:alert(document.domain)',
    '',
    '[BYPASS-5-esclabel][a\\]b]',
    '',
    '[BYPASS-6-data](data\\:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
    '',
    '[BYPASS-7-safe](https://example.com/page)',
    '',
  ].join('\n');

  const frontmatter =
    '---\n' +
    'layout: ../../layout/Post/MarkdownPostLayout.astro\n' +
    "title: 'URL Sanitizer Plugin Test'\n" +
    "pubDate: '2026-09-06'\n" +
    "description: 'test'\n" +
    "author: 'test'\n" +
    'tags: ["BBQ"]\n' +
    '---\n\n';

  beforeAll(() => {
    // Build a fully isolated, throwaway copy of the project: its own root
    // (so `.astro` cache / `srcDir` / `outDir` all resolve underneath it,
    // rather than mixing an out-of-root srcDir into the real root — the
    // latter breaks Astro's Vite integration with an unrelated "No cached
    // compile metadata found" error), with `node_modules` symlinked to
    // avoid duplicating it. The real src/pages/posts/ is only ever *read*
    // (copied), never written to.
    scratchProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ags-url-sanitizer-root-'));
    fs.cpSync(path.join(projectRoot, 'src'), path.join(scratchProjectDir, 'src'), {
      recursive: true,
    });
    if (fs.existsSync(path.join(projectRoot, 'public'))) {
      fs.cpSync(path.join(projectRoot, 'public'), path.join(scratchProjectDir, 'public'), {
        recursive: true,
      });
    }
    fs.symlinkSync(
      path.join(projectRoot, 'node_modules'),
      path.join(scratchProjectDir, 'node_modules'),
      'dir'
    );
    fs.copyFileSync(
      path.join(projectRoot, 'package.json'),
      path.join(scratchProjectDir, 'package.json')
    );
    fs.copyFileSync(
      path.join(projectRoot, 'tsconfig.json'),
      path.join(scratchProjectDir, 'tsconfig.json')
    );

    // Defensive cleanup of the copy (mirrors the pre-existing
    // test-recipe.md defensive cleanup pattern used elsewhere in this
    // suite): a stale test-recipe.md must not break this build either.
    fs.rmSync(path.join(scratchProjectDir, 'src/pages/posts/test-recipe.md'), { force: true });

    fs.writeFileSync(
      path.join(scratchProjectDir, 'src/pages/posts', tempPostName),
      frontmatter + body
    );

    scratchOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ags-url-sanitizer-build-'));

    // Config lives inside the scratch project root, but points back at the
    // real scripts/sanitize-url-schemes.mjs via an absolute path (rather
    // than copying scripts/ too) — otherwise identical to astro.config.mjs.
    fs.writeFileSync(
      path.join(scratchProjectDir, 'astro.config.mjs'),
      `import { defineConfig } from 'astro/config';\n` +
        `import preact from '@astrojs/preact';\n` +
        `import { satteri } from '@astrojs/markdown-satteri';\n` +
        `import { createUrlSchemeSanitizerPlugin } from ${JSON.stringify(pluginPath)};\n` +
        `export default defineConfig({\n` +
        `  site: 'https://benjamindegryse.be/',\n` +
        `  base: '/',\n` +
        `  output: 'static',\n` +
        `  compressHTML: true,\n` +
        `  integrations: [preact()],\n` +
        `  outDir: ${JSON.stringify(scratchOutDir)},\n` +
        `  markdown: { processor: satteri({ hastPlugins: [createUrlSchemeSanitizerPlugin] }) },\n` +
        `  security: { csp: true }\n` +
        `});\n`
    );

    execFileSync(path.join(projectRoot, 'node_modules/.bin/astro'), ['build'], {
      cwd: scratchProjectDir,
      stdio: 'pipe',
    });
  });

  afterAll(() => {
    fs.rmSync(scratchProjectDir, { recursive: true, force: true });
    fs.rmSync(scratchOutDir, { recursive: true, force: true });
  });

  test('the real src/pages/posts/ directory was never written to', () => {
    expect(fs.existsSync(path.join(realPostsDir, tempPostName))).toBe(false);
  });

  test('the built page contains no live javascript:/data: href or src', () => {
    const html = fs.readFileSync(
      path.join(scratchOutDir, 'posts/URL-SANITIZER-PLUGIN-TEST-TEMP/index.html'),
      'utf8'
    );
    expect(html).not.toMatch(/href="javascript:/i);
    expect(html).not.toMatch(/src="javascript:/i);
    expect(html).not.toMatch(/href="data:/i);
    expect(html).toContain('#blocked-by-sanitizer');
    expect(html).toContain('href="https://example.com/page"');
  });

  test('none of the 34 real recipe pages were altered (zero false positives)', () => {
    const postsDir = path.join(scratchOutDir, 'posts');
    const realRecipeDirs = fs
      .readdirSync(postsDir)
      .filter((name) => name !== 'URL-SANITIZER-PLUGIN-TEST-TEMP');
    expect(realRecipeDirs.length).toBeGreaterThan(0);
    for (const dir of realRecipeDirs) {
      const html = fs.readFileSync(path.join(postsDir, dir, 'index.html'), 'utf8');
      expect(html).not.toContain('#blocked-by-sanitizer');
    }
  });
});
