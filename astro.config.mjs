import { defineConfig } from 'astro/config';
import preact from "@astrojs/preact";
// https://astro.build/config
export default defineConfig({
  site: 'https://astrogettingstarted.netlify.app.',
  base: '/',
  output: 'static',
  compressHTML: true,
  integrations: [preact()],
  outDir: "../silassentinel.github.io/"
});