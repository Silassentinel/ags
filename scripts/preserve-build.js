/**
 * Custom build script that preserves specific files during the Astro build process
 * This script ensures that the .git directory and CNAME file are not deleted
 * when building to a separate repository
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import matter from 'gray-matter';

/**
 * Initialize configuration and constants
 * @returns {Object} Configuration object with paths and settings
 */
async function initializeConfig() {
  const config = await import('../astro.config.mjs');
  
  return {
    outputDir: path.resolve(process.cwd(), config.default.outDir),
    tempDir: path.resolve(process.cwd(), '.temp-preserve'),
    recipePostsDir: path.resolve(process.cwd(), 'src/pages/posts'),
    publicDataDir: path.resolve(process.cwd(), 'public/data'),
    itemsToPreserve: ['.git', 'CNAME', '.nojekyll'],
    directoriesToExclude: ['scripts'], // Exclude scripts directory as it's only for local development
    recipeRepo: {
      owner: 'Silassentinel',
      name: 'Recipes',
      branch: 'main'
    }
  };
}

/**
 * Create required directories if they don't exist
 * @param {Object} config Configuration object with paths
 */
function createRequiredDirectories(config) {
  const { tempDir, recipePostsDir } = config;
  
  console.log(`🔍 Output directory: ${config.outputDir}`);
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Create recipe posts directory if it doesn't exist
  if (!fs.existsSync(recipePostsDir)) {
    fs.mkdirSync(recipePostsDir, { recursive: true });
  }
}

/**
 * Fetch repositories list from GitHub API
 * @param {Object} repoConfig Repository configuration
 * @returns {Array} List of files from the repository
 */
