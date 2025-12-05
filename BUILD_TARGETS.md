# Rust Build Targets Setup

## Installed Targets

The following Rust targets have been installed to enable cross-platform builds:

- ✅ `x86_64-apple-darwin` - macOS Intel (your current machine)
- ✅ `aarch64-apple-darwin` - macOS Apple Silicon (M1/M2/M3)
- ✅ `x86_64-pc-windows-msvc` - Windows 64-bit

## Build Commands

### macOS Builds

The `build:macos` command automatically detects your architecture:
- On Intel Mac: builds for `x86_64-apple-darwin`
- On Apple Silicon: builds for `aarch64-apple-darwin`

```bash
npm run build:macos
```

For specific architectures:
```bash
npm run build:macos-intel    # Intel Mac
npm run build:macos-arm      # Apple Silicon
```

### Windows Builds

```bash
npm run build:windows
```

**Note:** Cross-compiling Windows from macOS requires additional setup. You may need:
- Windows linker tools (can be installed via `rustup target add x86_64-pc-windows-msvc`)
- For full Windows builds, consider using GitHub Actions or a Windows machine

### Current Machine

You are on: **Intel Mac (x86_64)**

Recommended builds:
- `npm run build:macos-intel` - Native build (fastest)
- `npm run build:macos-arm` - Cross-compile for Apple Silicon
- `npm run build:windows` - Cross-compile for Windows (may require additional tools)

## Adding More Targets

To add additional targets:

```bash
# Linux
rustup target add x86_64-unknown-linux-gnu

# Windows 32-bit
rustup target add i686-pc-windows-msvc

# List all available targets
rustup target list

# List installed targets
rustup target list --installed
```

## Troubleshooting

### Windows Cross-Compilation Issues

If Windows builds fail on macOS, you may need:

1. **Install Windows linker:**
   ```bash
   # Install via Homebrew (if available)
   brew install mingw-w64
   ```

2. **Or use GitHub Actions:**
   - Set up a GitHub Actions workflow to build Windows on Windows runners
   - This is the most reliable method for Windows builds

### Architecture Detection

To check your current architecture:
```bash
uname -m
# x86_64 = Intel
# arm64 = Apple Silicon
```



