const fs = require('fs');
const path = require('path');

// Create out/server directory if it doesn't exist
const serverDir = path.join(__dirname, '..', 'out', 'server');
if (!fs.existsSync(serverDir)) {
  fs.mkdirSync(serverDir, { recursive: true });
}

// Create next-font-manifest.json if it doesn't exist
const manifestPath = path.join(serverDir, 'next-font-manifest.json');
if (!fs.existsSync(manifestPath)) {
  // Use the proper Next.js font manifest format
  const manifest = {
    pages: {},
    app: {},
    appUsingSizeAdjust: false,
    pagesUsingSizeAdjust: false
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✓ Created next-font-manifest.json for static export compatibility');
} else {
  console.log('✓ next-font-manifest.json already exists');
}

