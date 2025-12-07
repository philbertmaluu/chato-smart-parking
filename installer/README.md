# Smart Parking System - Desktop Installer

This folder contains scripts to build a Windows desktop installer for the Smart Parking System.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Rust** (for Tauri) - Install from https://rustup.rs
3. **Inno Setup** (for installer) - Download from https://jrsoftware.org/isinfo.php
4. **PHP 8.2** (will be downloaded automatically)

## Quick Build

### Option 1: Using PowerShell Script

```powershell
cd installer
.\build-installer.ps1
```

### Option 2: Manual Build

1. **Build the Tauri frontend:**
   ```bash
   cd smart-parking-front
   npm install
   npm run desktop:build
   ```

2. **Run the Inno Setup compiler:**
   ```bash
   iscc SmartParking.iss
   ```

3. **Find the installer in:** `installer\output\SmartParkingSetup-1.1.0-Complete.exe`

## What's Included in the Installer

- ✅ Smart Parking Desktop App v1.1.0 (Tauri/React)
- ✅ Laravel Backend API (with all merged features)
- ✅ Portable PHP Runtime
- ✅ SQLite Database (auto-created on first run)
- ✅ Printer integration support
- ✅ Gate Control Integration
- ✅ Camera Detection System
  - Immediate body type selection (no queue)
  - Operator clicks "Capture Vehicle" → Body type modal opens instantly
  - Detected plate shown in modal
  - Operator selects body type and processes/cancels
  - Vehicle added to parked page when processed
  - Background scheduler for automatic processing (optional)
- ✅ Enhanced Vehicle Management (flexible body types)
- ✅ Exit-Based Pricing System
- ✅ 24-Hour Rolling Period Charging

## Installation Requirements (End Users)

- Windows 10/11 (64-bit)
- 500MB disk space
- Network connection for camera integration
- Thermal receipt printer (optional)

## First Run Setup

When the application is first launched:
1. Database is automatically created
2. Default admin account is created
3. Backend server starts automatically
4. Frontend application opens

## Default Login

- **Email:** admin@smartparking.com
- **Password:** password123

## Troubleshooting

### Backend won't start
- Check if port 8000 is available
- Run `start-backend.bat` manually to see errors

### Printer not working
- Share the printer in Windows with name: `POS80C`
- Check printer connection in settings

### Database issues
- Delete `C:\ProgramData\SmartParking\database.sqlite`
- Restart the application (will recreate database)

