# Vehicle Detection System - Complete Implementation Guide

## Overview

This document provides a comprehensive guide to the vehicle detection system for the Smart Parking Desktop Application. The system handles automatic detection of vehicles entering parking facilities, processes detection data, and manages operator interactions for vehicle type selection.

## Architecture

### Detection Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMERA DETECTION FLOW                      │
└─────────────────────────────────────────────────────────────┘

1. CAMERA CAPTURE
   │
   ├─ ZKTeco Camera API
   │  └─ Returns: Plate number, Make, Model, Color, Confidence
   │
   └─ Detection Sent to System

2. BACKEND PROCESSING (Laravel)
   │
   ├─ CameraDetectionService.php
   │  ├─ Fetch detection from camera API
   │  ├─ Store in camera_detection_logs table
   │  ├─ Check vehicle in database
   │  └─ Set processing_status
   │
   └─ Status Assignment:
      ├─ "pending" → Existing vehicle
      ├─ "pending_vehicle_type" → New vehicle (needs body type)
      ├─ "manual_processing" → Operator capture
      └─ "processed" → Completed

3. FRONTEND POLLING
   │
   ├─ VehicleEntry page polls backend
   ├─ Checks for pending_vehicle_type detections
   ├─ Shows VehicleTypeSelectionModal when found
   │
   └─ Operator Actions:
      ├─ Select body type
      ├─ Click "Process Entry"
      └─ Detection marked as "processed"

4. DESKTOP APP (OFFLINE MODE)
   │
   ├─ SQLite Database
   │  ├─ camera_detection_logs
   │  ├─ local_vehicle_detections
   │  ├─ desktop_sync_queue
   │  └─ detection_analytics
   │
   ├─ Detection Service (Rust)
   │  ├─ Monitors local database
   │  ├─ Notifies UI of new detections
   │  └─ Processes operator actions
   │
   └─ UI Integration
      ├─ Shows new vehicle detected popup
      ├─ Operator selects vehicle type
      └─ Queues for sync when online
