import { defineConfig } from 'astro/config';
import preact from "@astrojs/preact";
import { satteri } from '@astrojs/markdown-satteri';
import { createUrlSchemeSanitizerPlugin } from './scripts/sanitize-url-schemes.mjs';
// https://astro.build/config
export default defineConfig({
  site: 'https://benjamindegryse.be/',
  base: '/',
  output: 'static',
  compressHTML: true,
  integrations: [preact()],
  outDir: "../silassentinel.github.io/",
  markdown: {
    // Sätteri (the default Markdown processor as of this Astro version) has
    // its own `hastPlugins` extension point rather than the legacy
    // remark/rehype `markdown.rehypePlugins` config key — that key is only
    // wired up when `@astrojs/markdown-remark` (a separate, non-default
    // processor) is installed, and setting it without that package throws
    // at config-validation time. `createUrlSchemeSanitizerPlugin` walks the
    // parsed HTML AST for every recipe and neutralises `javascript:`/`data:`
    // etc. link/image destinations after Sätteri has already resolved all
    // markdown escapes/entities/references. See scripts/sanitize-url-schemes.mjs
    // and .security/findings.md RT-2026-09-06-04 / RT-2026-09-06-05.
    processor: satteri({ hastPlugins: [createUrlSchemeSanitizerPlugin] }),
  },
  security: {
    // Emits a per-page Content-Security-Policy <meta> tag with hashes for
    // Astro's own bundled scripts/styles (client islands). Any attacker-
    // controlled inline <script>/<style> injected via recipe markdown will
    // not match a known hash and will not have 'unsafe-inline', so it is
    // blocked by the browser. See .security/findings.md RT-2026-07-30-01.
    csp: true
  }
});