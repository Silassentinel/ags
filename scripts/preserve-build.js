/**
 * Custom build script that preserves specific files during the Astro build process
 * This script ensures that the .git directory and CNAME file are not deleted
 * when building to a separate repository
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Define paths
const config = await import('../astro.config.mjs');
const outputDir = path.resolve(process.cwd(), config.default.outDir);
const tempDir = path.resolve(process.cwd(), '.temp-preserve');
const recipePostsDir = path.resolve(process.cwd(), 'src/pages/posts');

// Files/directories to preserve
const itemsToPreserve = [
  '.git',
  'CNAME'
];

// Directories to exclude from the build
const directoriesToExclude = [
  'scripts' // Exclude scripts directory as it's only for local development
];

// Recipe repository information
const recipeRepoOwner = 'Silassentinel';
const recipeRepoName = 'Recipes';
const recipeBranch = 'main';

console.log(`🔍 Output directory: ${outputDir}`);

// Create temp directory if it doesn't exist
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Create recipe posts directory if it doesn't exist
if (!fs.existsSync(recipePostsDir)) {
  fs.mkdirSync(recipePostsDir, { recursive: true });
}

// Function to fetch recipes from GitHub
async function fetchRecipes() {
  console.log('🍲 Fetching recipes from GitHub...');
  
  try {
    // First, fetch the repository contents to get all files
    const repoUrl = `https://api.github.com/repos/${recipeRepoOwner}/${recipeRepoName}/contents?ref=${recipeBranch}`;
    const response = await fetch(repoUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch repository contents: ${response.statusText}`);
    }
    
    const contents = await response.json();
    
    // Filter for markdown files (recipes)
    const markdownFiles = contents.filter((file) => 
      file.type === 'file' && file.name.endsWith('.md') && file.name !== '1ATEMPLATE.MD'
    );
    
    console.log(`📚 Found ${markdownFiles.length} recipe files in repository`);
    
    // Fetch and process each recipe
    for (const file of markdownFiles) {
      const rawUrl = `https://raw.githubusercontent.com/${recipeRepoOwner}/${recipeRepoName}/${recipeBranch}/${file.name}`;
      console.log(`📥 Fetching recipe: ${file.name} from ${rawUrl}`);
      
      const rawResponse = await fetch(rawUrl);
      
      if (!rawResponse.ok) {
        console.error(`❌ Failed to fetch recipe content for ${file.name}: ${rawResponse.statusText}`);
        continue;
      }
      
      const content = await rawResponse.text();
      const fileName = file.name;
      const fileNameWithoutExtension = fileName.replace('.md', '');
      
      // Create Astro page for the recipe
      const recipeFilePath = path.join(recipePostsDir, fileName);
      
      // We can assume the frontmatter is already included in the recipe content
      const recipeContent = content;
          
      // Write the file
      fs.writeFileSync(recipeFilePath, recipeContent);
      console.log(`✅ Created recipe page: ${recipeFilePath}`);
    }
    
    console.log('✅ Recipe fetching and page creation completed successfully');
  } catch (error) {
    console.error('❌ Error fetching recipes:', error);
  }
}

console.log('🔍 Checking for files to preserve...');

// Backup files to preserve if they exist
for (const item of itemsToPreserve) {
  const sourcePath = path.join(outputDir, item);
  const targetPath = path.join(tempDir, item);
  
  if (fs.existsSync(sourcePath)) {
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
  } else {
    console.log(`⚠️ ${item} not found in build directory (${sourcePath}), skipping...`);
  }
}

// Fetch recipes before building
console.log('🍳 Starting recipe fetching process...');
await fetchRecipes();

// Run the standard build
console.log('🚀 Running Astro build...');
try {
  execSync('npm run build:standard', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

// Clean up excluded directories from output folder
console.log('🧹 Removing excluded directories from build output...');
for (const dir of directoriesToExclude) {
  const dirPath = path.join(outputDir, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`🗑️ Removing ${dir} directory from build output...`);
    try {
      fs.rmSync(dirPath, { recursive: true });
      console.log(`✅ Successfully removed directory: ${dir}`);
    } catch (error) {
      console.error(`❌ Error removing ${dir}:`, error);
    }
  } else {
    console.log(`ℹ️ Directory ${dir} not found in build output, no need to remove.`);
  }
}

// Restore preserved files
console.log('🔄 Restoring preserved files...');
for (const item of itemsToPreserve) {
  const sourcePath = path.join(tempDir, item);
  const targetPath = path.join(outputDir, item);
  
  if (fs.existsSync(sourcePath)) {
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
      } else {
        // For files like CNAME
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✅ Successfully restored file: ${item}`);
      }
    } catch (error) {
      console.error(`❌ Error restoring ${item}:`, error);
    }
  } else {
    console.log(`⚠️ No preserved ${item} found in temp directory, skipping...`);
  }
}

// Verify the .git directory was properly restored
const gitPath = path.join(outputDir, '.git');
if (fs.existsSync(gitPath)) {
  console.log('✅ .git directory successfully preserved and restored!');
  
  // Force VS Code to recognize the Git repository after build
  try {
    console.log('🔄 Refreshing Git repository status...');
    process.chdir(outputDir);
    execSync('git status', { stdio: 'inherit' });
    console.log('✅ Git repository status refreshed!');
  } catch (error) {
    console.error('❌ Error refreshing Git repository status:', error);
  }
} else {
  console.error('❌ .git directory is missing after restoration. Build process completed but git history was not preserved.');
}

// Clean up temp directory
console.log('🧹 Cleaning up...');
fs.rmSync(tempDir, { recursive: true, force: true });

console.log('✨ Build completed with preserved files!');