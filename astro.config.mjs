import { defineConfig } from 'astro/config';
import preact from "@astrojs/preact";
// https://astro.build/config
export default defineConfig({
  site: 'https://benjamindegryse.be/',
  base: '/',
  output: 'static',
  compressHTML: true,
  integrations: [preact()],
  outDir: "../silassentinel.github.io/",
  security: {
    // Emits a per-page Content-Security-Policy <meta> tag with hashes for
    // Astro's own bundled scripts/styles (client islands). Any attacker-
    // controlled inline <script>/<style> injected via recipe markdown will
    // not match a known hash and will not have 'unsafe-inline', so it is
    // blocked by the browser. See .security/findings.md RT-2026-07-30-01.
    csp: true
  }
});