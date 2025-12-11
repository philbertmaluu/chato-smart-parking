const fs = require('fs');
const path = require('path');

// Minimal postbuild: just verify index.html exists for Tauri static export
const outDir = path.join(__dirname, '..', 'out');
const indexPath = path.join(outDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.warn('⚠️  index.html not found at out/index.html. Build may have failed.');
} else {
  console.log('✓ index.html found at out/index.html');
}
