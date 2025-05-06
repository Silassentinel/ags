import { defineConfig } from 'astro/config';
import preact from "@astrojs/preact";
import compress from "astro-compress";

// https://astro.build/config
export default defineConfig({
  site: 'https://astrogettingstarted.netlify.app.',
  base: '/',
  integrations: [preact(), compress()],
  outDir: "../silassentinel.github.io/"
});