# Building Offline Installer for Smart Parking System

This guide will help you create a standalone `.exe` installer that can be installed on any Windows PC without internet connection.

## 📦 What's Included in the Offline Installer

The NSIS installer automatically bundles:
- ✅ Smart Parking System application
- ✅ WebView2 Runtime (if not already installed)
- ✅ All application dependencies
- ✅ Desktop and Start Menu shortcuts
- ✅ Uninstaller

## 🚀 Building the Installer

### Step 1: Navigate to Frontend Directory

```powershell
cd smart-parking-front
```

### Step 2: Build the Installer

```powershell
npm run desktop:build
```

This will:
1. Build the Next.js frontend
2. Compile the Rust Tauri application
3. Create the NSIS installer with all dependencies bundled

### Step 3: Find Your Installer

After building, your installer will be located at:

```
smart-parking-front\src-tauri\target\release\bundle\nsis\
Smart Parking System_1.1.0_x64-setup.exe
```

## 📋 Installer Details

- **File Name**: `Smart Parking System_1.1.0_x64-setup.exe`
- **Size**: Approximately 50-100 MB (includes WebView2 runtime)
- **Format**: NSIS Installer (.exe)
- **Installation Mode**: Per Machine (requires admin rights)
- **Compression**: LZMA (maximum compression)

## 💻 System Requirements

The target PC must have:
- Windows 10/11 (64-bit)
- Administrator privileges for installation
- No internet connection required during installation

## 🔧 Installation Process

1. Copy `Smart Parking System_1.1.0_x64-setup.exe` to the target PC
2. Right-click and select "Run as Administrator"
3. Follow the installation wizard
4. The installer will:
   - Install WebView2 Runtime (if needed)
   - Install the application
   - Create desktop shortcut
   - Create Start Menu entry
   - Register uninstaller

## 📍 Installation Location

The application will be installed to:
```
C:\Program Files\Smart Parking System\
```

## 🗑️ Uninstallation

Users can uninstall via:
- **Control Panel** → Programs → Uninstall a program
- **Settings** → Apps → Smart Parking System → Uninstall

## ⚠️ Important Notes

1. **First Installation**: The installer will download WebView2 Runtime if not present (requires internet only on first run)
2. **Offline Installation**: For completely offline installation, ensure WebView2 is pre-installed on target PCs
3. **Admin Rights**: Installation requires administrator privileges
4. **API Connection**: The app still needs internet connection to connect to your Laravel API backend

## 🔄 Updating the Version

To update the version number:

1. Update `version` in `src-tauri/tauri.conf.json`
2. Update `version` in `src-tauri/Cargo.toml`
3. Update `version` in `package.json`
4. Rebuild: `npm run desktop:build`

## 🎯 Distribution

You can distribute the installer via:
- USB drive
- Network share
- Email (if size allows)
- Download link
- CD/DVD

## 🐛 Troubleshooting

### Build Fails
- Ensure Rust is installed: `rustc --version`
- Ensure Node.js is installed: `node --version`
- Clean build: Delete `src-tauri/target` and rebuild

### Installer Too Large
- The installer includes WebView2 runtime (~50MB)
- This is necessary for offline installation
- Consider using MSI format for enterprise deployment

### Installation Fails
- Ensure target PC has Windows 10/11 (64-bit)
- Run installer as Administrator
- Check Windows Event Viewer for errors

## 📞 Support

For issues or questions, check:
- `INSTALLER_SETUP.md` for detailed configuration
- `CHANGELOG.md` for version history
- Application logs in: `%APPDATA%\Smart Parking System\`

