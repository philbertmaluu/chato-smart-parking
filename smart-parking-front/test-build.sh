#!/bin/bash
cd "$(dirname "$0")"
echo "Testing Next.js static export build..."
cross-env NEXT_PUBLIC_TAURI_BUILD=true npm run prebuild:tauri && next build && npm run postbuild
echo "Build complete. Checking output..."
if [ -f "out/index.html" ]; then
  echo "✓ Success: out/index.html exists"
  ls -lh out/index.html
  head -20 out/index.html
else
  echo "❌ Failed: out/index.html not found"
  echo "Contents of out/ directory:"
  ls -la out/
fi
