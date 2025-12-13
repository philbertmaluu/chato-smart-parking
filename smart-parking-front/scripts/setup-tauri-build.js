#!/usr/bin/env node

/**
 * Tauri Build Setup Script
 * Ensures proper configuration for Tauri desktop builds
 * Runs as part of the prebuild process
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const tauriConfPath = path.join(projectRoot, 'src-tauri', 'tauri.conf.json');
const outDir = path.join(projectRoot, 'out');
const nextConfigPath = path.join(projectRoot, 'next.config.mjs');

console.log('🔧 Setting up Tauri build environment...\n');

// 1. Ensure next.config.mjs has proper Tauri settings
console.log('1️⃣  Verifying Next.js configuration for Tauri...');
try {
  const configContent = fs.readFileSync(nextConfigPath, 'utf-8');
  
  if (configContent.includes('isTauriBuild') && configContent.includes('output: \'export\'')) {
    console.log('   ✓ Next.js config has Tauri export settings');
  } else {
    console.warn('   ⚠️  Next.js config might not be properly configured for Tauri');
  }
  
  if (configContent.includes('trailingSlash: true')) {
    console.log('   ✓ Trailing slash enabled for static routing');
  } else {
    console.warn('   ⚠️  Trailing slash not enabled - this might cause routing issues');
  }
} catch (error) {
  console.warn('   ⚠️  Could not verify Next.js config:', error.message);
}

// 2. Verify Tauri configuration
console.log('\n2️⃣  Verifying Tauri configuration...');
try {
  const tauriConfig = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
  
  if (tauriConfig.build.frontendDist === '../out') {
    console.log('   ✓ Tauri frontendDist points to ../out');
  } else {
    console.warn('   ⚠️  Tauri frontendDist is not ../out');
  }
  
  if (tauriConfig.build.beforeBuildCommand === 'npm run build') {
    console.log('   ✓ beforeBuildCommand set to npm run build');
  } else {
    console.warn('   ⚠️  beforeBuildCommand is not npm run build');
  }
} catch (error) {
  console.error('   ❌ Failed to read Tauri config:', error.message);
}

// 3. Environment check
console.log('\n3️⃣  Checking build environment...');
if (process.env.NEXT_PUBLIC_TAURI_BUILD === 'true') {
  console.log('   ✓ NEXT_PUBLIC_TAURI_BUILD=true');
} else {
  console.warn('   ⚠️  NEXT_PUBLIC_TAURI_BUILD not set to true');
}

console.log('\n✅ Tauri build setup verification complete!\n');
