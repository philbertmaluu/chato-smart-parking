# Resources Directory

This directory contains additional files that will be bundled with the installer.

## Visual C++ Redistributable

To bundle the Visual C++ Redistributable with your installer:

1. **Download the installer:**
   - Direct link: https://aka.ms/vs/17/release/vc_redist.x64.exe
   - Or visit: https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist

2. **Save it here:**
   - Rename the downloaded file to: `vcredist_x64.exe`
   - Place it in this directory: `src-tauri/resources/vcredist_x64.exe`

3. **The installer script will automatically:**
   - Check if VC++ Redistributable is already installed
   - Install it silently if missing
   - Skip installation if already present

## File Structure

```
src-tauri/
├── resources/
│   ├── vcredist_x64.exe  (download and place here)
│   └── README.md         (this file)
├── installer.nsh         (NSIS script that handles VC++ installation)
└── tauri.conf.json       (references the script and resource)
```

## Alternative: Manual Installation Instructions

If you prefer not to bundle the VC++ Redistributable, you can:

1. Add installation instructions to your app's documentation
2. Direct users to download from Microsoft's website
3. Include a link in your installer that opens the download page

However, bundling it provides the best user experience as it ensures the app will work on all Windows systems.

