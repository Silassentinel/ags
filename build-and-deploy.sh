#!/bin/bash

# Build and deploy script for handling build errors and deploying to GitHub Pages

echo "🚀 Starting build and deploy process..."

# Step 1: Run fix-static-build.js to fix potential issues
echo "🛠️ Running fix-static-build.js..."
node fix-static-build.js

# Step 2: Generate static data files
echo "📊 Generating static data files..."
npm run generate:static

# Step 3: Build the site with Astro
echo "🏗️ Building the site with Astro..."
astro build --config astro.config.mjs

# Step 4: Verify the output directory
echo "🔍 Verifying build output..."
OUTPUT_DIR="../silassentinel.github.io"

# Check if GitHub repo data exists, if not, copy it
if [ ! -f "$OUTPUT_DIR/data/ghuserRepo.json" ]; then
  echo "⚠️ GitHub repo data missing in build output, copying now..."
  mkdir -p "$OUTPUT_DIR/data"
  cp ./public/data/ghuserRepo.json "$OUTPUT_DIR/data/ghuserRepo.json" || echo "❌ Failed to copy GitHub repo data"
fi

# Step 5: Handle CNAME file
if [ ! -f "$OUTPUT_DIR/CNAME" ]; then
  echo "⚠️ CNAME file missing in build output, creating now..."
  echo "benjamindegryse.be" > "$OUTPUT_DIR/CNAME"
fi

echo "✅ Build and verify completed!"
echo ""
echo "To deploy to GitHub Pages, navigate to $OUTPUT_DIR and run:"
echo "git add ."
echo "git commit -m 'Update site build'"
echo "git push origin main"
echo ""
echo "Then visit https://benjamindegryse.be/ to verify the changes."
