#!/usr/bin/env node

/**
 * Script to prepare the Next.js app for Tauri static export
 * This temporarily moves API routes since they can't be statically exported
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../app/api');
const API_BACKUP_DIR = path.join(__dirname, '../app/_api_backup');

function prepareForTauriBuild() {
  console.log('Preparing for Tauri build...');
  
  // Check if API directory exists
  if (!fs.existsSync(API_DIR)) {
    console.log('No API directory found, skipping...');
    return;
  }

  // Remove backup if it exists (from previous failed build)
  if (fs.existsSync(API_BACKUP_DIR)) {
    console.log('Removing old API backup...');
    fs.rmSync(API_BACKUP_DIR, { recursive: true, force: true });
  }

  // Move API directory to backup location
  console.log('Moving API routes to backup location...');
  try {
    fs.renameSync(API_DIR, API_BACKUP_DIR);
    console.log('✓ API routes moved successfully');
  } catch (error) {
    console.error('Error moving API routes:', error.message);
    process.exit(1);
  }
}

function restoreAfterBuild() {
  console.log('Restoring API routes...');
  
  if (fs.existsSync(API_BACKUP_DIR)) {
    try {
      // Remove empty API dir if it exists
      if (fs.existsSync(API_DIR)) {
        fs.rmSync(API_DIR, { recursive: true, force: true });
      }
      
      // Restore API directory
      fs.renameSync(API_BACKUP_DIR, API_DIR);
      console.log('✓ API routes restored successfully');
    } catch (error) {
      console.error('Error restoring API routes:', error.message);
      // Don't exit with error, just warn
    }
  } else {
    console.log('No API backup found to restore');
  }
}

// Handle cleanup on process exit
process.on('SIGINT', () => {
  restoreAfterBuild();
  process.exit(0);
});

process.on('SIGTERM', () => {
  restoreAfterBuild();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  restoreAfterBuild();
  process.exit(1);
});

// Handle command line arguments
const command = process.argv[2];

if (command === 'prepare') {
  prepareForTauriBuild();
} else if (command === 'restore') {
  restoreAfterBuild();
} else {
  console.error('Usage: node prepare-tauri-build.js [prepare|restore]');
  process.exit(1);
}

