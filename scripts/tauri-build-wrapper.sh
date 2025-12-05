#!/bin/bash

# Wrapper script for Tauri build that ensures API routes are restored even on failure

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Function to restore API routes
restore_api() {
  cd "$PROJECT_DIR"
  node scripts/prepare-tauri-build.js restore || true
}

# Ensure cleanup on exit
trap restore_api EXIT

# Prepare for build
cd "$PROJECT_DIR"
node scripts/prepare-tauri-build.js prepare

# Run the build
TAURI_BUILD=true npm run build

# If we get here, build succeeded, restore will happen in EXIT trap
echo "Build completed successfully"