async function fetchRepositoryContents(repoConfig) {
  const { owner, name, branch } = repoConfig;
  const repoUrl = `https://api.github.com/repos/${owner}/${name}/contents?ref=${branch}`;
  
  const response = await fetch(repoUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch repository contents: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Filter for markdown recipe files
 * @param {Array} contents Repository contents
 * @returns {Array} Filtered markdown files
 */
function filterRecipeFiles(contents) {
  return contents.filter((file) => 
    file.type === 'file' && 
    file.name.endsWith('.md') && 
    file.name !== '1ATEMPLATE.MD' && 
    file.name !== 'README.md' &&
    file.name !== "test-recipe.md" // Exclude test recipe file
  );
}

/**
 * Fetch a single recipe file content
 * @param {Object} file File info object
 * @param {Object} repoConfig Repository configuration
 * @returns {String} File content
 */
async function fetchRecipeContent(file, repoConfig) {
  const { owner, name, branch } = repoConfig;
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${file.name}`;
  
  console.log(`📥 Fetching recipe: ${file.name} from ${rawUrl}`);
  
  const rawResponse = await fetch(rawUrl);

  if (!rawResponse.ok) {
    throw new Error(`Failed to fetch recipe content for ${file.name}: ${rawResponse.statusText}`);
  }

  const text = await rawResponse.text();

  // Reject oversized content before it ever reaches YAML parsing (see
  // MAX_RECIPE_FILE_SIZE_BYTES / RT-2026-09-06-02).
  if (Buffer.byteLength(text, 'utf8') > MAX_RECIPE_FILE_SIZE_BYTES) {
    throw new Error(
      `Recipe ${file.name} exceeds maximum allowed size of ${MAX_RECIPE_FILE_SIZE_BYTES} bytes`
    );
  }

  return text;
}

/**
 * Sanitize markdown content fetched from the (untrusted) external Recipes
 * repository before it is written into src/pages/posts, where Astro renders
 * it as a page. Astro's markdown pipeline passes raw HTML through verbatim,
 * so any literal HTML-like tag (`<script>`, `<img onerror=...>`, etc.) in the
 * fetched content would otherwise execute in visitors' browsers.
 *
 * Standard recipe markdown has no legitimate need for raw HTML tags, so we
 * neutralise anything that looks like a tag/comment opener by escaping the
 * leading `<` to `&lt;`. This renders the payload as inert text instead of
 * markup while leaving normal markdown/prose untouched.
 *
 * See .security/findings.md RT-2026-07-30-01.
 * @param {String} content Raw markdown content from the external repo
 * @returns {String} Sanitized markdown content
 */
function sanitizeMarkdownContent(content) {
  // Neutralise `javascript:`/`data:`/etc. markdown link & image destinations
  // *before* the raw-HTML escape below, since that escape only catches
  // literal `<tag>` markup and does nothing for plain markdown syntax like
  // `[text](javascript:...)` (see RT-2026-09-06-01 / RT-2026-07-30-01).
  const withSafeUrls = sanitizeMarkdownUrls(content);

  // Matches `<` followed by a tag-name start character, a closing-tag `/`,
  // a comment `!`, or a processing instruction `?` — i.e. anything that a
  // browser/HTML parser would treat as the start of a tag or comment.
  return withSafeUrls.replace(/<(?=[a-zA-Z/!?])/g, '&lt;');
}

/**
 * Decode the things that can obscure a URL's scheme from a plain string
 * check: numeric/hex HTML character references (`&#115;` / `&#x73;`, which
 * a markdown renderer decodes before emitting the `href`/`src` attribute)
 * and a small set of named references relevant to URL syntax (`&colon;`),
 * then strip embedded ASCII control characters (tabs, newlines, carriage
 * returns, NUL, etc.) that could otherwise be spliced into the middle of a
 * scheme name (`java\tscript:`, `java\x00script:`) purely to dodge a
 * literal-string match while still being ignored/collapsed by a real URL
 * parser. This mirrors what a browser effectively does before treating the
 * string as a URL, so the scheme check below sees what the browser sees.
 * @param {String} url
 * @returns {String} normalized URL, safe to run a scheme check against
 */
function normalizeUrlForSchemeCheck(url) {
  let decoded = url
    .replace(/&#x([0-9a-fA-F]+);?/g, (_m, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_m, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&colon;/gi, ':')
    .replace(/&semi;/gi, ';')
    .replace(/&amp;/gi, '&');

  // Strip ASCII control characters (0x00-0x1F, 0x7F).
  decoded = decoded.replace(/[\x00-\x1f\x7f]/g, '');

  return decoded.trim();
}

/**
 * Allow-list of URL schemes that are safe to leave as a live, clickable
 * link/image destination. A URL with no scheme at all (a bare relative
 * path or fragment, e.g. `./image.png`, `#section`, `../other-page`) is
 * also considered safe.
 * @param {String} normalizedUrl Output of normalizeUrlForSchemeCheck
 * @returns {boolean}
 */
function isSafeUrlScheme(normalizedUrl) {
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(normalizedUrl);
  if (!schemeMatch) {
    return true;
  }
  const scheme = schemeMatch[1].toLowerCase();
  return scheme === 'http' || scheme === 'https' || scheme === 'mailto';
}

/** Strip a markdown `<...>`-wrapped URL, if present. */
function unwrapAngleBrackets(raw) {
  if (raw.length >= 2 && raw[0] === '<' && raw[raw.length - 1] === '>') {
    return { inner: raw.slice(1, -1), wrapped: true };
  }
  return { inner: raw, wrapped: false };
}

// A destination token as markdown allows it: either `<...>`-wrapped, or a
// run of non-whitespace characters that may contain one level of balanced
// parentheses (so `javascript:alert(document.domain)` is captured whole
// instead of splitting on its inner `)`).
const URL_TOKEN_SOURCE = '<[^>\\n]*>|(?:[^\\s()]|\\([^()]*\\))+';

const BLOCKED_URL_PLACEHOLDER = '#blocked-by-sanitizer';

/**
 * Neutralise markdown link/image destinations that use a disallowed URL
 * scheme. Astro's markdown pipeline emits `[text](url)` / `![alt](url)`
 * destinations verbatim into `href`/`src` attributes with no scheme
 * validation of its own, so `[text](javascript:...)` — no raw HTML
 * required at all — becomes a live, clickable/loadable XSS vector. Handles
 * inline `](url)` syntax and reference-style `[label]: url` definitions,
 * checking the decoded/normalized form of the URL so HTML-entity
 * obfuscation (`java&#115;cript:`) and control-character tricks
 * (`java\tscript:`, `java\x00script:`) are caught too.
 *
 * See .security/findings.md RT-2026-07-30-01 / RT-2026-09-06-01.
 * @param {String} content Markdown content
 * @returns {String} Content with unsafe link/image destinations neutralised
 */
function sanitizeMarkdownUrls(content) {
  const neutralize = (match, prefix, rawUrl) => {
    const { inner, wrapped } = unwrapAngleBrackets(rawUrl);
    const normalized = normalizeUrlForSchemeCheck(inner);
    if (isSafeUrlScheme(normalized)) {
      return match;
    }
    return `${prefix}${wrapped ? `<${BLOCKED_URL_PLACEHOLDER}>` : BLOCKED_URL_PLACEHOLDER}`;
  };

  // Inline destinations: `](url ...)` / `![alt](url ...)`.
  let result = content.replace(new RegExp(`(\\]\\()\\s*(${URL_TOKEN_SOURCE})`, 'g'), neutralize);

  // Reference-style definitions: `[label]: url ...` (up to 3 leading
  // spaces, per CommonMark) at the start of a line.
  result = result.replace(
    new RegExp(`^([ \\t]{0,3}\\[[^\\]]+\\]:\\s*)(${URL_TOKEN_SOURCE})`, 'gm'),
    neutralize
  );

  return result;
}

/**
 * Validate a fetched recipe's frontmatter before it is allowed to reach the
 * Astro build step. Malformed frontmatter (missing required fields, broken
 * YAML, unsafe tag values) can crash `astro build` mid-render, which — see
 * RT-2026-07-30-02 — previously caused the deploy repo's .git/CNAME to be
 * deleted. Rejecting bad content here means it never reaches that step.
 * @param {String} content Raw (already sanitized) markdown content
 * @param {String} fileName Name of the file, for error messages
 * @returns {{valid: boolean, reason?: string}}
 */
function validateRecipeFrontmatter(content, fileName) {
  if (Buffer.byteLength(content, 'utf8') > MAX_RECIPE_FILE_SIZE_BYTES) {
    return {
      valid: false,
      reason: `Recipe content exceeds maximum allowed size of ${MAX_RECIPE_FILE_SIZE_BYTES} bytes`,
    };
  }

  let parsed;
  try {
    parsed = matter(content);
  } catch (error) {
    return { valid: false, reason: `Invalid frontmatter YAML: ${error.message}` };
  }

  const { data } = parsed;

  const requiredStringFields = ['layout', 'title', 'pubDate', 'author', 'description'];
  for (const field of requiredStringFields) {
    if (typeof data[field] !== 'string' || data[field].trim() === '') {
      return { valid: false, reason: `Missing or invalid required field: ${field}` };
    }
  }

  if (!isSafeLayout(data.layout)) {
    return { valid: false, reason: `Unsafe or unknown layout path: ${JSON.stringify(data.layout)}` };
  }

  if (Number.isNaN(Date.parse(data.pubDate))) {
    return { valid: false, reason: `Invalid pubDate: ${data.pubDate}` };
  }

  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      return { valid: false, reason: 'tags must be an array' };
    }
    for (const tag of data.tags) {
      if (typeof tag !== 'string' || !isSafeTag(tag)) {
        return { valid: false, reason: `Unsafe or invalid tag value: ${JSON.stringify(tag)}` };
      }
    }
  }

  return { valid: true };
}

/**
 * Basic allow-list for tag values that later become URL/filesystem path
 * segments (see src/pages/tags/[tag].astro). Calibrated against every tag
 * already in production use (letters, digits, spaces, hyphens, underscores)
 * so legitimate multi-word tags keep working, while rejecting path
 * traversal sequences and stray quote characters (e.g. `../../../x`,
 * `burgers"`).
 * @param {String} tag
 * @returns {boolean}
 */
function isSafeTag(tag) {
  return /^[A-Za-z0-9 _-]+$/.test(tag);
}

/**
 * Allow-list for the `layout` frontmatter field. Astro `import()`s this
 * value as a module path, so an unvalidated string is an arbitrary file
 * read / build crash vector (e.g. `layout: ../../../../../../etc/passwd`).
 * Every recipe currently published (see src/pages/posts/*.md) uses exactly
 * this one layout, so the allow-list only needs the single real path.
 * @param {String} layout
 * @returns {boolean}
 */
const ALLOWED_RECIPE_LAYOUTS = ['../../layout/Post/MarkdownPostLayout.astro'];

function isSafeLayout(layout) {
  return ALLOWED_RECIPE_LAYOUTS.includes(layout);
}

/**
 * Upper bound on a single fetched recipe file's size, enforced before its
 * frontmatter is parsed. `validateRecipeFrontmatter()` parses YAML via
 * gray-matter/js-yaml, which (GHSA-5p4m-2wfm-xmqj) has quadratic-time
 * `!!omap` resolution with no size limit of its own; an attacker-controlled
 * recipe file with no cap can stall the build for tens of minutes. Real
 * recipe files in the source repo are all under 4KB, so 500KB is already
 * >100x headroom over anything legitimate while keeping worst-case parse
 * time bounded.
 * @type {number}
 */
const MAX_RECIPE_FILE_SIZE_BYTES = 500 * 1024;

/**
 * Save recipe content to a file
 * @param {String} fileName The name of the file
 * @param {String} content The content to save
 * @param {String} recipePostsDir Directory path for recipe posts
 */
function saveRecipeFile(fileName, content, recipePostsDir) {
  const recipeFilePath = path.join(recipePostsDir, fileName);
  fs.writeFileSync(recipeFilePath, content);
  console.log(`✅ Created recipe page: ${recipeFilePath}`);
}

/**
 * Fetch recipes from GitHub and save them locally
 * @param {Object} config Configuration object
 */
async function fetchRecipes(config) {
  const { recipeRepo, recipePostsDir } = config;
  
  console.log('🍲 Fetching recipes from GitHub...');
  
  try {
    // First, fetch the repository contents to get all files
    const contents = await fetchRepositoryContents(recipeRepo);
    
    // Filter for markdown files (recipes)
    const markdownFiles = filterRecipeFiles(contents);
    
    console.log(`📚 Found ${markdownFiles.length} recipe files in repository`);
    
    // Fetch and process each recipe
    for (const file of markdownFiles) {
      try {
        const rawContent = await fetchRecipeContent(file, recipeRepo);
        const content = sanitizeMarkdownContent(rawContent);

        const validation = validateRecipeFrontmatter(content, file.name);
        if (!validation.valid) {
          console.error(`❌ Rejecting recipe ${file.name}: ${validation.reason}`);
          continue;
        }

        saveRecipeFile(file.name, content, recipePostsDir);
      } catch (error) {
        console.error(`❌ Error processing recipe ${file.name}:`, error.message);
        continue;
      }
    }
    
    console.log('✅ Recipe fetching and page creation completed successfully');
  } catch (error) {
    console.error('❌ Error fetching recipes:', error);
  }
}

/**
 * Ensure data directory exists for static files
 * @param {Object} config Configuration object
 */
function ensureDataDirectory(config) {
  const { publicDataDir } = config;
  
  console.log('📁 Ensuring data directory exists for static files...');
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
    console.log('✅ Created data directory in public folder');
  } else {
    console.log('✅ Data directory already exists');
  }
}