```

## Database Schema

### Core Tables

#### `camera_detection_logs`
Stores all camera detections from the ZKTeco camera system.

```sql
CREATE TABLE camera_detection_logs (
    id INTEGER PRIMARY KEY,
    camera_detection_id INTEGER,          -- ID from camera API
    gate_id INTEGER,                      -- Associated gate
    numberplate VARCHAR(50),              -- Detected plate number
    detection_timestamp TIMESTAMP,        -- When detected
    processing_status VARCHAR(50),        -- pending, pending_vehicle_type, processed, etc.
    direction INTEGER,                    -- 0=entry, 1=exit
    make_str VARCHAR(100),                -- Vehicle make
    model_str VARCHAR(100),               -- Vehicle model
    color_str VARCHAR(100),               -- Vehicle color
    processed BOOLEAN,                    -- Has been processed
    processed_at TIMESTAMP,               -- When processed
    processing_notes TEXT,                -- Processing notes
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

Indexes:
- numberplate        (for quick lookup by plate)
- gate_id           (for filtering by gate)
- detection_timestamp (for chronological queries)
- processing_status (for status-based filtering)
```

#### `local_vehicle_detections`
Desktop app specific tracking of detections and operator actions.

```sql
CREATE TABLE local_vehicle_detections (
    id INTEGER PRIMARY KEY,
    camera_detection_log_id INTEGER,    -- FK to camera_detection_logs
    gate_id INTEGER,                    -- Gate where detected
    plate_number VARCHAR(50),           -- Plate number
    detection_timestamp TIMESTAMP,      -- Detection time
    processing_status VARCHAR(50),      -- new, processing, completed, failed
    vehicle_found BOOLEAN,              -- Vehicle exists in system
    vehicle_id INTEGER,                 -- If vehicle exists
    body_type_selected BOOLEAN,         -- Operator selected type
    body_type_id INTEGER,               -- Selected body type
    operator_action VARCHAR(50),        -- captured, processed, cancelled, archived
    operator_notes TEXT,                -- Notes from operator
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### `desktop_sync_queue`
Queue for syncing local detections with backend when online.

```sql
CREATE TABLE desktop_sync_queue (
    id INTEGER PRIMARY KEY,
    entity_type VARCHAR(50),            -- detection, vehicle_passage, transaction
    entity_id INTEGER,                  -- ID of the entity
    action VARCHAR(50),                 -- create, update, delete
    data JSON,                          -- Entity data
    synced BOOLEAN,                     -- Whether synced
    sync_attempts INTEGER,              -- Sync attempt count
    last_sync_attempt TIMESTAMP,        -- Last sync time
    sync_error TEXT,                    -- Sync error message
    created_at TIMESTAMP
);
```

## Processing Status Values

```
pending                  - Detection waiting for processing
pending_vehicle_type     - New vehicle, waiting for operator to select type
pending_exit             - Exit detection, waiting for operator confirmation
manual_processing        - Operator manually captured
processed                - Successfully processed
completed                - Final processing complete
failed                   - Processing failed
archived                 - Old detection, archived
```

## Detection Processing Logic

### Vehicle Entry Flow

```
1. DETECTION ARRIVES
   Camera detects vehicle → Camera Detection API called
   
2. BACKEND PROCESSING
   CameraDetectionService.php
   ├─ Fetch latest detection from camera
   ├─ Check if vehicle exists in database
   │  ├─ If exists → Set status to "pending"
   │  └─ If new → Set status to "pending_vehicle_type"
   └─ Store in camera_detection_logs
   
3. FRONTEND POLLING
   VehicleEntry page
   ├─ Polls every 2.5 seconds
   ├─ Checks for "pending_vehicle_type" detections
   └─ If found → Show VehicleTypeSelectionModal
   
4. OPERATOR INTERACTION
   ├─ Sees detection popup
   ├─ Selects vehicle body type (or skips for existing)
   ├─ Clicks "Process Entry"
   └─ VehicleEntryDrawer opens with detected plate
   
5. COMPLETION
   ├─ Vehicle entry created
   ├─ Detection marked as "processed"
   ├─ Vehicle added to parked vehicles list
   └─ Modal closes automatically
```

### Auto-Processing (Existing Vehicles)

When a known vehicle is detected:

```
1. Detection status = "pending"
2. Backend checks active passages
3. If no active passage:
   └─ Auto-process as new entry
4. If active passage:
   └─ Check for matching exit
   └─ If matches → Auto-process as exit
   └─ If not matches → Error, require operator override
```

## Code Integration Points

### Backend (PHP/Laravel)

**File:** `app/Services/CameraDetectionService.php`

```php
// Main processing method
public function processUnprocessedDetections()
{
    $detections = CameraDetectionLog::where('processing_status', 'pending')
        ->get();
    
    foreach ($detections as $detection) {
        $vehicle = $this->vehicleRepository->findByPlate($detection->numberplate);
        
        if (!$vehicle) {
            // New vehicle - mark for type selection
            $detection->update(['processing_status' => 'pending_vehicle_type']);
        } else {
            // Existing vehicle - can auto-process
            $this->passageService->processVehicleEntry(
                $detection->numberplate,
                $detection->gate_id
            );
        }
    }
}
```

**File:** `app/Http/Controllers/API/CameraDetectionController.php`

```php
// Quick capture endpoint
public function quickCapture(Request $request)
{
    $gate = $this->getOperatorGate($request);
    $device = $gate->cameraDevice;
    
    $service = new CameraDetectionService(...);
    $service->setCameraFromDevice($device);
    
    // Fetch latest detection from camera
    $detection = $service->fetchLatestDetection();
    
    return response()->json([
        'success' => true,
        'data' => [
            'detection' => $detection
        ]
    ]);
}
```

### Frontend (TypeScript/React)

**File:** `utils/api/camera-detection-service.ts`

```typescript
export class CameraDetectionService {
    // Get pending detections requiring vehicle type selection
    static async getPendingVehicleTypeDetections() {
        return get(API_ENDPOINTS.CAMERA_DETECTION.LOGS_PENDING_VEHICLE_TYPE);
    }
    
    // Process detection with selected vehicle type
    static async processWithVehicleType(detectionId: number, bodyTypeId?: number) {
        return post(
            API_ENDPOINTS.CAMERA_DETECTION.PROCESS_WITH_VEHICLE_TYPE(detectionId),
            { body_type_id: bodyTypeId }
        );
    }
    
    // Quick capture for manual operator action
    static async quickCapture() {
        return post(API_ENDPOINTS.CAMERA_DETECTION.QUICK_CAPTURE, {});
    }
}
```

**File:** `app/operator/entry/page.tsx`

```typescript
// Main entry page with detection handling
const handleCaptureVehicle = async () => {
    const result = await CameraDetectionService.quickCapture();
    
    if (result.success && result.data.detection) {
        const detection = {
            id: result.data.detection.id,
            numberplate: result.data.detection.plate_number,
            ...
        };
        
        setCapturedDetection(detection);
        setShowVehicleTypeModal(true);
    }
};
```

### Desktop App (Rust/Tauri)

**File:** `src-tauri/src/database.rs`

```rust
impl DesktopDatabase {
    // Store new detection
    pub fn store_detection(...) -> Result<i64, String> {
        self.connection.execute(
            "INSERT INTO camera_detection_logs (...) VALUES (...)",
            params![...]
        )?;
        Ok(self.connection.last_insert_rowid())
    }
    
    // Get pending detections
    pub fn get_pending_detections(...) -> Result<Vec<CameraDetectionLog>, String> {
        // Query detections with status = 'pending' or 'pending_vehicle_type'
    }
}
```

**File:** `src-tauri/src/detection_service.rs`

```rust
pub struct VehicleDetectionService {
    db: Arc<Mutex<DesktopDatabase>>,
}

impl VehicleDetectionService {
    // Process new detection event
    pub fn process_detection(...) -> Result<VehicleDetectionEvent, String> {
        let db = self.db.lock().unwrap();
        
        // Store in local database
        let detection_id = db.store_detection(...)?;
        
        // Create local tracking record
        let local_id = db.create_local_detection(...)?;
        
        // Mark for operator action if entry
        if is_entry {
            db.update_detection_status(detection_id, "pending_vehicle_type", ...)?;
        }
        
        Ok(VehicleDetectionEvent { ... })
    }
    
    // Process operator action (body type selection)
    pub fn process_with_vehicle_type(...) -> Result<ProcessingResult, String> {
        let db = self.db.lock().unwrap();
        
        // Update status to processed
        db.update_detection_status(detection_id, "processed", ...)?;
        
        // Record operator action
        db.record_operator_action(...)?;
        
        // Add to sync queue
        db.add_to_sync_queue(...)?;
        
        Ok(ProcessingResult { ... })
    }
}
```

## Deployment

### Prerequisites

- Rust 1.77.2 or later
- PHP 8.1+
- Node.js 18+
- SQLite 3.40+

### Build Instructions

```bash
# 1. Setup desktop app
cd smart-parking-front
./setup-desktop-app.ps1 -BuildApp

# 2. Development
npm run tauri dev

# 3. Production build
npm run tauri build
```

### Configuration

Environment variables in `.env.local`:

```env
# Database
DB_CONNECTION=sqlite
SQLITE_DATABASE=./database/database.sqlite

# Detection
DETECTION_ENABLED=true
AUTO_PROCESS_EXISTING=true
POLLING_INTERVAL_MS=2500
CAMERA_FETCH_INTERVAL_MS=5000

# Offline Mode
OFFLINE_MODE=false
```

## Testing

### Unit Tests

```bash
# Test Rust detection service
cd smart-parking-front/src-tauri
cargo test detection_service

# Test PHP camera detection service
cd smart-parking-api
php artisan test tests/Unit/Services/CameraDetectionServiceTest.php
```

### Integration Tests

```bash
# Test full detection flow
php artisan test tests/Feature/DetectionFlowTest.php

# Test manual capture
php artisan test tests/Feature/ManualCaptureTest.php
```

### Manual Testing Checklist

- [ ] Camera detects vehicle
- [ ] Detection stored in database
- [ ] Frontend shows vehicle type modal
- [ ] Operator selects body type
- [ ] Vehicle entry created
- [ ] Detection marked as processed
- [ ] Exit detection works
- [ ] Offline mode queues for sync
- [ ] Sync queue processes when online
- [ ] Analytics updated correctly

## Troubleshooting

### Detection Not Appearing

1. Check camera connection
2. Verify gate configuration
3. Check detection log table for records
4. Verify processing status values

### Operator Modal Not Showing

1. Check frontend polling interval
2. Verify API endpoint accessibility
3. Check browser console for errors
4. Verify detection status in database

### Sync Queue Not Processing

1. Check network connectivity
2. Verify backend server running
3. Check sync queue table
4. Review sync error messages

### Performance Issues

1. Check database indices
2. Archive old detections
3. Optimize polling interval
4. Check server resources

## API Endpoints

### GET /api/toll-v1/camera-detection/logs/pending/vehicle-type
Get detections pending vehicle type selection

Response:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "numberplate": "ABC123",
            "detection_timestamp": "2025-12-14T10:30:00Z",
            "processing_status": "pending_vehicle_type",
            "vehicle_exists": false
        }
    ]
}
```

### POST /api/toll-v1/camera-detection/quick-capture
Quick capture detection for manual operator action

Response:
```json
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

