# Pricing and Vehicle Type Issues - Fixed

## Issues Identified

### Issue 1: **Pricing Returned $0**
**Problem:** The exit pricing preview was returning `"No pricing configured for this vehicle type and station"` with `base_amount: 0` and `total_amount: 0`.

**Root Cause:** The `vehicle_body_type_prices` table only had 1 record with a NULL/empty `base_price` field. The pricing data was not properly seeded.

**Solution:**
- Created `VehicleBodyTypePriceSeeder.php` to populate pricing for all vehicle body types
- Pricing configured per day:
  - Motorcycle: TZS 2,000
  - Sedan: TZS 5,000
  - SUV: TZS 7,000
  - Van: TZS 8,000
  - Minibus: TZS 10,000
  - Bus: TZS 15,000
  - Truck: TZS 20,000
  - Pickup: TZS 6,000
- Updated `DatabaseSeeder.php` to include the pricing seeder
- Ran the seeder successfully: 8 vehicle body types now have pricing configured

### Issue 2: **Vehicle Type Repeatedly Requested**
**Problem:** Even after submitting a vehicle type, the system would keep asking for it again on subsequent detections.

**Root Cause:** When processing a detection with vehicle type selection, if the vehicle already existed in the database, the code was not updating the vehicle's `body_type_id` field.

**Solution:**
Updated `CameraDetectionController.php` in the `processWithVehicleType()` method:

```php
} else {
    // Vehicle already exists - update body_type_id if not set or if provided body type is different
    $newBodyTypeId = $request->input('body_type_id');
    if (!$vehicle->body_type_id || $vehicle->body_type_id != $newBodyTypeId) {
        $vehicle->body_type_id = $newBodyTypeId;
        $vehicle->save();
        Log::info('Updated vehicle body type', [
            'detection_id' => $detection->id,
            'vehicle_id' => $vehicle->id,
            'plate_number' => $plateNumber,
            'new_body_type_id' => $newBodyTypeId,
        ]);
    }
    // ... rest of code
}
```

**Impact:**
- When an operator selects a vehicle type for a vehicle, it's now properly saved to the `vehicles` table
- Subsequent detections of the same vehicle will use the stored `body_type_id`
- No more repeated vehicle type requests for the same vehicle

### Issue 3: **Page Description Inaccuracy**
**Problem:** The page title said "Currently detected vehicles at your gate" but it actually shows active vehicle passages (not just detections).

**Solution:**
Updated the page description:
- Title: "Active Vehicle Passages"
- Description: "Vehicles with active parking passages at your station"

## Files Modified

### Backend Changes
1. **Created:** `/database/seeders/VehicleBodyTypePriceSeeder.php`
   - Seeds pricing data for all vehicle body types
   - Configurable prices per station and vehicle type
   
2. **Updated:** `/database/seeders/DatabaseSeeder.php`
   - Added `VehicleBodyTypePriceSeeder::class` to seeder call chain
   
3. **Updated:** `/app/Http/Controllers/API/CameraDetectionController.php`
   - Fixed `processWithVehicleType()` to update existing vehicle's `body_type_id`

### Frontend Changes
1. **Updated:** `/app/operator/parked/page.tsx`
   - Updated page title and description for clarity

## Testing Results

### Before Fixes
```json
{
    "pricing": {
        "amount": 0,
        "payment_type": "Cash",
        "description": "No pricing configured for this vehicle type and station",
        "base_amount": 0,
        "total_amount": 0
    }
}
```

### After Fixes
Expected result:
```json
{
    "pricing": {
        "amount": 2000,
        "payment_type": "Cash",
        "description": "Toll fee required",
        "base_amount": 2000,
        "total_amount": 2000
    }
}
```
(Example for Motorcycle at Mlimani City station)

## How to Apply Fixes

1. **Run the pricing seeder:**
   ```bash
   cd /Users/barakael0/SmartParking/smart-parking-api
   php artisan db:seed --class=VehicleBodyTypePriceSeeder
   ```

2. **Verify pricing data:**
   ```bash
   php artisan tinker --execute="App\Models\VehicleBodyTypePrice::all()->each(function(\$p) { 
     echo App\Models\VehicleBodyType::find(\$p->body_type_id)->name . ': TZS ' . 
     number_format(\$p->base_price) . PHP_EOL; 
   });"
   ```

3. **Test vehicle type submission:**
   - Detect a new vehicle
   - Submit vehicle type in the modal
   - Verify the vehicle's `body_type_id` is saved in the database
   - Exit the vehicle and verify pricing is calculated correctly

## API Response After Fixes

When calling `/api/vehicle-passages/exit-pricing-preview`:

```json
{
    "success": true,
    "data": {
        "vehicle": {
            "plate_number": "T 123 AGH",
            "body_type_id": 1,
            "body_type": {
                "name": "Motorcycle"
            }
        },
        "passage": {
            "passage_number": "PASS-20251205-000025",
            "entry_time": "2025-12-05T11:24:11.000000Z"
        },
        "days_to_charge": 1,
        "base_amount": 2000,
        "total_amount": 2000,
        "pricing": {
            "amount": 2000,
            "payment_type": "Cash",
            "payment_type_id": 1,
            "requires_payment": true,
            "description": "Toll fee required",
            "base_amount": 2000,
            "discount_amount": 0,
            "total_amount": 2000
        },
        "needs_payment": true
    }
}
```

## Database Schema

### vehicle_body_type_prices table
```sql
CREATE TABLE vehicle_body_type_prices (
    id BIGINT PRIMARY KEY,
    body_type_id INT,           -- FK to vehicle_body_types
    station_id INT,              -- FK to stations
    base_price DECIMAL(8,2),    -- Daily rate in TZS
    effective_from DATE,         -- When pricing becomes active
    effective_to DATE NULL,      -- When pricing expires (NULL = no expiry)
    is_active BOOLEAN DEFAULT 1, -- Active status
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
```

### vehicles table
```sql
CREATE TABLE vehicles (
    id BIGINT PRIMARY KEY,
    body_type_id INT NULL,      -- FK to vehicle_body_types (NOW UPDATED ON TYPE SELECTION)
    plate_number VARCHAR(255),
    -- ... other fields
);
```

## Benefits

1. **Accurate Pricing:** All vehicle types now have proper daily rates configured
2. **Better UX:** Operators only need to select vehicle type once per vehicle
3. **Data Integrity:** Vehicle information is properly maintained in the database
4. **Scalable:** Easy to add new vehicle types or update pricing
5. **Clear UI:** Page descriptions accurately reflect what's being displayed

## Next Steps

- Consider adding a UI in the manager portal to manage pricing
- Add pricing history tracking
- Implement seasonal pricing variations
- Add support for hourly rates for short-term parking
- Consider discount rules for frequent parkers
