const fs = require('fs');
const path = require('path');

/**
 * Prebuild script for Tauri builds
 * Removes API routes temporarily since they can't be used with static export
 * Uses copy + delete instead of rename for better Windows compatibility
 */

const apiRouteDir = path.join(__dirname, '..', 'app', 'api');
const apiRouteBackup = path.join(__dirname, '..', 'app', '_api.backup');

/**
 * Copy directory recursively (more reliable than rename on Windows)
 */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    return false;
  }
  
  // Create destination directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // Copy files and subdirectories
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  
  return true;
}

/**
 * Remove directory with retry logic (handles Windows file locks)
 */
function removeDir(dirPath, maxRetries = 5) {
  if (!fs.existsSync(dirPath)) {
    return true;
  }
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      return true;
    } catch (error) {
      if (i < maxRetries - 1) {
        // Wait a bit before retrying (Windows needs time to release locks)
        const waitTime = (i + 1) * 100; // 100ms, 200ms, 300ms...
        console.log(`⚠️  Retry ${i + 1}/${maxRetries} for removing ${path.basename(dirPath)} (waiting ${waitTime}ms)...`);
        const start = Date.now();
        while (Date.now() - start < waitTime) {
          // Busy wait
        }
      } else {
        throw error;
      }
    }
  }
  return false;
}

// Only run if NEXT_PUBLIC_TAURI_BUILD is set
if (process.env.NEXT_PUBLIC_TAURI_BUILD === 'true') {
  console.log('🔧 Tauri build detected - handling API routes...');
  
  // If API route exists, move it to backup
  if (fs.existsSync(apiRouteDir)) {
    // Remove old backup if exists
    if (fs.existsSync(apiRouteBackup)) {
      console.log('🧹 Cleaning up old backup...');
      removeDir(apiRouteBackup);
    }
    
    // Copy API route to backup (more reliable than rename on Windows)
    console.log('📦 Copying app/api to app/api.backup...');
    if (copyDir(apiRouteDir, apiRouteBackup)) {
      // Now remove original (with retry logic)
      console.log('🗑️  Removing app/api...');
      if (removeDir(apiRouteDir)) {
        console.log('✓ Temporarily moved app/api to app/_api.backup (API routes not supported in static export)');
      } else {
        console.error('❌ Failed to remove app/api after copying. Build may fail.');
        process.exit(1);
      }
    } else {
      console.error('❌ Failed to copy app/api. Build may fail.');
      process.exit(1);
    }
  } else {
    console.log('ℹ️  No API routes directory found');
  }

} else {
  // Not a Tauri build - ensure API routes are in place
  if (fs.existsSync(apiRouteBackup) && !fs.existsSync(apiRouteDir)) {
    console.log('🔄 Restoring app/api directory...');
    if (copyDir(apiRouteBackup, apiRouteDir)) {
      console.log('✓ Restored app/api directory');
    }
  }
}

