# Building the Complete Installer - Version 1.1.0

This guide will help you build the complete offline installer that includes both the frontend desktop app and the Laravel backend.

## 📋 Prerequisites

Before building, ensure you have:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **Rust** - [Install from rustup.rs](https://rustup.rs/)
3. **Inno Setup** - [Download from jrsoftware.org](https://jrsoftware.org/isinfo.php)
   - After installation, add `iscc.exe` to your PATH or run from Inno Setup folder
4. **Internet Connection** (for first-time build to download PHP)

## 🚀 Quick Build

### Option 1: Automated Build (Recommended)

```powershell
cd installer
.\build-complete.bat
```

This script will:
1. ✅ Check for Inno Setup
2. ✅ Download PHP 8.2 portable (if needed)
3. ✅ Build the Tauri frontend (if not already built)
4. ✅ Copy backend files
5. ✅ Create production configuration
6. ✅ Build the installer with Inno Setup

### Option 2: PowerShell Script

```powershell
cd installer
.\build-installer.ps1 -Version "1.1.0"
```

Then compile with Inno Setup:
```powershell
iscc SmartParkingComplete.iss
```

## 📦 What Gets Built

The installer includes:

- **Frontend**: `Smart Parking System.exe` (Tauri desktop app v1.1.0)
- **Backend**: Complete Laravel API with all merged features
- **PHP Runtime**: Portable PHP 8.2 (auto-downloaded)
- **Database**: SQLite (auto-created on first run)
- **Startup Scripts**: Auto-start backend and frontend

## 📍 Output Location

After building, your installer will be at:

```
installer\output\SmartParkingSetup-1.1.0-Complete.exe
```

## 🔧 Manual Build Steps

If you prefer to build manually:

### Step 1: Build Frontend

```powershell
cd smart-parking-front
npm install
npm run desktop:build
```

The built executable will be at:
```
smart-parking-front\src-tauri\target\release\Smart Parking System.exe
```

### Step 2: Prepare Backend

The backend is automatically copied from `smart-parking-api` during the build process. It includes:
- All merged features from main branch
- Latest migrations (including `make_vehicles_body_type_id_nullable`)
- All services and repositories
- Production-ready configuration
- **Camera Detection System**:
  - Automatic detection fetching (every 2 seconds)
  - Queue processing (every 5 seconds)
  - Auto-reprocessing for existing vehicles (every 10 seconds)
  - Smart new vehicle handling (marks as pending for operator selection)

### Step 3: Download PHP (if needed)

PHP 8.2 portable will be automatically downloaded on first build. It's saved as:
```
installer\php-8.2.zip
```

### Step 4: Build Installer

```powershell
cd installer
iscc SmartParkingComplete.iss
```

## 📋 Installer Features

### What's Included:
- ✅ Smart Parking Desktop App v1.1.0
- ✅ Laravel Backend API (all merged features)
- ✅ Portable PHP 8.2 Runtime
- ✅ SQLite Database (auto-configured)
- ✅ Gate Control Integration
- ✅ Camera Detection System
  - **Immediate manual capture** - Operator clicks "Capture Vehicle" → Entry drawer opens instantly
  - Detected plate pre-filled in entry form (no queue waiting)
  - Detection marked as processed when entry is created
  - Background scheduler for automatic processing (optional, separate from manual capture)
  - Smart vehicle type selection for new vehicles
- ✅ Enhanced Vehicle Management
- ✅ Exit-Based Pricing System
- ✅ 24-Hour Rolling Period Charging
- ✅ Thermal Printer Support

### Installation Process:
1. User runs `SmartParkingSetup-1.1.0-Complete.exe`
2. Installer extracts all files to `C:\Program Files\SmartParking\`
3. First-run setup initializes database
4. Backend server starts automatically
5. Desktop app launches

### First Run:
- Database created at `C:\ProgramData\SmartParking\database.sqlite`
- Migrations run automatically
- Default admin account created (if seeded)
- Backend starts on `http://127.0.0.1:8000`
- Frontend connects automatically

## 🐛 Troubleshooting

### Build Fails - Inno Setup Not Found
**Solution**: Install Inno Setup and add to PATH, or run `iscc.exe` from Inno Setup installation folder.

### Frontend Not Building
**Solution**: 
- Ensure Rust is installed: `rustc --version`
- Ensure Node.js is installed: `node --version`
- Clean and rebuild: Delete `smart-parking-front\src-tauri\target` and rebuild

### PHP Download Fails
**Solution**: Check internet connection. PHP zip is ~30MB and will be cached after first download.

### Backend Copy Fails
**Solution**: Ensure `smart-parking-api` directory exists and is accessible.

### Installer Too Large
**Solution**: This is expected. The installer includes:
- Frontend (~50-100MB)
- Backend with vendor (~50MB)
- PHP Runtime (~30MB)
- Total: ~150-200MB compressed

## 📝 Version Information

- **Installer Version**: 1.1.0
- **Frontend Version**: 1.1.0
- **Backend Version**: Latest (with all merged features)
- **PHP Version**: 8.2.27

## 🎯 Next Steps

After building:

1. **Test the Installer**: Install on a clean Windows machine
2. **Verify Features**: Test all new features from the merge
3. **Check Database**: Ensure migrations ran correctly
4. **Test Backend**: Verify API endpoints work
5. **Test Frontend**: Verify desktop app connects to backend

## 📞 Support

For issues:
- Check `installer\README.md` for user-facing documentation
- Check `installer\CHANGELOG.md` for version history
- Review build logs in console output

