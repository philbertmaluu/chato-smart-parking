const fs = require('fs');
const path = require('path');

// Verify the out directory for Tauri static export
const outDir = path.join(__dirname, '..', 'out');
const indexPath = path.join(outDir, 'index.html');

if (!fs.existsSync(outDir)) {
  console.error('❌ out/ directory not found');
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html not found in out/');
  console.error('   This is required for Tauri to load the application');
  process.exit(1);
}

console.log('✓ Static export generated successfully at out/index.html');