/**
 * Backup a single file or directory
 * @param {String} item File or directory name
 * @param {String} sourcePath Source path
 * @param {String} targetPath Target path
 */
function backupItem(item, sourcePath, targetPath) {
  console.log(`📦 Preserving ${item} from ${sourcePath} to ${targetPath}...`);
  
  try {
    if (fs.lstatSync(sourcePath).isDirectory()) {
      // For directories like .git, use rsync for more reliable copying
      execSync(`rsync -a "${sourcePath}/" "${targetPath}/"`);
      console.log(`✅ Successfully backed up directory: ${item}`);
    } else {
      // For files like CNAME
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Successfully backed up file: ${item}`);
    }
  } catch (error) {
    console.error(`❌ Error preserving ${item}:`, error);
  }
}

/**
 * Backup all files and directories that need to be preserved
 * @param {Object} config Configuration object
 */
function backupFilesToPreserve(config) {
  const { outputDir, tempDir, itemsToPreserve } = config;
  
  console.log('🔍 Checking for files to preserve...');
  
  // Backup files to preserve if they exist
  for (const item of itemsToPreserve) {
    const sourcePath = path.join(outputDir, item);
    const targetPath = path.join(tempDir, item);
    
    if (fs.existsSync(sourcePath)) {
      backupItem(item, sourcePath, targetPath);
    } else {
      console.log(`⚠️ ${item} not found in build directory (${sourcePath}), skipping...`);
    }
  }
}

// /**
//  * Generate static data files
//  */
// function generateStaticData() {
//   console.log('📊 Generating static data files...');
//   try {
//     execSync('node scripts/generate-static-data.js', { stdio: 'inherit' });
//     execSync('node scripts/generate-tag-routes.js', { stdio: 'inherit' });
//     console.log('✅ Static data generation completed');
//     return true;
//   } catch (error) {
//     console.warn('⚠️ Static data generation had issues:', error);
//     console.warn('⚠️ Continuing with build process...');
//     return false;
//   }
// }

/**
 * Run the Astro build process
 * @param {String} [command] The shell command to run for the build. Defaults
 * to `npm run build:standard`, overridable via PRESERVE_BUILD_COMMAND (used
 * by tests to deterministically simulate a failing build without invoking a
 * real Astro build — see test/ts/PreserveBuild.test.ts).
 */
function runAstroBuild(command = process.env.PRESERVE_BUILD_COMMAND || 'npm run build:standard') {
  console.log('🚀 Running Astro build...');
  try {
    execSync(command, { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
    return true;
  } catch (error) {
    // Do NOT process.exit() here: that would terminate the process
    // immediately and skip the finally block in main() that restores
    // .git/CNAME/.nojekyll into the deploy repo (RT-2026-07-30-02).
    // Throw instead so main() can restore preserved files before exiting.
    console.error('❌ Build failed:', error.message);
    throw error;
  }
}

/**
 * Remove a single directory
 * @param {String} dir Directory to remove
 * @param {String} dirPath Full path to the directory
 */
function removeDirectory(dir, dirPath) {
  console.log(`🗑️ Removing ${dir} directory from build output...`);
  try {
    fs.rmSync(dirPath, { recursive: true });
    console.log(`✅ Successfully removed directory: ${dir}`);
    return true;
  } catch (error) {
    console.error(`❌ Error removing ${dir}:`, error);
    return false;
  }
}

/**
 * Clean up excluded directories from output folder
 * @param {Object} config Configuration object
 */
function cleanupExcludedDirectories(config) {
  const { outputDir, directoriesToExclude } = config;
  
  console.log('🧹 Removing excluded directories from build output...');
  
  for (const dir of directoriesToExclude) {
    const dirPath = path.join(outputDir, dir);
    if (fs.existsSync(dirPath)) {
      removeDirectory(dir, dirPath);
    } else {
      console.log(`ℹ️ Directory ${dir} not found in build output, no need to remove.`);
    }
  }
}

/**
 * Restore a single file or directory
 * @param {String} item File or directory name
 * @param {String} sourcePath Source path
 * @param {String} targetPath Target path
 * @param {String} outputDir Output directory
 */
function restoreItem(item, sourcePath, targetPath, outputDir) {
  console.log(`📋 Restoring ${item} from ${sourcePath} to ${targetPath}...`);
  
  try {
    // Make sure the destination directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    if (fs.lstatSync(sourcePath).isDirectory()) {
      // For directories like .git, use rsync for more reliable copying
      execSync(`rsync -a "${sourcePath}/" "${targetPath}/"`);
      console.log(`✅ Successfully restored directory: ${item}`);
      return true;
    } else {
      // For files like CNAME
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Successfully restored file: ${item}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error restoring ${item}:`, error);
    return false;
  }
}

