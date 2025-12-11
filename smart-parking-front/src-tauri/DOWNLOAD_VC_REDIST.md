# Download Visual C++ Redistributable

## Quick Download

Download the Visual C++ Redistributable installer and save it to the resources folder:

**Direct Download Link:**
https://aka.ms/vs/17/release/vc_redist.x64.exe

## Steps:

1. **Download the file:**
   - Click the link above or visit: https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist
   - Download the **x64** version (for 64-bit Windows)

2. **Save to resources folder:**
   - Rename the downloaded file to: `vcredist_x64.exe`
   - Place it in: `src-tauri/resources/vcredist_x64.exe`

3. **Verify the file:**
   - File should be approximately 26-30 MB
   - File name should be exactly: `vcredist_x64.exe`

4. **Rebuild your installer:**
   ```bash
   npm run desktop:build
   ```

## What This Does

The installer will automatically:
- ✅ Check if VC++ Redistributable is already installed
- ✅ Install it silently if missing (no user interaction needed)
- ✅ Skip installation if already present
- ✅ Show appropriate messages during installation

This ensures your app will work on all Windows systems, even fresh installs without Visual C++ Redistributable.

## Alternative: Online Download

If you prefer not to bundle it (smaller installer size), you can modify the installer script to:
- Check if VC++ is installed
- Open a download link if missing
- Let users install it manually

However, bundling provides the best user experience.

