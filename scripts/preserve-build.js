/**
 * Custom build script that preserves specific files during the Astro build process
 * This script ensures that the .git directory and CNAME file are not deleted
 * when building to a separate repository
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

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
    itemsToPreserve: ['.git', 'CNAME'],
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
    file.name !== 'README.md'
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
  
  return await rawResponse.text();
}

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
        const content = await fetchRecipeContent(file, recipeRepo);
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
 * Note: This function is commented out to avoid circular references since this script
 * is likely called by the build process itself
 */
function runAstroBuild() {
  console.log('🚀 Running Astro build...');
  // Commented out to avoid circular reference in build process
  // try {
  //   execSync('npm run build:standard', { stdio: 'inherit' });
  //   console.log('✅ Build completed successfully');
  //   return true;
  // } catch (error) {
  //   console.error('❌ Build failed:', error);
  //   process.exit(1);
  // }
  console.log('ℹ️ Build step skipped since this script is part of the build process');
  return true;
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
  try {
    // Initialize configuration
    const config = await initializeConfig();
    
    // Create necessary directories
    createRequiredDirectories(config);
    
    // Backup files to preserve
    backupFilesToPreserve(config);
    
    // Fetch recipes
    console.log('🍳 Starting recipe fetching process...');
    await fetchRecipes(config);
    
    // Ensure data directory exists
    ensureDataDirectory(config);
    
    // Generate static data
    //generateStaticData();
    
    // Build step is handled by the calling process, no need to run it here
    // The runAstroBuild function is now commented out to avoid circular references
    //runAstroBuild(); // This will now just log a message indicating it was skipped
    
    // Clean up excluded directories
    cleanupExcludedDirectories(config);
    
    // Restore preserved files
    restorePreservedFiles(config);
    
    // Verify Git repository
    verifyGitRepository(config);
    
    // Clean up temporary files
    cleanupTempFiles(config);
    
    console.log('✨ Build completed with preserved files!');
  } catch (error) {
    console.error('❌ Build failed with error:', error);
    process.exit(1);
  }
}

// Execute the main function
main();