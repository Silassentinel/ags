#!/bin/bash
# Static site build script
# This script builds the site in static mode

echo "🚀 Starting static site build process..."

# Make sure data directory exists
mkdir -p public/data

# Generate static data
echo "📊 Generating static JSON data..."
node scripts/generate-static-data.js

# Generate static routes for tags
echo "🔄 Generating static routes..."
node scripts/generate-tag-routes.js

# Run Astro build with static output
echo "🏗️ Building site with Astro..."
astro build

echo "✅ Build completed!"
echo "📂 Output is in the ../silassentinel.github.io/ directory"
echo ""
echo "To preview the site, run: npm run preview"
