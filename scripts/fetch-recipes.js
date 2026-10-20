/**
 * Fetches the recipes from the Silassentinel/Recipes repository into
 * src/pages/posts/ without building the site. Same code path as
 * `npm run build` (scripts/preserve-build.js), exposed on its own so the
 * test suite can run against the real recipes (`npm run fetch:recipes`
 * then `npm test`), locally and in CI.
 */

import fs from 'fs';
import path from 'path';
import { fetchRecipes } from './preserve-build.js';

const recipePostsDir = path.resolve(process.cwd(), 'src/pages/posts');
fs.mkdirSync(recipePostsDir, { recursive: true });

await fetchRecipes({
  recipePostsDir,
  recipeRepo: { owner: 'Silassentinel', name: 'Recipes', branch: 'main' },
});

const count = fs.readdirSync(recipePostsDir).filter((name) => name.endsWith('.md')).length;
console.log(`✅ ${count} recipe file(s) in ${recipePostsDir}`);
if (count === 0) process.exitCode = 1;
