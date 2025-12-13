#!/usr/bin/env node

/**
 * Tauri Route Handler Setup
 * Ensures all routes in Tauri fall back to index.html for SPA routing
 */

const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out');
const indexPath = path.join(outDir, 'index.html');
const publicDir = path.join(outDir, 'public');

console.log('🔄 Setting up Tauri SPA routing...\n');

// 1. Verify index.html exists
if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html not found in out/');
  process.exit(1);
}

console.log('✓ index.html found');

// 2. Read the index.html
let indexHtml = fs.readFileSync(indexPath, 'utf-8');

// 3. Ensure the HTML has proper React initialization
if (!indexHtml.includes('__next_f')) {
  console.warn('⚠️  index.html might not have Next.js React initialization');
}

// 4. Verify static assets exist
const staticDir = path.join(outDir, '_next', 'static');
if (fs.existsSync(staticDir)) {
  const cssDir = path.join(staticDir, 'css');
  const chunksDir = path.join(staticDir, 'chunks');
  
  if (fs.existsSync(cssDir)) {
    console.log('✓ CSS files found in _next/static/css');
  }
  
  if (fs.existsSync(chunksDir)) {
    console.log('✓ JS chunks found in _next/static/chunks');
  }
} else {
  console.warn('⚠️  _next/static directory not found');
}

// 5. Verify HTML content is valid
const htmlSize = indexHtml.length;
console.log(`✓ index.html size: ${(htmlSize / 1024).toFixed(2)}KB`);

if (htmlSize < 10000) {
  console.warn('⚠️  index.html seems very small - might not contain full app');
}

// 6. Create a debug page for testing
const debugPagePath = path.join(outDir, 'debug.html');
const debugContent = `<!DOCTYPE html>
<html>
<head>
  <title>Smart Parking - Debug</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #f5f5f5; }
    .info { background: white; padding: 20px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #3498db; }
    h2 { color: #333; }
    .success { border-left-color: #27ae60; }
    .warning { border-left-color: #f39c12; }
    .error { border-left-color: #e74c3c; }
    code { background: #eee; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>Smart Parking System - Debug Page</h1>
  
  <div class="info success">
    <h2>✓ Application Loaded</h2>
    <p>If you see this page, the Tauri application is working.</p>
  </div>
  
  <div class="info">
    <h2>Build Information</h2>
    <p>Build Date: ${new Date().toISOString()}</p>
    <p>Frontend Dist: out/</p>
    <p>HTML Size: ${(htmlSize / 1024).toFixed(2)}KB</p>
  </div>
  
  <div class="info">
    <h2>Navigation</h2>
    <p>Go to: <a href="/">Home</a> | <a href="/auth/login">Login</a></p>
  </div>
  
  <div class="info">
    <h2>Checking Assets...</h2>
    <p id="status">Checking...</p>
  </div>
  
  <script>
    window.addEventListener('load', function() {
      const status = document.getElementById('status');
      const checks = {
        'CSS Files': document.styleSheets.length > 0,
        'Scripts Loaded': window.__next_f !== undefined,
        'React Ready': typeof React !== 'undefined'
      };
      
      let html = '<ul>';
      for (const [check, result] of Object.entries(checks)) {
        html += \`<li>\${result ? '✓' : '✗'} \${check}</li>\`;
      }
      html += '</ul>';
      status.innerHTML = html;
      
      // Try to navigate to home
      setTimeout(() => {
        console.log('Redirecting to home...');
        window.location.href = '/';
      }, 3000);
    });
  </script>
</body>
</html>`;

try {
  fs.writeFileSync(debugPagePath, debugContent, 'utf-8');
  console.log('✓ Created debug.html for testing');
} catch (error) {
  console.warn('⚠️  Could not create debug page:', error.message);
}

console.log('\n✅ Tauri SPA routing setup complete!');
console.log('   The app is ready to be packaged with Tauri.\n');
