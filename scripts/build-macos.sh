#!/bin/bash

# Script to build macOS app with automatic architecture detection

ARCH=$(uname -m)

if [ "$ARCH" = "arm64" ]; then
  TARGET="aarch64-apple-darwin"
  echo "Building for Apple Silicon (M1/M2/M3)..."
else
  TARGET="x86_64-apple-darwin"
  echo "Building for Intel Mac..."
fi

tauri build --target "$TARGET"



