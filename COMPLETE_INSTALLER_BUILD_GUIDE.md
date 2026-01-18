# Smart Parking - Complete Installer Build Guide

## Overview

Build a **complete, standalone Windows installer** that includes:
- ✅ Tauri desktop application
- ✅ Bundled Laravel backend  
- ✅ SQLite database
- ✅ PHP runtime
- ✅ All dependencies
- ✅ Zero initialization needed

## Prerequisites

### Required Software

1. **Rust** (1.77.2+)
   - Download: https://rustup.rs/
   - Install with default settings

2. **Node.js** (18+)
   - Download: https://nodejs.org/
   - Include npm

3. **PHP** (8.1+)
   - Download: https://www.php.net/downloads
   - Add to PATH

4. **Composer**
   - Download: https://getcomposer.org/download/
   - Install globally

5. **Inno Setup** (6.0+) - FOR INSTALLER CREATION
   - Download: https://jrsoftware.org/isdl.php
   - Install to default location

### System Requirements

- Windows 10/11 (64-bit)
- At least 4GB RAM
- 500MB free disk space
- Administrator access

## Build Instructions

### Option 1: Build Everything (Complete Installer)

```powershell
cd smart-parking
.\installer\build-complete-installer.ps1 -All -BuildType Release
```

This will:
1. ✅ Build Tauri app (release mode)
2. ✅ Prepare Laravel backend
3. ✅ Create .exe installer
4. ✅ Create portable package

### Option 2: Build Individual Components

**Just the Tauri App:**
```powershell
.\installer\build-complete-installer.ps1 -BuildApp -BuildType Release
```

**Just the Backend:**
```powershell
.\installer\build-complete-installer.ps1 -BuildBackend
```

**Just the Installer:**
```powershell
.\installer\build-complete-installer.ps1 -BuildInstaller
```

### Option 3: Clean Build (Remove Old Files)

```powershell
.\installer\build-complete-installer.ps1 -All -BuildType Release -CleanBuild
```

## What Gets Built

### 1. Executable Installer
- **File:** `SmartParkingSetup-[timestamp].exe`
- **Size:** ~200-300 MB
- **Location:** `installer/output/`
- **Features:**
  - One-click installation
  - Desktop shortcut creation
  - Start menu group
  - Automatic backend setup
  - Database initialization

### 2. Portable Package
- **Folder:** `SmartParking-Portable`
- **Size:** ~300-400 MB
- **No installation needed**
- **Run:** `start.bat` to launch
- **Perfect for:** USB drives, shared folders

## How the Installer Works

### Installation Steps

1. **User Downloads:** `SmartParkingSetup-1.1.0.exe`
2. **User Runs Installer**
   - Welcome screen
   - License agreement
   - Installation directory selection
   - Ready to install
3. **Installation Process**
   - Extracts files
   - Sets up directory structure
   - Configures backend
   - Creates database
4. **Post-Installation**
   - Creates Start menu shortcuts
   - Creates desktop icon (optional)
   - Launches app automatically
5. **First Run**
   - Backend service starts
   - Database initializes
   - App is ready to use

### Bundled Components

```
SmartParking/
├── app/
│   ├── Smart Parking.exe        (Tauri app)
│   └── *.dll                    (Runtime libraries)
├── backend/
│   ├── app/                     (Laravel code)
│   ├── config/                  (Configuration)
│   ├── routes/                  (API routes)
│   ├── database/                (Migrations)
│   └── storage/                 (Logs, cache)
├── php/                         (PHP runtime - if bundled)
├── data/                        (SQLite database)
├── .env                         (Configuration)
└── docs/                        (Documentation)
```

## Configuration

### .env Settings (Created During Install)

```env
APP_ENV=production
APP_DEBUG=false
DB_CONNECTION=sqlite
SQLITE_DATABASE=./data/database.sqlite
CAMERA_IP=192.168.0.107
CAMERA_COMPUTER_ID=1
```

### First Run Initialization

When the app first runs, it automatically:
1. ✅ Creates SQLite database
2. ✅ Runs migrations
3. ✅ Sets up directory structure
4. ✅ Starts PHP backend service
5. ✅ Initializes camera detection
6. ✅ Opens operator interface

## File Locations

### After Installation

```
C:\Program Files\SmartParking\
├── Smart Parking.exe            (Launch app)
├── backend\                     (Laravel code)
├── data\                        (SQLite database)
├── php\                         (PHP runtime)
├── docs\                        (Documentation)
└── docs\database\               (Schema files)
```

### User Data

