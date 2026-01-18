# Quick Start - Vehicle Detection System

## Get Started in 5 Minutes

```powershell
# 1. Navigate to the frontend directory
cd smart-parking-front

# 2. Run the setup script
./setup-desktop-app.ps1 -InitializeDb -BuildApp

# 3. Start development
npm run tauri dev
```

## Test the System

```powershell
# Run comprehensive test suite
./test-detection-system.ps1
```

## Manual Testing

1. **Open the app** (`npm run tauri dev`)
2. **Navigate to** "Operator > Entry"
3. **Select a gate** from the dropdown
4. **Click "Capture Vehicle"** button
5. **Modal appears** showing detected vehicle
6. **Select body type** (e.g., "SUV", "Sedan", etc.)
7. **Click "Process Entry"**
8. **Vehicle entry created** in the system

## What Was Built

### 1. SQLite Database
- `database/sqlite-schema.sql` - Complete schema with 7 tables
- Offline-capable local database
- Sync queue for backend synchronization

### 2. Rust Backend (Tauri)
- `src-tauri/src/database.rs` - SQLite driver
- `src-tauri/src/detection_service.rs` - Detection logic
- Full offline operation support

### 3. Setup & Testing
- `setup-desktop-app.ps1` - Automated setup
- `test-detection-system.ps1` - Comprehensive tests

### 4. Documentation
- `SMART_PARKING_DETECTION_SUMMARY.md` - Overview
- `VEHICLE_DETECTION_COMPLETE.md` - Detailed guide
- `DESKTOP_APP_SETUP_GUIDE.md` - Quick reference
- `COMPLETE_INTEGRATION_GUIDE.ps1` - Architecture
- `IMPLEMENTATION_CHECKLIST.md` - What was done

## How Detection Works

```
CAMERA DETECTS VEHICLE
        ↓
BACKEND STORES DETECTION
        ↓
STATUS: "pending_vehicle_type" (NEW VEHICLE)
        ↓
FRONTEND SHOWS MODAL
        ↓
OPERATOR SELECTS BODY TYPE
        ↓
VEHICLE ENTRY CREATED
        ↓
STATUS: "processed" → COMPLETE
```

## Key Features

✅ **Automatic Detection** - Detects vehicles automatically
✅ **Operator UI** - Modal for body type selection
✅ **Offline Mode** - Works without backend
✅ **Sync Queue** - Queues operations for backend sync
✅ **SQLite Database** - Local persistent storage
✅ **Error Recovery** - Automatic retries on failure
✅ **Performance** - Optimized with proper indices
✅ **Well Documented** - Complete guides included

## System Architecture

```
CAMERA → BACKEND API → DATABASE
                          ↓
                     FRONTEND (POLLS)
                          ↓
                   OPERATOR MODAL
                          ↓
                   VEHICLE ENTRY
```

## File Locations

| What | Where |
|------|-------|
| SQLite Schema | `smart-parking-api/database/sqlite-schema.sql` |
| Rust Database Module | `smart-parking-front/src-tauri/src/database.rs` |
| Rust Detection Service | `smart-parking-front/src-tauri/src/detection_service.rs` |
| Setup Script | `smart-parking-front/setup-desktop-app.ps1` |
| Test Suite | `smart-parking-front/test-detection-system.ps1` |
| Documentation | `*.md` files in root directory |

## Environment Configuration

Default settings in `.env.local`:

```env
DB_CONNECTION=sqlite
SQLITE_DATABASE=./database/database.sqlite
DETECTION_ENABLED=true
POLLING_INTERVAL_MS=2500
OFFLINE_MODE=false
```

## API Endpoints

**Get pending detections:**
```
GET /api/toll-v1/camera-detection/logs/pending/vehicle-type
```

**Process with body type:**
```
POST /api/toll-v1/camera-detection/{id}/process-with-vehicle-type
```

**Quick capture:**
```
POST /api/toll-v1/camera-detection/quick-capture
```

## Troubleshooting

### Modal not showing?
- Check polling interval setting
- Verify API endpoint accessible
- Review browser console for errors

### Database errors?
- Ensure SQLite installed
- Check file permissions
- Verify path in .env.local

### Detection not working?
- Check camera connection
- Verify gate configuration
- Review detection logs in database

## Next Steps

1. ✅ **Setup** - Run `setup-desktop-app.ps1`
2. ✅ **Test** - Run `test-detection-system.ps1`
3. ✅ **Develop** - Run `npm run tauri dev`
4. ✅ **Build** - Run `npm run tauri build` for production

## Support

- **Quick Reference**: `DESKTOP_APP_SETUP_GUIDE.md`
- **Full Details**: `VEHICLE_DETECTION_COMPLETE.md`
- **Architecture**: `COMPLETE_INTEGRATION_GUIDE.ps1`
- **Verification**: `IMPLEMENTATION_CHECKLIST.md`

---

**Ready to go!** Follow the 5-minute quick start above to begin.