/**
 * Restore all preserved files
 * @param {Object} config Configuration object
 */
function restorePreservedFiles(config) {
  const { outputDir, tempDir, itemsToPreserve } = config;
  
  console.log('🔄 Restoring preserved files...');
  
  for (const item of itemsToPreserve) {
    const sourcePath = path.join(tempDir, item);
    const targetPath = path.join(outputDir, item);
    
    if (fs.existsSync(sourcePath)) {
      restoreItem(item, sourcePath, targetPath, outputDir);
    } else {
      console.log(`⚠️ No preserved ${item} found in temp directory, skipping...`);
    }
  }
}

/**
 * Verify that the Git directory was properly restored and refresh its status
 * @param {Object} config Configuration object
 */
function verifyGitRepository(config) {
  const { outputDir } = config;
  const gitPath = path.join(outputDir, '.git');
  
  if (fs.existsSync(gitPath)) {
    console.log('✅ .git directory successfully preserved and restored!');
    
    // Force VS Code to recognize the Git repository after build
    try {
      console.log('🔄 Refreshing Git repository status...');
      process.chdir(outputDir);
      execSync('git status', { stdio: 'inherit' });
      console.log('✅ Git repository status refreshed!');
      return true;
    } catch (error) {
      console.error('❌ Error refreshing Git repository status:', error);
      return false;
    }
  } else {
    console.error('❌ .git directory is missing after restoration. Build process completed but git history was not preserved.');
    return false;
  }
}

