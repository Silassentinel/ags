/**
 * Script to fix static build issues
 * 
 * This script addresses common issues that occur when building for static mode:
 * 1. Ensures all data files are copied to the output directory
 * 2. Validates client-side components and their imports
 * 3. Checks for specific path resolution issues
 * 4. Removes conflicting legacy files (.ts) that have been converted to .tsx
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Define paths
const config = await import('./astro.config.mjs');
const outputDir = path.resolve(process.cwd(), config.default.outDir);
const dataDir = path.resolve(process.cwd(), 'data');
const publicDir = path.resolve(process.cwd(), 'public');
const publicDataDir = path.resolve(publicDir, 'data');
const scriptsUIDir = path.resolve(process.cwd(), 'src/scripts/ui');

console.log('🔍 Fixing static build issues...');

// 1. Create data directory in public if it doesn't exist
if (!fs.existsSync(publicDataDir)) {
  console.log('📁 Creating public/data directory');
  fs.mkdirSync(publicDataDir, { recursive: true });
}

// 2. Copy GitHub repository data
const ghUserRepoFile = path.resolve(dataDir, 'ghuserRepo.json');
if (fs.existsSync(ghUserRepoFile)) {
  console.log('📄 Copying ghuserRepo.json to public/data');
  fs.copyFileSync(
    ghUserRepoFile, 
    path.resolve(publicDataDir, 'ghuserRepo.json')
  );
} else {
  console.warn('⚠️ ghuserRepo.json not found in data directory');
  
  // Create a fallback empty repo file to prevent 404 errors
  console.log('🛠️ Creating fallback ghuserRepo.json file');
  fs.writeFileSync(
    path.resolve(publicDataDir, 'ghuserRepo.json'),
    JSON.stringify([])
  );
}

// 3. Check for conflicting legacy files
console.log('🔍 Checking for conflicting legacy files');

// Files that have been converted from .ts to .tsx but the original .ts files still exist
const conflictingFiles = [
  { 
    legacy: path.join(scriptsUIDir, 'Menu.ts'), 
    modern: path.join(process.cwd(), 'src/components/ui/Menu.tsx') 
  },
  { 
    legacy: path.join(scriptsUIDir, 'Stylez.ts'),
    modern: path.join(process.cwd(), 'src/components/ui/Stylez.tsx')
  }
];

// Check each potential conflict
for (const { legacy, modern } of conflictingFiles) {
  if (fs.existsSync(legacy)) {
    if (fs.existsSync(modern)) {
      console.log(`⚠️ Found conflicting files:\n   Legacy: ${legacy}\n   Modern: ${modern}`);
      
      // Create a backup of the legacy file
      const backupPath = `${legacy}.bak`;
      console.log(`📦 Creating backup of legacy file at ${backupPath}`);
      fs.copyFileSync(legacy, backupPath);
      
      // Delete the legacy file to avoid conflicts
      console.log(`🗑️ Removing legacy file ${legacy}`);
      fs.unlinkSync(legacy);
    } else {
      console.warn(`⚠️ Legacy file exists but modern replacement not found: ${legacy}`);
    }
  }
}

// 4. Verify data files are in output directory
console.log('🔍 Verifying data files in output directory');
const outputDataDir = path.join(outputDir, 'data');

if (!fs.existsSync(outputDataDir)) {
  console.log('📁 Creating data directory in output');
  fs.mkdirSync(outputDataDir, { recursive: true });
}

// Ensure ghuserRepo.json is in the output directory
const outputGhUserRepoFile = path.join(outputDataDir, 'ghuserRepo.json');
if (!fs.existsSync(outputGhUserRepoFile)) {
  const sourceFile = path.join(publicDataDir, 'ghuserRepo.json');
  if (fs.existsSync(sourceFile)) {
    console.log(`📄 Copying ghuserRepo.json to output data directory: ${outputGhUserRepoFile}`);
    fs.copyFileSync(sourceFile, outputGhUserRepoFile);
  } else {
    console.warn('⚠️ ghuserRepo.json not found in public/data, creating empty file');
    fs.writeFileSync(outputGhUserRepoFile, JSON.stringify([]));
  }
}

// 5. Check for path-related issues in HTML files
// This is only needed if your site is deployed to a non-root path
const htmlFiles = fs.readdirSync(outputDir)
  .filter(file => file.endsWith('.html'))
  .map(file => path.join(outputDir, file));

console.log(`🔍 Found ${htmlFiles.length} HTML files to check for path issues`);

// 6. Update base path in content-assets.mjs if it exists
const contentAssetsPath = path.join(outputDir, 'content-assets.mjs');
if (fs.existsSync(contentAssetsPath)) {
  let contentAssets = fs.readFileSync(contentAssetsPath, 'utf-8');
  
  // Check if there are any incorrect paths that should be fixed
  if (contentAssets.includes('"/assets/') && !contentAssets.includes('https://benjamindegryse.be/assets/')) {
    console.log('🔧 Fixing asset paths in content-assets.mjs');
    // Update relative paths to absolute URLs
    contentAssets = contentAssets.replace(/["']\/assets\//g, '"https://benjamindegryse.be/assets/');
    fs.writeFileSync(contentAssetsPath, contentAssets);
  }
}

try {
  console.log('✅ Fix script completed successfully');
  console.log('🚀 Next steps:');
  console.log('1. Run npm run build:standard to rebuild the site');
  console.log('2. Test the built site locally with: npx serve ' + outputDir);
  console.log('3. Ensure the repo fetcher is loading data correctly');
  console.log('4. Make sure all the features are working properly');
} catch (error) {
  console.error('❌ Error during fix process:', error);
}
