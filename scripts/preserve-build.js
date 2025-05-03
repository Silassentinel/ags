/**
 * Custom build script that preserves specific files during the Astro build process
 * This script ensures that the .git directory and CNAME file are not deleted
 * when building to a separate repository
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Define paths
const config = await import('../astro.config.mjs');
const outputDir = path.resolve(process.cwd(), config.default.outDir);
const tempDir = path.resolve(process.cwd(), '.temp-preserve');

// Files/directories to preserve
const itemsToPreserve = [
  '.git',
  'CNAME'
];

// Create temp directory if it doesn't exist
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

console.log('🔍 Checking for files to preserve...');

// Backup files to preserve if they exist
for (const item of itemsToPreserve) {
  const sourcePath = path.join(outputDir, item);
  const targetPath = path.join(tempDir, item);
  
  if (fs.existsSync(sourcePath)) {
    console.log(`📦 Preserving ${item}...`);
    
    if (fs.lstatSync(sourcePath).isDirectory()) {
      // For directories like .git, use cp -r
      execSync(`cp -r "${sourcePath}" "${targetPath}"`);
    } else {
      // For files like CNAME
      fs.copyFileSync(sourcePath, targetPath);
    }
  } else {
    console.log(`⚠️ ${item} not found in build directory, skipping...`);
  }
}

// Run the standard build
console.log('🚀 Running Astro build...');
try {
  execSync('npm run build:standard', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

// Restore preserved files
console.log('🔄 Restoring preserved files...');
for (const item of itemsToPreserve) {
  const sourcePath = path.join(tempDir, item);
  const targetPath = path.join(outputDir, item);
  
  if (fs.existsSync(sourcePath)) {
    console.log(`📋 Restoring ${item}...`);
    
    if (fs.existsSync(sourcePath) && fs.lstatSync(sourcePath).isDirectory()) {
      // For directories like .git, use cp -r
      execSync(`cp -r "${sourcePath}" "${targetPath}"`);
    } else {
      // For files like CNAME
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

// Clean up temp directory
console.log('🧹 Cleaning up...');
fs.rmSync(tempDir, { recursive: true, force: true });

console.log('✨ Build completed with preserved files!');