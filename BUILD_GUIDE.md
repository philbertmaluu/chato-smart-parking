# Build Guide for Chato Smart Parking Desktop App

This guide explains how to build the desktop application for Windows (.exe) and macOS (.app).

## Prerequisites

### For All Platforms
- Node.js 18+ and npm/pnpm
- Rust (install from https://rustup.rs/)
- Tauri CLI (already included in devDependencies)

### For Windows Builds
- Windows 10/11 (or use cross-compilation)
- Visual Studio Build Tools with C++ workload
- Or use WSL2 on Windows

### For macOS Builds
- macOS 10.13+ (for building .app bundles)
- Xcode Command Line Tools: `xcode-select --install`
- For Apple Silicon (M1/M2/M3): Native build
- For Intel Macs: Use `build:macos-intel` script

## Building the Application

### Quick Build (Current Platform)
```bash
npm run desktop:build
```
This will build for your current platform automatically.

### Build for Windows (.exe)
```bash
npm run build:windows
```

**Output locations:**
- Installer: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/Chato Smart Parking_0.1.0_x64-setup.exe`
- Portable: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/Chato Smart Parking_0.1.0_x64.msi`
- Executable: `src-tauri/target/x86_64-pc-windows-msvc/release/Chato Smart Parking.exe`

### Build for macOS (.app)
```bash
# For Apple Silicon (M1/M2/M3)
npm run build:macos

# For Intel Macs
npm run build:macos-intel
```

**Output locations:**
- App Bundle: `src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Chato Smart Parking.app`
- DMG Installer: `src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/Chato Smart Parking_0.1.0_aarch64.dmg`

### Build for Both Platforms
```bash
npm run build:all
```

## Cross-Platform Building

### Building Windows .exe on macOS
You can cross-compile for Windows on macOS using:
```bash
# Install Windows target
rustup target add x86_64-pc-windows-msvc

# Build for Windows
npm run build:windows
```

### Building macOS .app on Windows
macOS apps can only be built on macOS due to code signing requirements. You'll need:
- A macOS machine (physical or virtual)
- Or use CI/CD services like GitHub Actions

## Build Process

1. **Next.js Build**: The app first builds the Next.js frontend with static export
2. **Tauri Build**: Then Tauri packages it into a native desktop application
3. **Bundle Creation**: Finally creates platform-specific installers

## Troubleshooting

### Common Issues

#### "Rust not found"
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### "Tauri CLI not found"
```bash
npm install
```

#### "Build fails with API route errors"
The app uses static export for desktop builds. API routes in Next.js won't work in the desktop app. Camera proxy functionality should be handled through direct backend API calls or Tauri commands.

#### "Code signing errors on macOS"
For distribution, you'll need to configure code signing in `tauri.conf.json`:
```json
"macOS": {
  "signingIdentity": "Developer ID Application: Your Name",
  "entitlements": "entitlements.plist"
}
```

#### "Windows Defender flags the .exe"
This is normal for unsigned executables. To avoid this:
1. Get a code signing certificate
2. Configure it in `tauri.conf.json`
3. Or distribute through Microsoft Store

## Development Mode

To run the app in development mode:
```bash
npm run desktop:dev
```

This will:
- Start the Next.js dev server
- Launch the Tauri desktop window
- Enable hot reload

## Distribution

### Windows Distribution
- **NSIS Installer**: Recommended for end users
- **MSI Package**: For enterprise deployment
- **Portable .exe**: For users who don't want installation

### macOS Distribution
- **.app Bundle**: Drag-and-drop installation
- **DMG**: Disk image for easy distribution
- **App Store**: Requires additional configuration and Apple Developer account

## File Sizes

Expected build sizes:
- Windows .exe: ~15-25 MB
- macOS .app: ~20-30 MB
- Installers: ~30-50 MB

## Next Steps

1. Test the built application on target platforms
2. Configure code signing for production releases
3. Set up auto-updates (optional, using Tauri updater)
4. Create distribution channels (website, app stores, etc.)

## Notes

- The desktop app connects to your Laravel backend API
- Make sure the backend is accessible from the desktop app
- API routes in Next.js won't work in the desktop build (use backend API directly)
- Camera functionality should work through direct API calls or Tauri commands



