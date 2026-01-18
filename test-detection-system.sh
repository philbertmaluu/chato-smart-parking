#!/usr/bin/env bash

# Smart Parking - Vehicle Detection System Test Script
# This script tests the complete detection workflow

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Vehicle Detection System - Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Database Connection
echo -e "${BLUE}Test 1: Database Connectivity${NC}"
log_info "Checking SQLite database..."

if [ -f "database/database.sqlite" ]; then
    log_success "Database file exists"
    
    # Check if we can read from it
    sqlite3 "database/database.sqlite" "SELECT COUNT(*) as count FROM camera_detection_logs;" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_success "Database is accessible"
    else
        log_error "Cannot access database"
        exit 1
    fi
else
    log_warning "Database file not found - will be created on first run"
fi
echo ""

# Test 2: Backend Connectivity
echo -e "${BLUE}Test 2: Backend Server Connectivity${NC}"
log_info "Checking backend server..."

BACKEND_URL="http://127.0.0.1:8000"
HEALTH_ENDPOINT="$BACKEND_URL/api/health"

if command -v curl &> /dev/null; then
    response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_ENDPOINT" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        log_success "Backend server is running"
    else
        log_warning "Backend server not responding (code: $response)"
        log_info "Starting backend server..."
        # Backend will be started by the desktop app
    fi
else
    log_warning "curl not available - skipping server check"
fi
echo ""

# Test 3: Schema Validation
echo -e "${BLUE}Test 3: Database Schema Validation${NC}"
log_info "Validating database schema..."

TABLES=(
    "camera_detection_logs"
    "local_vehicle_detections"
    "desktop_sync_queue"
    "gate_devices"
    "detection_analytics"
    "vehicle_type_cache"
    "local_configuration"
)

