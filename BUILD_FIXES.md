# Build System Fixes and Setup

## Version Alignment

Fixed Tauri version mismatches between npm packages and Rust crates:

### NPM Packages (package.json)
- `@tauri-apps/api`: ^2.9.0
- `@tauri-apps/cli`: ^2.9.0

### Rust Crates (Cargo.toml)
- `tauri`: 2.9
- `tauri-build`: 2.5
- `tauri-plugin-log`: 2.7

All versions are now aligned and compatible.

## API Routes Handling

Since Next.js API routes cannot be statically exported (required for Tauri desktop builds), a build script system was created:

### Scripts Created

1. **`scripts/prepare-tauri-build.js`**
   - Temporarily moves API routes before build
   - Restores them after build completes
   - Handles errors and cleanup

2. **`scripts/tauri-build-wrapper.sh`**
   - Wrapper script that ensures API routes are always restored
   - Uses trap to restore on exit (even if build fails)
   - Runs the Next.js build with `TAURI_BUILD=true`

### How It Works

1. Before build: API routes are moved to `app/_api_backup`
2. Next.js build: Runs with static export (no API routes)
3. After build: API routes are restored from backup
4. Tauri build: Packages the static export into desktop app

## Configuration Changes

### next.config.mjs
- Added conditional static export: `output: process.env.TAURI_BUILD === 'true' ? 'export' : undefined`
- This allows normal Next.js development with API routes, but static export for Tauri builds

### tauri.conf.json
- Fixed bundle identifier: Changed from `com.smartparking.app` to `com.smartparking` (removed `.app` suffix)
- Updated `beforeBuildCommand` to use the wrapper script
- Configured bundle targets for Windows (msi, nsis) and macOS (app, dmg)

## Build Commands

### Windows Build
```bash
npm run build:windows
```

### macOS Build (Apple Silicon)
```bash
npm run build:macos
```

### macOS Build (Intel)
```bash
npm run build:macos-intel
```

### Current Platform
```bash
npm run desktop:build
```

## Notes

- API routes are not available in the desktop app build
- Camera proxy and streaming should be handled through direct backend API calls
- The desktop app connects to the Laravel backend API directly
- Development mode (`npm run desktop:dev`) still uses API routes normally

## Troubleshooting

If API routes are not restored after a failed build:
```bash
node scripts/prepare-tauri-build.js restore
```

If you need to manually prepare for build:
```bash
node scripts/prepare-tauri-build.js prepare
```



