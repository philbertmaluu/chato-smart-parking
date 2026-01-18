#!/usr/bin/env powershell

<#
.SYNOPSIS
Complete Smart Parking Vehicle Detection System - Integration Overview

.DESCRIPTION
This file provides a complete overview of how all components integrate
to create the vehicle detection system.

#>

Write-Host @"
╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║          SMART PARKING VEHICLE DETECTION SYSTEM - INTEGRATION GUIDE            ║
║                                                                                ║
║                        Complete Architecture Walkthrough                        ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝

COMPONENT INTEGRATION OVERVIEW
══════════════════════════════════════════════════════════════════════════════════

The Smart Parking system integrates multiple components to provide automatic
vehicle detection and operator-driven vehicle entry processing.

1. CAMERA HARDWARE INTEGRATION
────────────────────────────────────────────────────────────────────────────────

Component: ZKTeco Camera System
Location: At each parking facility gate
Connection: IP-based API (HTTP)
Data Provided:
  • Plate number (numberplate)
  • Vehicle make, model, color
  • Confidence score (0-100)
  • Detection timestamp
  • Vehicle location (bounding box)
  
Flow:
  Camera → IP API → Backend CameraDetectionService → Database

Implementation Files:
  • app/Services/CameraDetectionService.php
  • app/Http/Controllers/API/CameraDetectionController.php


2. BACKEND PROCESSING LAYER (Laravel PHP)
────────────────────────────────────────────────────────────────────────────────

Component: CameraDetectionService
Location: smart-parking-api/app/Services/
Responsibilities:
  • Fetch detection from camera API
  • Store detection in database
  • Check if vehicle exists
  • Assign processing status
  
Processing Logic:
  
  detect() {
    camera_data = fetch_from_camera()
    detection = store_in_database(camera_data)
    
    if (vehicle_exists(detection.plate_number)) {
      detection.status = "pending"          // Can auto-process
    } else {
      detection.status = "pending_vehicle_type"  // Needs operator action
    }
    
    detection.save()
  }

Database Tables:
  • camera_detection_logs - All detections
  
API Endpoints Provided:
  • GET  /api/toll-v1/camera-detection/logs/pending/vehicle-type
  • POST /api/toll-v1/camera-detection/quick-capture
  • POST /api/toll-v1/camera-detection/{id}/process-with-vehicle-type


3. FRONTEND PRESENTATION LAYER (React/TypeScript)
────────────────────────────────────────────────────────────────────────────────

Component: VehicleEntry Page
Location: smart-parking-front/app/operator/entry/page.tsx
Responsibilities:
  • Display operator interface
  • Poll backend for new detections
  • Show detection modal
  • Handle vehicle type selection

Polling Logic:
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Poll every 2.5 seconds
      const latestDetection = 
        fetchLatestDetection()
      
      if (latestDetection?.status === 'pending_vehicle_type') {
        // Show modal for operator
        setShowVehicleTypeModal(true)
      }
    }, 2500)
  }, [])

Modal Components:
  • VehicleTypeSelectionModal - Select body type
  • VehicleEntryDrawer - Create vehicle entry
  
Data Flow:
  Detection → Modal → Operator Action → Backend Process


4. DESKTOP APP INTEGRATION (Tauri + Rust + SQLite)
────────────────────────────────────────────────────────────────────────────────

Component: Tauri Application with Embedded Backend
Architecture:

  ┌─────────────────────────────────────────┐
  │      Tauri Window (React Frontend)      │
  └─────────────────────────────────────────┘
           │                      │
           │ Communicates         │
           ▼                      ▼
  ┌──────────────────┐    ┌──────────────────┐
  │ Detection Service│    │ Rust Backend     │
  │ (Rust Module)   │    │ (Process Manager)│
  └──────────────────┘    └──────────────────┘
           │                      │
           │ Reads/Writes         │ Launches
           ▼                      ▼
  ┌──────────────────────────────────────────┐
  │      SQLite Database                     │
  │ (Local offline-capable storage)          │
  └──────────────────────────────────────────┘
           │
           │ Syncs with
           ▼
  ┌──────────────────────────────────────────┐
  │   Laravel Backend (when available)       │
  │ (Detection Processing & Business Logic)  │
  └──────────────────────────────────────────┘