```
C:\Users\[username]\AppData\Local\SmartParking\
├── logs\                        (Application logs)
├── cache\                       (Cached data)
└── detection-logs\              (Detection records)
```

## Build Output

### Typical Build Process

```
Step 1: Building Tauri Application
  ├─ Install npm dependencies
  ├─ Compile TypeScript
  ├─ Build React frontend
  ├─ Compile Rust backend
  └─ Create .exe executable
  Time: ~10-15 minutes

Step 2: Preparing Laravel Backend
  ├─ Install Composer dependencies
  ├─ Clear configuration cache
  ├─ Cache routes
  ├─ Cache views
  └─ Optimize autoloader
  Time: ~5-10 minutes

Step 3: Creating Installer
  ├─ Package all files
  ├─ Create .exe installer
  └─ Generate portable package
  Time: ~2-5 minutes

Total Time: ~20-30 minutes
```

## Installer Customization

### Update Version Number

Edit `SmartParkingInstaller.iss`:
```
#define AppVersion "1.2.0"
```

### Change Installation Directory

Edit `SmartParkingInstaller.iss`:
```
DefaultDirName={autopf}\YourAppName
```

### Add Custom Components

Edit `SmartParkingInstaller.iss`:
```
[Files]
Source: "your-file.exe"; DestDir: "{app}"
```

## Distribution

### For Internal Use

1. **Build installer:** `build-complete-installer.ps1 -All`
2. **Find file:** `installer/output/SmartParkingSetup-*.exe`
3. **Test installation** on clean machine
4. **Share** via:
   - Email
   - Shared drive
   - USB drive
   - Cloud storage

### For Public Distribution

1. **Sign installer** (requires code signing certificate)
   ```powershell
   build-complete-installer.ps1 -All -SignInstaller
   ```

2. **Create portable version**
   ```powershell
   build-complete-installer.ps1 -CreatePortable
   ```

3. **Generate checksums** for integrity verification
   ```powershell
   Get-FileHash "installer/output/SmartParkingSetup-*.exe"
   ```

4. **Upload** to website/repository

5. **Create release notes** with:
   - What's new
   - Installation instructions
   - System requirements
   - Known issues

## Troubleshooting

### Build Fails - Rust Not Found

**Solution:**
```powershell
# Install Rust
https://rustup.rs/
rustup default stable
```

### Build Fails - Node Not Found

**Solution:**
```powershell
# Install Node.js
https://nodejs.org/
node --version  # Verify
```

### Build Fails - PHP Not Found

**Solution:**
```powershell
# Add PHP to PATH
# Or install at: C:\php\
php --version  # Verify
```

### Inno Setup Not Found

**Solution:**
```powershell
# Install Inno Setup
https://jrsoftware.org/isdl.php
# Default: C:\Program Files (x86)\Inno Setup 6\
```

### Installer Size Too Large

**Solution:**
- Exclude development dependencies
- Remove test files
- Minimize Laravel vendor folder
  ```powershell
  composer install --no-dev --optimize-autoloader
  ```

## Verification

After building, verify:

```powershell
# Check installer exists
Test-Path "installer/output/SmartParkingSetup-*.exe"

# Check file size (should be 200-300 MB)
(Get-Item "installer/output/SmartParkingSetup-*.exe").Length / 1MB

# Verify executable
Get-Item "smart-parking-front\src-tauri\target\release\Smart Parking.exe"

# Verify Laravel backend
Test-Path "smart-parking-api\vendor\autoload.php"
```

## Testing Installation

### On Clean Machine

1. Download `SmartParkingSetup-*.exe`
2. Double-click to run
3. Follow installation wizard
4. Verify shortcuts created
5. Launch app from shortcut
6. Test basic functionality:
   - Open Operator > Entry
   - Select gate
   - Try capture vehicle
   - Verify database working

### Uninstall Testing

1. Control Panel > Programs > Uninstall
2. Find "Smart Parking"
3. Click Uninstall
4. Verify all files removed:
   ```powershell
   Test-Path "C:\Program Files\SmartParking"  # Should be False
   ```

## Next Steps

1. **Build installer:**
   ```powershell
   .\installer\build-complete-installer.ps1 -All -BuildType Release
   ```

2. **Test on clean Windows machine**

3. **Create installation guide** for end users

4. **Distribute** to stakeholders

5. **Gather feedback** and iterate

## Support

For issues during build:
- Check prerequisites are installed
- Run with admin privileges
- Check `build-complete-installer.ps1` logs
- Verify file permissions
- Ensure sufficient disk space

---

**Status:** Ready to build complete installer!