/**
 * Clean up temporary files and directories
 * @param {Object} config Configuration object
 */
function cleanupTempFiles(config) {
  const { tempDir } = config;
  
  console.log('🧹 Cleaning up...');
  fs.rmSync(tempDir, { recursive: true, force: true });
}

/**
 * The main function that orchestrates the entire build process
 */
async function main() {
  // Initialize configuration first; if this itself fails, nothing has been
  // backed up yet so there is nothing to restore.
  let config;
  try {
    config = await initializeConfig();
  } catch (error) {
    console.error('❌ Build failed with error:', error);
    process.exit(1);
    return;
  }

  try {
    // Create necessary directories
    createRequiredDirectories(config);

    // Backup files to preserve
    backupFilesToPreserve(config);

    // Fetch recipes
    console.log('🍳 Starting recipe fetching process...');
    await fetchRecipes(config);

    // Ensure data directory exists
    ensureDataDirectory(config);

    // Run the Astro build. May throw if rendering fails (e.g. malformed
    // recipe content) — that is handled below, after preserved files are
    // guaranteed to be restored.
    runAstroBuild();

    // Clean up excluded directories
    cleanupExcludedDirectories(config);
  } catch (error) {
    console.error('❌ Build failed with error:', error);
    // Use exitCode (not process.exit()) so the finally block below still
    // runs to completion before the process exits.
    process.exitCode = 1;
  } finally {
    // Always restore preserved files, even if the build step above failed.
    // This is what prevents a bad recipe from permanently deleting the
    // deploy repo's .git/CNAME/.nojekyll (RT-2026-07-30-02).
    restorePreservedFiles(config);
    verifyGitRepository(config);
    cleanupTempFiles(config);
  }

  if (process.exitCode === 1) {
    return;
  }

  console.log('✨ Build completed with preserved files!');
}

// Only run main() when this file is executed directly (e.g. via
// `npm run build` / `node scripts/preserve-build.js`), not when its
// functions are imported for testing.
const isMainModule = process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`;
if (isMainModule) {
  main();
}

export {
  sanitizeMarkdownContent,
  sanitizeMarkdownUrls,
  validateRecipeFrontmatter,
  isSafeTag,
  isSafeLayout,
  MAX_RECIPE_FILE_SIZE_BYTES,
  saveRecipeFile,
  fetchRecipes,
  runAstroBuild,
  restorePreservedFiles,
  backupFilesToPreserve,
  main,
};