### POST /api/toll-v1/camera-detection/{id}/process-with-vehicle-type
Process detection with vehicle type selection

Request:
```json
{
    "body_type_id": 2
}
```

Response:
```json
{
    "success": true,
    "data": {
        "detection": {...},
        "vehicle": {...},
        "passage": {...}
    }
}
```

## Performance Optimization

### Database Optimization

1. **Indexing Strategy**
   - Index on `numberplate` for lookups
   - Index on `processing_status` for filtering
   - Compound index on `(gate_id, detection_timestamp)`

2. **Query Optimization**
   - Use prepared statements
   - Limit result sets
   - Batch inserts

3. **Cleanup**
   - Archive old detections (retention: 30 days)
   - Cleanup sync queue (after successful sync)
   - Optimize indices regularly

### Memory Management

1. **Connection Pooling**
   - Limit concurrent connections
   - Reuse connections

2. **Caching**
   - Cache vehicle type list
   - Cache gate configuration
   - Invalidate on changes

## Future Enhancements

1. **ML-based Vehicle Recognition**
   - Train model for vehicle classification
   - Reduce operator actions

2. **Advanced Analytics**
   - Real-time dashboards
   - Prediction models
   - Pattern recognition

3. **Mobile Integration**
   - Mobile operator app
   - Real-time notifications
   - Remote gate control

4. **AI-powered Suggestions**
   - Auto-suggest body type based on image
   - Confidence scoring
   - Batch processing capabilities
