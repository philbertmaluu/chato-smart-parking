# Windows Build Notes

## Cross-Compilation Limitations

Building Windows `.exe` files from macOS is **not straightforward** because:

1. **MSVC Linker Required**: Tauri uses `x86_64-pc-windows-msvc` target which requires Microsoft's MSVC linker (`link.exe`)
2. **Windows-Only Tools**: MSVC build tools are only available on Windows
3. **Complex Setup**: Cross-compilation requires extensive configuration

## Recommended Solutions

### Option 1: GitHub Actions (Recommended) ✅

Use the provided GitHub Actions workflow to build on Windows automatically:

1. Push your code to GitHub
2. The workflow (`.github/workflows/build-windows.yml`) will automatically build on Windows
3. Download the built `.exe` from the Actions artifacts

**To use:**
```bash
# Push to GitHub
git push origin main

# Or trigger manually:
# Go to GitHub → Actions → Build Windows App → Run workflow
```

### Option 2: Build on Windows Machine

If you have access to a Windows machine:

1. Install prerequisites:
   - Node.js 18+
   - Rust (via rustup.rs)
   - Visual Studio Build Tools with C++ workload

2. Clone and build:
   ```bash
   git clone <your-repo>
   cd chato-smart-parking
   npm install
   npm run build:windows
   ```

3. Find the `.exe` at:
   ```
   src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/Chato Smart Parking_0.1.0_x64-setup.exe
   ```

### Option 3: Windows VM or WSL2

- Use a Windows virtual machine
- Or use WSL2 on Windows (if you have Windows)

### Option 4: Alternative Target (Not Recommended)

You could try using the GNU target (`x86_64-pc-windows-gnu`) instead of MSVC, but:
- Tauri officially supports MSVC target
- May have compatibility issues
- Requires changing build configuration

## Current Status

✅ **macOS builds work perfectly** - You can build `.app` files on your Mac
❌ **Windows builds from macOS** - Requires Windows environment or CI/CD

## Quick Commands

**Build macOS (works on your Mac):**
```bash
npm run build:macos-intel  # For Intel Mac
npm run build:macos-arm     # For Apple Silicon
```

**Build Windows (requires Windows or CI):**
```bash
npm run build:windows  # Only works on Windows or CI
```

## Next Steps

1. **For immediate Windows build**: Use GitHub Actions workflow
2. **For local development**: Build macOS version locally
3. **For production**: Set up CI/CD pipeline for automated builds



