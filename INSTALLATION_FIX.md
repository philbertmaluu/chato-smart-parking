# Fix: Setup Stuck on Initialization

## Problem
The Smart Parking installer keeps initializing on startup and never completes.

## Solution

### Option 1: Delete App Data and Restart

1. Press `Win + R`
2. Type: `%LOCALAPPDATA%\SmartParking`
3. Delete the entire folder
4. Restart the app
5. Let it initialize fresh (first run takes 1-2 minutes)

### Option 2: Skip Initialization

If Option 1 doesn't work:

1. Uninstall Smart Parking from Control Panel
2. Manually delete: `C:\Program Files\SmartParking`
3. Restart computer
4. Download fresh installer: `SmartParkingSetup-1.1.0-Complete.exe`
5. Run as Administrator
6. Follow wizard completely
7. **WAIT** until it says "Installation Complete" before closing

### Option 3: Clean Install

1. Open PowerShell as Administrator
2. Run:
```powershell
# Remove app data
Remove-Item "$env:LOCALAPPDATA\SmartParking" -Recurse -Force -ErrorAction SilentlyContinue

# Remove installation
Remove-Item "C:\Program Files\SmartParking" -Recurse -Force -ErrorAction SilentlyContinue

# Restart
Restart-Computer
```

3. After restart, run installer again

### Option 4: Check Service

If stuck initializing, the backend service might be trying to start:

1. Press `Ctrl + Shift + Esc` (Task Manager)
2. Look for "Smart Parking" processes
3. End them all
4. Close Smart Parking window
5. Wait 30 seconds
6. Restart the app

## If Still Stuck

The issue is likely:
- **Missing database file** - Delete app data folder and restart
- **Port conflict** - Another app using port 8000
- **PHP not available** - Reinstall completely

Try Option 1 or Option 3 above.