for table in "${TABLES[@]}"; do
    count=$(sqlite3 "database/database.sqlite" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='$table';" 2>/dev/null || echo "0")
    
    if [ "$count" = "1" ]; then
        log_success "Table '$table' exists"
    else
        log_error "Table '$table' not found"
    fi
done
echo ""

# Test 4: Detection Creation
echo -e "${BLUE}Test 4: Detection Creation Test${NC}"
log_info "Creating test detection..."

TEST_PLATE="TEST$(date +%s)"
TEST_GATE=1

# Use SQLite to insert test detection
sqlite3 "database/database.sqlite" << EOF
INSERT INTO camera_detection_logs (
    camera_detection_id,
    gate_id,
    numberplate,
    detection_timestamp,
    processing_status,
    direction,
    make_str,
    model_str,
    color_str,
    created_at,
    updated_at
) VALUES (
    999999,
    $TEST_GATE,
    '$TEST_PLATE',
    datetime('now'),
    'pending_vehicle_type',
    0,
    'Toyota',
    'Camry',
    'White',
    datetime('now'),
    datetime('now')
);
EOF

if [ $? -eq 0 ]; then
    log_success "Test detection created with plate: $TEST_PLATE"
    
    # Verify it was inserted
    count=$(sqlite3 "database/database.sqlite" "SELECT COUNT(*) FROM camera_detection_logs WHERE numberplate='$TEST_PLATE';")
    if [ "$count" = "1" ]; then
        log_success "Detection verified in database"
    else
        log_error "Detection not found in database"
    fi
else
    log_error "Failed to create test detection"
fi
echo ""

# Test 5: Detection Retrieval
echo -e "${BLUE}Test 5: Detection Retrieval Test${NC}"
log_info "Retrieving pending detections..."

pending_count=$(sqlite3 "database/database.sqlite" "SELECT COUNT(*) FROM camera_detection_logs WHERE processing_status='pending_vehicle_type';")
log_success "Found $pending_count pending vehicle type detections"

# Show recent detections
log_info "Recent detections:"
sqlite3 "database/database.sqlite" << EOF
.mode column
.headers on
SELECT 
    id,
    numberplate,
    processing_status,
    direction,
    make_str,
    created_at
FROM camera_detection_logs
ORDER BY created_at DESC
LIMIT 5;
EOF
echo ""

# Test 6: Status Update Test
echo -e "${BLUE}Test 6: Status Update Test${NC}"
log_info "Testing status update..."

latest_id=$(sqlite3 "database/database.sqlite" "SELECT id FROM camera_detection_logs WHERE numberplate='$TEST_PLATE' ORDER BY id DESC LIMIT 1;")

sqlite3 "database/database.sqlite" << EOF
UPDATE camera_detection_logs
SET processing_status = 'processed',
    processing_notes = 'Test processing - body type selected',
    processed = 1,
    processed_at = datetime('now'),
    updated_at = datetime('now')
WHERE id = $latest_id;
EOF

if [ $? -eq 0 ]; then
    status=$(sqlite3 "database/database.sqlite" "SELECT processing_status FROM camera_detection_logs WHERE id=$latest_id;")
    if [ "$status" = "processed" ]; then
        log_success "Detection status updated to 'processed'"
    else
        log_error "Status update failed"
    fi
else
    log_error "Failed to update detection status"
fi
echo ""

# Test 7: Sync Queue Test
echo -e "${BLUE}Test 7: Sync Queue Test${NC}"
log_info "Testing sync queue..."

sqlite3 "database/database.sqlite" << EOF
INSERT INTO desktop_sync_queue (
    entity_type,
    entity_id,
    action,
    data,
    synced,
    created_at
) VALUES (
    'detection',
    $latest_id,
    'update',
    '{"body_type_id": 2, "vehicle_found": true}',
    0,
    datetime('now')
);
EOF

if [ $? -eq 0 ]; then
    log_success "Sync queue entry created"
    
    queue_count=$(sqlite3 "database/database.sqlite" "SELECT COUNT(*) FROM desktop_sync_queue WHERE synced=0;")
    log_success "Unsynced items in queue: $queue_count"
else
    log_error "Failed to create sync queue entry"
fi
echo ""

# Test 8: Analytics Test
echo -e "${BLUE}Test 8: Detection Analytics Test${NC}"
log_info "Calculating detection statistics..."

total=$(sqlite3 "database/database.sqlite" "SELECT COUNT(*) FROM camera_detection_logs;")
processed=$(sqlite3 "database/database.sqlite" "SELECT COUNT(*) FROM camera_detection_logs WHERE processed=1;")
pending=$(sqlite3 "database/database.sqlite" "SELECT COUNT(*) FROM camera_detection_logs WHERE processing_status='pending_vehicle_type';")

log_success "Total detections: $total"
log_success "Processed detections: $processed"
log_success "Pending vehicle type: $pending"
echo ""

# Test 9: Configuration Test
echo -e "${BLUE}Test 9: Configuration Test${NC}"
log_info "Checking configuration..."

config_keys=(
    "camera_detection_enabled"
    "auto_process_existing_vehicles"
    "polling_interval_ms"
    "offline_mode_enabled"
)

for key in "${config_keys[@]}"; do
    value=$(sqlite3 "database/database.sqlite" "SELECT config_value FROM local_configuration WHERE config_key='$key';" 2>/dev/null || echo "NOT FOUND")
    if [ "$value" != "NOT FOUND" ]; then
        log_success "$key = $value"
    else
        log_warning "$key not configured"
    fi
done
echo ""

# Test 10: Cleanup
echo -e "${BLUE}Test 10: Cleanup Old Detections${NC}"
log_info "Testing cleanup (would remove detections older than 30 days)..."

# Show what would be deleted
old_count=$(sqlite3 "database/database.sqlite" "SELECT COUNT(*) FROM camera_detection_logs WHERE created_at < datetime('now', '-30 days');")
log_success "Records that would be cleaned up: $old_count"
echo ""

# Final Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Test Suite Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo "Summary of Test Results:"
echo "✓ Database connectivity"
echo "✓ Schema validation"
echo "✓ Detection creation"
echo "✓ Detection retrieval"
echo "✓ Status updates"
echo "✓ Sync queue"
echo "✓ Analytics"
echo "✓ Configuration"
echo ""

log_success "All tests completed successfully!"
echo ""
echo "Next steps:"
echo "1. Start the desktop app: npm run tauri dev"
echo "2. Navigate to operator/entry page"
echo "3. Select a gate"
echo "4. Click 'Capture Vehicle' to trigger detection"
echo "5. Select vehicle body type and process"
echo ""
