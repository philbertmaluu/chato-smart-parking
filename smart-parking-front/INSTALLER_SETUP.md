# Smart Parking System - Desktop Installer Setup

## 📦 Installer Configuration

The desktop application installer has been configured with the following settings:

### Version Information
- **Version**: 1.1.0
- **Product Name**: Smart Parking System
- **Identifier**: com.smartparking.desktop
- **Publisher**: Smart Parking

### Installer Types

#### NSIS Installer (Recommended)
- **Format**: Windows Installer (.exe)
- **Compression**: LZMA (maximum compression)
- **Install Mode**: Per Machine (requires admin)
- **Features**:
  - Desktop shortcut creation
  - Start Menu shortcut
  - Run application after installation
  - Custom installer menu
  - Elevation support for admin installation
  - No downgrades allowed (prevents installing older versions)

#### MSI Installer
- **Format**: Windows Installer Package (.msi)
- **Language**: English (en-US)
- **UI**: Enabled with custom branding support
- **Features**:
  - Standard Windows Installer format
  - Better integration with enterprise deployment tools
  - Group Policy support

### Installation Options

#### NSIS Installer Options:
- ✅ Create Desktop Shortcut
- ✅ Create Start Menu Shortcut
- ✅ Run Application After Installation
- ✅ Allow Elevation (Admin Rights)
- ✅ Custom Installer Menu
- ❌ One-Click Install (disabled for better control)
- ❌ Delete App Data on Uninstall (preserves user data)

### Build Commands

#### Build for Windows (NSIS + MSI):
```bash
npm run desktop:build
```

#### Build NSIS Installer Only:
```bash
npm run tauri build -- --bundles nsis
```

#### Build MSI Installer Only:
```bash
npm run tauri build -- --bundles msi
```

#### Build for Specific Windows Target:
```bash
npm run build:window
# or
npm run tauri build -- --target x86_64-pc-windows-msvc
```

### Output Locations

After building, installers will be located at:

```
src-tauri/target/release/bundle/
├── nsis/
│   └── Smart Parking System_1.1.0_x64-setup.exe  (NSIS Installer)
└── msi/
    └── Smart Parking System_1.1.0_x64_en-US.msi  (MSI Installer)
```

### Installer Features

#### What's Included:
1. **Application Files**: All necessary application binaries and resources
2. **WebView2 Runtime**: Automatic installation if not present
3. **Desktop Shortcut**: Quick access from desktop
4. **Start Menu Entry**: Accessible from Windows Start Menu
5. **Uninstaller**: Complete removal option via Control Panel

#### Installation Process:
1. User runs the installer (.exe or .msi)
2. Installer checks for admin rights (if perMachine mode)
3. WebView2 runtime is installed if needed
4. Application files are extracted and installed
5. Shortcuts are created
6. Application can be launched automatically

### Customization Options

#### To Add Custom Installer Images:
1. Create header image (150x57 pixels, BMP format)
2. Create sidebar image (164x314 pixels, BMP format)
3. Update `tauri.conf.json`:
   ```json
   "nsis": {
     "headerImage": "path/to/header.bmp",
     "sidebarImage": "path/to/sidebar.bmp"
   }
   ```

#### To Add License Agreement:
1. Create license file (RTF or TXT format)
2. Update `tauri.conf.json`:
   ```json
   "wix": {
     "license": "path/to/license.rtf"
   }
   ```

### Version 1.1.0 New Features

The installer includes all new features from the merge:

- ✨ **Flexible Vehicle Entry**: Vehicles can be entered without body type
- 💰 **Exit-Based Pricing**: Fees calculated on exit based on time spent
- ⏰ **24-Hour Rolling Periods**: Fair daily charging model
- 🎫 **Paid Pass Tracking**: Automatic free exit for active passes
- 🚪 **Gate Control Integration**: Hardware integration support
- 🖨️ **Thermal Printer Support**: Zy-Q822 receipt printing
- 📷 **Enhanced Camera Detection**: Improved vehicle type handling

### System Requirements

- **OS**: Windows 10 (64-bit) or Windows 11
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space
- **Network**: Internet connection for API access
- **Optional**: Camera and thermal printer support

### Distribution

#### For End Users:
- Distribute the `.exe` file (NSIS installer) - easier for end users
- Or distribute the `.msi` file for enterprise deployment

#### For Enterprise:
- Use MSI installer for Group Policy deployment
- Supports silent installation: `msiexec /i "Smart Parking System_1.1.0_x64_en-US.msi" /quiet`

### Troubleshooting

#### Installation Issues:
1. **Admin Rights Required**: Run installer as Administrator
2. **WebView2 Missing**: Installer will download and install automatically
3. **Antivirus Warning**: May flag new executable - add to exclusions if needed

#### Build Issues:
1. **Rust Not Found**: Install Rust toolchain
2. **NSIS Not Found**: Tauri CLI will download automatically
3. **Build Fails**: Check that all dependencies are installed

### Next Steps

1. **Build the Installer**:
   ```bash
   cd smart-parking-front
   npm run desktop:build
   ```

2. **Test the Installer**:
   - Install on a clean Windows machine
   - Test all features
   - Verify shortcuts work
   - Test uninstallation

3. **Distribute**:
   - Upload to distribution platform
   - Share with beta testers
   - Deploy to production

---

**Last Updated**: December 5, 2025
**Version**: 1.1.0