Key Rust Modules:

a) backend.rs
   - Manages PHP backend process
   - Handles environment setup
   - Process startup/shutdown

b) database.rs
   - SQLite connection management
   - Schema initialization
   - CRUD operations
   - Sync queue management

c) detection_service.rs
   - Detection event processing
   - Operator action handling
   - Analytics calculations


5. DATABASE INTEGRATION
────────────────────────────────────────────────────────────────────────────────

Tables & Relationships:

camera_detection_logs (Primary detection storage)
├─ id
├─ camera_detection_id (from ZKTeco API)
├─ numberplate (vehicle plate)
├─ processing_status (pending|pending_vehicle_type|processed|etc)
├─ gate_id (which gate detected it)
├─ direction (0=entry, 1=exit)
├─ make_str, model_str, color_str
└─ created_at, updated_at

                        ▼

local_vehicle_detections (Desktop app tracking)
├─ id
├─ camera_detection_log_id (FK to above)
├─ plate_number
├─ processing_status
├─ vehicle_found (boolean)
├─ body_type_selected (boolean)
├─ operator_action
└─ operator_notes

                        ▼

desktop_sync_queue (Offline sync)
├─ id
├─ entity_type (detection|vehicle_passage|etc)
├─ entity_id
├─ action (create|update|delete)
├─ data (JSON)
├─ synced (boolean)
└─ sync_error

Processing Status Lifecycle:

  pending_vehicle_type  ← NEW VEHICLE DETECTED
         │
         ├─ [Operator reviews detection]
         │
         ├─ [Selects vehicle body type]
         │
         ▼
     processed  ← OPERATOR ACTION COMPLETE
         │
         ├─ [Vehicle entry created]
         │
         ├─ [System processes parking]
         │
         ▼
     completed  ← FINAL STATE


6. OPERATOR WORKFLOW
────────────────────────────────────────────────────────────────────────────────

Step 1: Camera Detects Vehicle
  └─ ZKTeco camera at gate captures vehicle
  └─ Returns: ABC123 (plate)

Step 2: Detection Stored
  └─ Backend stores in camera_detection_logs
  └─ Sets status = "pending_vehicle_type" (new vehicle)

Step 3: Frontend Polls
  └─ VehicleEntry page checks every 2.5 seconds
  └─ Finds detection with status = "pending_vehicle_type"

Step 4: Modal Appears
  ┌──────────────────────────────────┐
  │  ✓ New Vehicle Detected          │
  │                                  │
  │  Plate Number: ABC123            │
  │  Make: Toyota                    │
  │  Model: Camry                    │
  │  Color: White                    │
  │                                  │
  │  Vehicle Body Type:              │
  │  [▼ Select body type...]         │
  │                                  │
  │  [✓ Process Entry] [✗ Cancel]    │
  └──────────────────────────────────┘

Step 5: Operator Action
  └─ Operator clicks dropdown
  └─ Selects: "SUV" (or applicable type)
  └─ Clicks "Process Entry"

Step 6: Vehicle Entry Drawer Opens
  ├─ Plate number pre-filled: ABC123
  ├─ System searches for vehicle
  ├─ If found → shows vehicle details
  ├─ If not found → creates new vehicle
  └─ Operator confirms vehicle type

Step 7: Vehicle Entry Created
  ├─ Creates vehicle passage
  ├─ Updates detection status to "processed"
  ├─ Adds vehicle to parked vehicles list
  ├─ Modal closes automatically
  └─ Ready for next detection

Step 8: System Updates
  └─ detection.processed = true
  └─ detection.processing_status = "processed"
  └─ vehicle_passage.status = "active"


7. API COMMUNICATION FLOW
────────────────────────────────────────────────────────────────────────────────

Frontend → Backend Communication:

