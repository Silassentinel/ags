import { defineConfig } from 'astro/config';
import preact from "@astrojs/preact";
// https://astro.build/config
export default defineConfig({
  site: 'https://astrogettingstarted.netlify.app.',
  base: '/',
<<<<<<< HEAD
  output: 'static', // Ensure static mode is used (no SSR)
  integrations: [preact(), compress()],
  outDir: "../silassentinel.github.io/",
  branch: "main",
  owner: "Silassentinel",
  recipePostsDir: "./src/pages/posts/"
=======
  output: 'static',
  compressHTML: true,
  integrations: [preact()],
  outDir: "../silassentinel.github.io/"
>>>>>>> 238b6e91f20b05ed46fe7e26a91c2da35bba35e3
});