/**
 * @jest-environment node
 *
 * Accessibility gate (WCAG 2.2 AA): builds the real site with the production
 * config into a scratch directory, serves it, and runs axe-core in headless
 * Chromium on a sample of pages in light and dark mode. Any violation fails
 * the suite, and therefore the deploy (see .github/workflows/deploy.yml).
 *
 * Also walks the keyboard: the skip link must be the first stop and every
 * control reached by Tab must show a visible focus ring, and the Settings
 * panel's controls must be unreachable while the panel is closed.
 *
 * Playwright's bypassCSP is used so the injected axe script can run inside
 * the site's strict Content Security Policy; nothing else about the pages is
 * changed. Chromium comes from `npx playwright install chromium`, or from
 * PLAYWRIGHT_BROWSERS_PATH when the environment already provides one.
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import type { AddressInfo } from 'net';
import { chromium, type Browser } from 'playwright';

const projectRoot = path.resolve(__dirname, '../..');
const axeSource = fs.readFileSync(path.join(projectRoot, 'node_modules/axe-core/axe.min.js'), 'utf8');

// Pages that exist without the fetched recipes; a recipe page is added when present.
const PAGES = ['/', '/blog/', '/repos/', '/tags/', '/seizoenskalender/'];
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

/** Serves a static directory the way GitHub Pages does (directory index.html). */
function serve(dir: string): Promise<http.Server> {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let file = path.join(dir, decodeURIComponent(url.pathname));
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

describe('accessibility (WCAG 2.2 AA via axe-core, keyboard walk)', () => {
  jest.setTimeout(180000);

  let outDir: string;
  let configPath: string;
  let server: http.Server;
  let base: string;
  let browser: Browser;
  let pages: string[];

  beforeAll(async () => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ags-a11y-build-'));
    const configName = 'astro.config.a11y-test.mjs';
    configPath = path.join(projectRoot, configName);
    // The real config, built into the scratch directory instead of the deploy repo
    const config = fs
      .readFileSync(path.join(projectRoot, 'astro.config.mjs'), 'utf8')
      .replace(/outDir:\s*"[^"]*"/, `outDir: ${JSON.stringify(outDir)}`);
    if (!config.includes(outDir)) throw new Error('could not point astro.config.mjs at the scratch outDir');
    fs.writeFileSync(configPath, config);
    execFileSync(path.join(projectRoot, 'node_modules/.bin/astro'), ['build', '--config', configName], {
      cwd: projectRoot,
      stdio: 'pipe',
    });

    pages = [...PAGES];
    const posts = path.join(outDir, 'posts');
    if (fs.existsSync(posts)) {
      const first = fs.readdirSync(posts).find((name) => fs.existsSync(path.join(posts, name, 'index.html')));
      if (first) pages.push(`/posts/${first}/`);
    }

    server = await serve(outDir);
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    await browser?.close();
    server?.close();
    fs.rmSync(configPath, { force: true });
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  const open = async (page: string, dark: boolean) => {
    const context = await browser.newContext({ viewport: { width: 1200, height: 800 }, bypassCSP: true });
    const tab = await context.newPage();
    const response = await tab.goto(base + page, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    if (dark) await tab.evaluate(() => document.documentElement.classList.add('dark'));
    await tab.waitForTimeout(300);
    return { context, tab };
  };

  test.each([false, true])('every sampled page has no axe violations (dark mode: %s)', async (dark) => {
    const failures: string[] = [];
    for (const page of pages) {
      const { context, tab } = await open(page, dark);
      await tab.addScriptTag({ content: axeSource });
      const violations = await tab.evaluate(async (tags) => {
        const results = await (window as any).axe.run(document, { runOnly: { type: 'tag', values: tags } });
        return results.violations.map((v: any) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.slice(0, 3).map((n: any) => n.target.join(' ')),
        }));
      }, AXE_TAGS);
      for (const v of violations) failures.push(`${page}: ${v.id} [${v.impact}] ${v.help} -> ${v.nodes.join(' | ')}`);
      await context.close();
    }
    expect(failures).toEqual([]);
  });

  test('the skip link is the first Tab stop and moves focus to the main content', async () => {
    const { context, tab } = await open('/', false);
    await tab.keyboard.press('Tab');
    expect(await tab.evaluate(() => document.activeElement?.className)).toBe('skip-link');
    await tab.keyboard.press('Enter');
    expect(await tab.evaluate(() => document.activeElement?.id)).toBe('main');
    await context.close();
  });

  test('every control reached with Tab shows a visible focus ring, and the closed Settings panel is skipped', async () => {
    const { context, tab } = await open('/', false);
    const stops: { name: string; outline: string; inSettingsPanel: boolean }[] = [];
    for (let i = 0; i < 40; i++) {
      await tab.keyboard.press('Tab');
      const stop = await tab.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const cs = getComputedStyle(el);
        return {
          name: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} ${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}`,
          outline: `${cs.outlineStyle} ${cs.outlineWidth}`,
          inSettingsPanel: !!el.closest('#settings-panel'),
          isBody: el === document.body,
        };
      });
      if (stop.isBody) break; // wrapped around
      stops.push(stop);
    }
    expect(stops.length).toBeGreaterThan(5);
    const withoutRing = stops.filter((s) => s.outline.startsWith('none') || s.outline.endsWith(' 0px'));
    expect(withoutRing).toEqual([]);
    expect(stops.filter((s) => s.inSettingsPanel)).toEqual([]);
    await context.close();
  });

  test('the hamburger menu is a button that opens the navigation with the keyboard and closes on Escape', async () => {
    const context = await browser.newContext({ viewport: { width: 400, height: 800 }, bypassCSP: true });
    const tab = await context.newPage();
    await tab.goto(base + '/', { waitUntil: 'networkidle' });
    const hamburger = tab.locator('button.hamburger');
    const expanded = () => hamburger.getAttribute('aria-expanded');
    expect(await expanded()).toBe('false');
    await hamburger.focus();
    await tab.keyboard.press('Enter');
    expect(await expanded()).toBe('true');
    expect(await tab.locator('#nav-links').evaluate((el) => getComputedStyle(el).display)).not.toBe('none');
    await tab.keyboard.press('Escape');
    expect(await expanded()).toBe('false');
    expect(await tab.evaluate(() => document.activeElement?.className)).toBe('hamburger');
    await context.close();
  });
});