a) Get Pending Detections (Poll every 2.5 seconds)
   GET /api/toll-v1/camera-detection/logs/pending/vehicle-type
   
   Response:
   {
     "success": true,
     "data": [
       {
         "id": 1,
         "numberplate": "ABC123",
         "processing_status": "pending_vehicle_type",
         "make_str": "Toyota",
         "model_str": "Camry",
         "color_str": "White",
         "vehicle_exists": false
       }
     ]
   }

b) Process Detection with Body Type
   POST /api/toll-v1/camera-detection/1/process-with-vehicle-type
   
   Request:
   {
     "body_type_id": 2  // Selected vehicle type
   }
   
   Response:
   {
     "success": true,
     "data": {
       "detection": { ... },
       "vehicle": { ... },
       "passage": { ... }
     }
   }

c) Quick Capture (Manual operator capture)
   POST /api/toll-v1/camera-detection/quick-capture
   
   Response:
   {
     "success": true,
     "data": {
       "fetched": 1,
       "stored": 1,
       "detection": {
         "id": 2,
         "plate_number": "XYZ789",
         "detection_timestamp": "2025-12-14T10:35:00Z"
       }
     }
   }


8. OFFLINE MODE OPERATION
────────────────────────────────────────────────────────────────────────────────

When Backend is Unavailable:

1. Detection Captured Locally
   └─ Stored in SQLite database
   └─ Status = "pending_vehicle_type"

2. Operator Processes Vehicle
   ├─ Selects body type
   ├─ Creates vehicle entry
   └─ All stored locally

3. Operations Queued
   └─ Added to desktop_sync_queue
   └─ synced = false
   └─ Waiting for backend availability

4. When Backend Comes Online
   ├─ Sync service detects connectivity
   ├─ Processes sync_queue items
   ├─ Sends to backend APIs
   ├─ Marks synced = true on success
   └─ Retries on failure (max 5 attempts)

5. Data Eventually Consistent
   └─ All local data synced to backend
   └─ No data loss
   └─ Seamless offline → online transition


9. CONFIGURATION & ENVIRONMENT
────────────────────────────────────────────────────────────────────────────────

Configuration File: .env.local

DB_CONNECTION=sqlite
SQLITE_DATABASE=./database/database.sqlite

DETECTION_ENABLED=true
AUTO_PROCESS_EXISTING=true
POLLING_INTERVAL_MS=2500
CAMERA_FETCH_INTERVAL_MS=5000
OFFLINE_MODE=false

DETECTION_RETENTION_DAYS=30
MAX_SYNC_ATTEMPTS=5

These settings control:
• Detection processing
• Polling intervals
• Data retention
• Offline capabilities
• Sync behavior


10. ERROR HANDLING & RESILIENCE
────────────────────────────────────────────────────────────────────────────────

Detection Processing Failures:
  └─ Detection marked as "failed"
  └─ Processing notes include error message
  └─ Operator can retry

Sync Queue Failures:
  ├─ sync_attempts incremented
  ├─ sync_error stored for debugging
  ├─ Retried up to max_sync_attempts
  └─ If failed, operator can manually retry

Camera Connection Failures:
  └─ quickCapture returns camera_unavailable = true
  └─ Frontend shows user-friendly error
  └─ Operator can retry capture

Network Connectivity:
  └─ Offline mode continues working
  └─ Sync queues operations
  └─ Resumes when connectivity restored


DEPLOYMENT CHECKLIST
═════════════════════════════════════════════════════════════════════════════════

Before deploying the vehicle detection system:

Prerequisites:
  ☐ Rust 1.77.2+ installed
  ☐ PHP 8.1+ installed
  ☐ Node.js 18+ installed
  ☐ SQLite 3.40+ installed
  ☐ Camera hardware configured
  ☐ Gate devices configured in database

Setup:
  ☐ Run ./setup-desktop-app.ps1
  ☐ Database initialized
  ☐ All dependencies installed
  ☐ Environment variables configured

