import { defineConfig } from 'astro/config';

import preact from "@astrojs/preact";

// https://astro.build/config
export default defineConfig({
  site: 'https://astrogettingstarted.netlify.app/',
  integrations: [preact()],
  ourDir: "../silassentinel.github.io"
});