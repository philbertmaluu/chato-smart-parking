# Smart Parking Desktop App - SQLite Database Integration

Complete setup guide for the Smart Parking system with SQLite database and vehicle detection integration.

## Quick Start

### Prerequisites
- Windows 10/11 or macOS/Linux
- Rust 1.77.2+ ([Install](https://rustup.rs/))
- PHP 8.1+ ([Download](https://www.php.net/downloads))
- Node.js 18+ ([Download](https://nodejs.org/))
- SQLite 3.40+ (usually included)

### Setup (5 minutes)

```powershell
# Navigate to frontend directory
cd smart-parking-front

# Run setup script
./setup-desktop-app.ps1 -InitializeDb -BuildApp

# Start development
npm run tauri dev
```

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Smart Parking System                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  Camera Hardware │◄─────┤ ZKTeco Detection │            │
│  │  (at gate)       │      │   API            │            │
│  └──────────────────┘      └──────────────────┘            │
│           │                                                  │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────────────────────────────┐              │
│  │   BACKEND SERVER (Laravel PHP)          │              │
│  │   ├─ CameraDetectionService.php         │              │
│  │   ├─ CameraDetectionController.php      │              │
│  │   └─ Database (MySQL/SQLite)            │              │
│  └─────────────────────────────────────────┘              │
│           │                                                  │
│    ┌──────┴──────┐                                          │
│    │             │                                          │
│    ▼             ▼                                          │
│  ┌─────────────────────┐       ┌──────────────────────┐   │
│  │  FRONTEND (React)   │       │  DESKTOP APP (Tauri) │   │
│  │  VehicleEntry page  │       │  ├─ SQLite Database  │   │
│  │  Shows vehicle modal│       │  ├─ Detection Service│   │
│  │  for type selection │       │  └─ Offline sync     │   │
│  └─────────────────────┘       └──────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Vehicle Detection Flow

### How New Vehicles Are Detected and Processed

```
STEP 1: VEHICLE APPROACHES GATE
─────────────────────────────────
Camera at gate detects vehicle
Camera API provides:
  • Plate number: ABC123
  • Make: Toyota
  • Model: Camry
  • Color: White
  • Confidence: 0.95

         ▼

STEP 2: DETECTION STORED
─────────────────────────
Backend receives detection
CameraDetectionService:
  ├─ Check if vehicle exists
  ├─ Store in camera_detection_logs
  └─ Set status:
     ├─ "pending" (if vehicle exists)
     └─ "pending_vehicle_type" (if new)

         ▼

STEP 3: OPERATOR NOTIFICATION
──────────────────────────────
Frontend polls every 2.5 seconds
Checks for "pending_vehicle_type"
Shows modal automatically:
  ┌──────────────────────────┐
  │ New Vehicle Detected     │
  │ Plate: ABC123            │
  │ Make: Toyota             │
  │ Model: Camry             │
  │                          │
  │ Select Body Type:        │
  │ [▼ Select...]            │
  │                          │
  │ [Process Entry] [Cancel] │
  └──────────────────────────┘

         ▼

STEP 4: OPERATOR ACTION
───────────────────────
Operator:
  1. Selects body type (e.g., "SUV")
  2. Clicks "Process Entry"
  3. VehicleEntryDrawer opens
  4. Detected plate shows in input
  5. System searches for vehicle
  6. If not found → Create new vehicle
  7. Create vehicle passage/entry

         ▼

STEP 5: COMPLETION
──────────────────
Detection marked as "processed"
Vehicle added to parked vehicles
Modal closes automatically
Next detection can be processed
```

## Database Schema

### Main Tables

**camera_detection_logs** - All detections from camera
```
id (INTEGER PRIMARY KEY)
camera_detection_id INTEGER  - ID from camera API
gate_id INTEGER              - Which gate detected it
numberplate VARCHAR(50)      - Plate number (indexed)
detection_timestamp DATETIME - When detected
processing_status VARCHAR(50)- pending|pending_vehicle_type|processed|etc
direction INTEGER            - 0=entry, 1=exit
make_str VARCHAR(100)        - Vehicle make
model_str VARCHAR(100)       - Vehicle model
color_str VARCHAR(100)       - Vehicle color
processed BOOLEAN            - Has been processed
created_at DATETIME
updated_at DATETIME

INDEXES:
- numberplate (quick lookup)
- processing_status (for filtering)
- gate_id (for gate-specific queries)
- detection_timestamp (for date queries)
```

**local_vehicle_detections** - Desktop app tracking
```
id (INTEGER PRIMARY KEY)
camera_detection_log_id INTEGER - FK to camera_detection_logs
gate_id INTEGER                 - Where detected
plate_number VARCHAR(50)        - Plate
processing_status VARCHAR(50)   - new|processing|completed|failed
vehicle_found BOOLEAN           - Does vehicle exist
vehicle_id INTEGER              - If exists
body_type_selected BOOLEAN      - Operator selected type
body_type_id INTEGER            - Selected body type
operator_action VARCHAR(50)     - captured|processed|cancelled
operator_notes TEXT
created_at DATETIME
updated_at DATETIME
```

**desktop_sync_queue** - Queue for syncing with backend
```
id (INTEGER PRIMARY KEY)
entity_type VARCHAR(50)   - detection|vehicle_passage|transaction
entity_id INTEGER         - Entity ID
action VARCHAR(50)        - create|update|delete
data JSON                 - Entity data
synced BOOLEAN            - Has been synced
sync_attempts INTEGER     - Sync attempt count
last_sync_attempt DATETIME
sync_error TEXT           - Error message if failed
created_at DATETIME
```

## Configuration

### Environment Variables (.env.local)

```env
# Database Configuration
DB_CONNECTION=sqlite
SQLITE_DATABASE=./database/database.sqlite

# Application Environment
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=info

# Detection Settings
DETECTION_ENABLED=true
AUTO_PROCESS_EXISTING=true
POLLING_INTERVAL_MS=2500        # How often to check for new detections
CAMERA_FETCH_INTERVAL_MS=5000   # How often to fetch from camera

# Offline Mode
OFFLINE_MODE=false

# Sync Settings
MAX_SYNC_ATTEMPTS=5
DETECTION_RETENTION_DAYS=30
```

### Database Configuration (sqlite-schema.sql)

The complete schema is in `smart-parking-api/database/sqlite-schema.sql`

Initialize with:
```powershell
sqlite3 database/database.sqlite < smart-parking-api/database/sqlite-schema.sql
```

## Processing Status Values

```
pending                  Vehicle exists, awaiting processing
pending_vehicle_type     NEW vehicle, operator must select type
pending_exit             Exit detection, awaiting confirmation
manual_processing        Operator manually captured
processed                Successfully processed
completed                Final processing complete
failed                   Processing encountered error
archived                 Old detection, moved to archive
```

## API Endpoints

### Get Pending Vehicle Type Detections
```
GET /api/toll-v1/camera-detection/logs/pending/vehicle-type

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "numberplate": "ABC123",
      "detection_timestamp": "2025-12-14T10:30:00Z",
      "processing_status": "pending_vehicle_type",
      "vehicle_exists": false,
      "make_str": "Toyota",
      "model_str": "Camry",
      "color_str": "White"
    }
  ]
}
```

### Quick Capture
```
POST /api/toll-v1/camera-detection/quick-capture

Response:
{
  "success": true,
  "data": {
    "fetched": 1,
    "stored": 1,
    "detection": {
      "id": 1,
      "plate_number": "ABC123",
      "detection_timestamp": "2025-12-14T10:30:00Z"
    }
  }
}
```

### Process Detection with Vehicle Type
```
POST /api/toll-v1/camera-detection/{id}/process-with-vehicle-type

Request:
{
  "body_type_id": 2
}

Response:
{
  "success": true,
  "data": {
    "detection": {...},
    "vehicle": {...},
    "passage": {...}
  }
}
```

## Testing

### Run Test Suite
```powershell
# Full test suite
./test-detection-system.ps1

# Tests:
# 1. Database connectivity
# 2. Schema validation
# 3. Detection creation
# 4. Detection retrieval
# 5. Status updates
# 6. Sync queue
# 7. Analytics
# 8. Configuration
```

### Manual Testing Checklist

```
Camera & Detection:
☐ Camera detects vehicle
☐ Detection stored in database
☐ Correct plate number captured
☐ Vehicle make/model extracted

Frontend:
☐ VehicleEntry page loads
☐ Gate selection works
☐ Modal appears for new detections
☐ Body type selection displays

Operator Actions:
☐ Operator can select body type
☐ "Process Entry" button works
☐ VehicleEntryDrawer opens
☐ Detected plate shows in input
☐ Vehicle entry created

Database:
☐ Detection recorded
☐ Status updated to "processed"
☐ Vehicle created in database
☐ Vehicle passage created

Offline Mode:
☐ App works without backend
☐ Detections queued locally
☐ Sync queue populates
☐ Syncs when backend available
```

## Troubleshooting

### Detection Not Appearing

**Check:**
1. Camera connection status
2. Gate device configuration
3. Detection logs table (`SELECT COUNT(*) FROM camera_detection_logs;`)
4. Processing status values

**Debug:**
```powershell
# Check recent detections
sqlite3 database/database.sqlite
> SELECT id, numberplate, processing_status FROM camera_detection_logs ORDER BY created_at DESC LIMIT 5;
```

### Operator Modal Not Showing

**Check:**
1. Frontend polling interval (should be 2500ms)
2. API endpoint accessibility
3. Browser console for errors
4. Detection status in database

**Debug:**
```powershell
# Check pending vehicle type detections
sqlite3 database/database.sqlite
> SELECT COUNT(*) FROM camera_detection_logs WHERE processing_status='pending_vehicle_type';
```

### Sync Queue Not Processing

**Check:**
1. Backend server is running
2. Network connectivity
3. Sync queue table for errors
4. Max sync attempts not exceeded

**Debug:**
```powershell
# Check sync queue
sqlite3 database/database.sqlite
> SELECT id, entity_type, synced, sync_attempts, sync_error FROM desktop_sync_queue WHERE synced=0;
```

## Performance Optimization

### Database Optimization

```powershell
# Analyze database
sqlite3 database/database.sqlite "ANALYZE;"

# Vacuum to optimize
sqlite3 database/database.sqlite "VACUUM;"

# Check index usage
sqlite3 database/database.sqlite
> SELECT name, sql FROM sqlite_master WHERE type='index' AND sql NOT NULL;
```

### Memory Management

- Limit detection history (retention: 30 days)
- Archive old detections
- Cleanup sync queue after successful syncs
- Regular database optimization

## File Structure

```
smart-parking/
├── smart-parking-front/              # Desktop app (Tauri + React)
│   ├── src-tauri/
│   │   ├── src/
│   │   │   ├── lib.rs                # Tauri app module declarations
│   │   │   ├── main.rs               # Tauri entry point
│   │   │   ├── backend.rs            # PHP backend process management
│   │   │   ├── database.rs           # SQLite database module
│   │   │   └── detection_service.rs  # Vehicle detection logic
│   │   ├── Cargo.toml                # Rust dependencies
│   │   └── tauri.conf.json           # Tauri config
│   ├── app/
│   │   ├── operator/
│   │   │   └── entry/
│   │   │       └── page.tsx          # Main entry/detection page
│   │   └── manager/
│   │       └── detection-logs/
│   │           └── page.tsx          # Detection logs view
│   ├── utils/
│   │   └── api/
│   │       └── camera-detection-service.ts  # API service
│   ├── setup-desktop-app.ps1         # Setup script
│   └── package.json
│
├── smart-parking-api/                # Backend (Laravel PHP)
│   ├── app/
│   │   ├── Services/
│   │   │   └── CameraDetectionService.php
│   │   ├── Http/
│   │   │   └── Controllers/
│   │   │       └── CameraDetectionController.php
│   │   └── Models/
│   │       └── CameraDetectionLog.php
│   ├── database/
│   │   ├── migrations/               # Database migrations
│   │   ├── sqlite-schema.sql         # Complete SQLite schema
│   │   └── database.sqlite           # SQLite database (created at runtime)
│   ├── routes/
│   │   └── console.php               # Scheduler commands
│   └── composer.json
│
├── VEHICLE_DETECTION_COMPLETE.md     # Complete implementation guide
├── test-detection-system.ps1         # Test suite
└── test-detection-system.sh          # Test suite (bash)
```

## Important Notes

### Detection Processing

- **New vehicles** (status: `pending_vehicle_type`) require operator action to select body type
- **Existing vehicles** (status: `pending`) can be auto-processed if they don't have active passages
- **Operator capture** (status: `manual_processing`) is manual action, not auto-processed

### Offline Mode

When backend is unavailable:
1. Detections stored locally in SQLite
2. Sync queue queues all operations
3. When backend comes online, sync happens automatically
4. Application continues to work fully

### Data Retention

- Default retention: 30 days
- Old detections automatically cleaned up
- Configurable via `detection_retention_days` setting
- Sync queue items deleted after successful sync

## Support & Documentation

- See [VEHICLE_DETECTION_COMPLETE.md](VEHICLE_DETECTION_COMPLETE.md) for detailed documentation
- PHP backend setup: [smart-parking-api/README.md](smart-parking-api/README.md)
- Frontend setup: [smart-parking-front/README.md](smart-parking-front/README.md)

## License

This project is part of the Smart Parking System.