Testing:
  ☐ Run test-detection-system.ps1
  ☐ All tests passing
  ☐ Database connectivity verified
  ☐ API endpoints responsive

Manual Testing:
  ☐ Camera detects test vehicle
  ☐ Detection appears in database
  ☐ Modal shows in operator UI
  ☐ Body type selection works
  ☐ Vehicle entry created
  ☐ Detection marked processed
  ☐ Offline mode queues detection
  ☐ Sync processes when online

Deployment:
  ☐ Build desktop app: npm run tauri build
  ☐ Test in production environment
  ☐ Monitor detection logs
  ☐ Monitor sync queue
  ☐ Setup automated backups


FILE STRUCTURE SUMMARY
═════════════════════════════════════════════════════════════════════════════════

smart-parking/
│
├── smart-parking-api/                    # Laravel Backend
│   ├── app/
│   │   ├── Services/
│   │   │   └── CameraDetectionService.php
│   │   ├── Http/Controllers/
│   │   │   └── CameraDetectionController.php
│   │   └── Models/
│   │       └── CameraDetectionLog.php
│   └── database/
│       ├── sqlite-schema.sql             ← SQLite schema
│       └── migrations/
│           ├── 2025_11_24_122618_create_camera_detection_logs_table.php
│           └── 2025_11_27_173010_add_processing_status_to_camera_detection_logs_table.php
│
├── smart-parking-front/                  # Tauri Desktop App
│   ├── src-tauri/
│   │   ├── src/
│   │   │   ├── lib.rs                    ← Module declarations
│   │   │   ├── main.rs                   ← Entry point
│   │   │   ├── backend.rs                ← PHP backend management
│   │   │   ├── database.rs               ← SQLite driver
│   │   │   └── detection_service.rs      ← Detection logic
│   │   ├── Cargo.toml                    ← Rust dependencies
│   │   └── tauri.conf.json
│   ├── app/operator/entry/
│   │   ├── page.tsx                      ← Main entry page
│   │   └── components/
│   │       ├── vehicle-type-selection-modal.tsx
│   │       ├── vehicleEntrydrawer.tsx
│   │       └── vehicle-exit-dialog.tsx
│   ├── utils/api/
│   │   └── camera-detection-service.ts   ← API client
│   ├── setup-desktop-app.ps1             ← Setup script
│   └── package.json
│
├── VEHICLE_DETECTION_COMPLETE.md         ← Detailed guide
├── DESKTOP_APP_SETUP_GUIDE.md            ← Quick start
└── SMART_PARKING_DETECTION_SUMMARY.md    ← This overview


KEY TAKEAWAYS
═════════════════════════════════════════════════════════════════════════════════

1. AUTOMATIC DETECTION
   New vehicles are automatically detected when they approach the gate

2. OPERATOR-DRIVEN PROCESSING
   Operator selects body type via modal, not operator has to manually enter vehicle

3. OFFLINE CAPABILITY
   Desktop app works completely without backend, queues operations for sync

4. SCALABLE ARCHITECTURE
   Multiple components communicate via REST APIs and queues

5. RESILIENT SYSTEM
   Error handling at every level, automatic retries, data consistency

6. PERFORMANCE OPTIMIZED
   SQLite with indices, configurable polling, batch operations

7. WELL DOCUMENTED
   Complete guides, API documentation, test suite included


GETTING STARTED
═════════════════════════════════════════════════════════════════════════════════

1. Setup System:
   ./setup-desktop-app.ps1 -InitializeDb -BuildApp

2. Run Tests:
   ./test-detection-system.ps1

3. Start Development:
   npm run tauri dev

4. Test Detection Flow:
   - Open operator entry page
   - Select gate
   - Click "Capture Vehicle"
   - See modal with detection
   - Select body type
   - Process entry

5. Monitor System:
   - Check detection logs
   - Review sync queue
   - Monitor performance metrics


════════════════════════════════════════════════════════════════════════════════════
System ready for testing and deployment!
════════════════════════════════════════════════════════════════════════════════════

" -ForegroundColor Cyan
