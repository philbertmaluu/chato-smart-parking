# Exit Pricing Display Fixes

## Problem Summary
The vehicle exit dialog was displaying $0 pricing after vehicle type selection due to state management issues. The pricing preview would not update immediately, causing confusion for operators.

## Root Causes Identified

### 1. **Stale State on Dialog Open/Close**
- Pricing preview state persisted between dialog opens
- When opening the dialog for a different vehicle, old pricing data remained
- No state reset logic when dialog closed

### 2. **Missing Loading State in Vehicle Type Selection**
- `handleVehicleTypeSelected` didn't show loading state immediately
- UI didn't reflect that pricing was being recalculated
- Users couldn't see progress of pricing calculation

### 3. **Receipt Amount Using Wrong Source**
- Receipt printing used `receipt.amount || result.data.total_amount || 0`
- Should prioritize `pricingPreview?.total_amount` which is the most accurate calculated value
- This caused printed receipts to show incorrect amounts

### 4. **No Vehicle Change Detection**
- When switching between vehicles without closing the dialog, state wasn't reset
- Preview vehicle key wasn't properly invalidated

## Fixes Implemented

### Fix 1: State Reset on Dialog Open/Close
**Location:** `vehicle-exit-dialog.tsx` - Added new useEffect

```typescript
// Reset state when dialog opens or closes
useEffect(() => {
  if (!open) {
    // Reset all state when dialog closes
    setShowPricingPreview(false);
    setPricingPreview(null);
    setPreviewVehicleKey(null);
    setSelectedBodyTypeId(null);
    setExitResult(null);
    setShowVehicleTypeModal(false);
  }
}, [open]);
```

**Purpose:** Ensures clean state when dialog opens for a new vehicle, preventing stale data display.

### Fix 2: Vehicle Change Detection
**Location:** `vehicle-exit-dialog.tsx` - Added new useEffect

```typescript
// Reset preview when vehicle changes
useEffect(() => {
  if (!vehicle) return;
  const key = `${vehicle.vehicle?.plate_number || ''}-${vehicle.entry_time}`;
  if (previewVehicleKey !== key) {
    setShowPricingPreview(false);
    setPricingPreview(null);
    setPreviewVehicleKey(null);
    setSelectedBodyTypeId(null);
  }
}, [vehicle, previewVehicleKey]);
```

**Purpose:** Detects when vehicle data changes and resets pricing preview state automatically.

### Fix 3: Immediate Loading State in Vehicle Type Selection
**Location:** `vehicle-exit-dialog.tsx` - Updated `handleVehicleTypeSelected`

```typescript
const handleVehicleTypeSelected = async (bodyTypeId: number) => {
  setSelectedBodyTypeId(bodyTypeId);
  setShowVehicleTypeModal(false);
  setIsLoadingPricing(true);  // ← Added this line
  await fetchPricingPreview(bodyTypeId);
};
```

**Purpose:** Shows loading state immediately when vehicle type is selected, improving UX feedback.

### Fix 4: Receipt Amount Prioritization
**Location:** `vehicle-exit-dialog.tsx` - Updated receipt data calculation

**Before:**
```typescript
amount: receipt.amount || result.data.total_amount || 0,
```

**After:**
```typescript
amount: receipt.amount || pricingPreview?.total_amount || result.data.total_amount || 0,
```

**Purpose:** Prioritizes the calculated pricing preview amount for more accurate receipt printing.

## State Flow After Fixes

### Scenario 1: Exit with Vehicle Type Already Set
1. Dialog opens → Auto-fetch pricing preview (existing behavior)
2. Pricing displays immediately
3. User clicks "Process Exit & Print Receipt"
4. Receipt prints with correct amount

### Scenario 2: Exit Without Vehicle Type
1. Dialog opens → Shows "Vehicle Type Required" message
2. User clicks "Select Vehicle Type" button
3. Vehicle type modal opens
4. User selects vehicle type and clicks "Continue"
5. Modal closes → `setIsLoadingPricing(true)` shows loading state immediately
6. Pricing preview fetches and displays
7. User clicks "Process Exit & Print Receipt"
8. Receipt prints with correct amount from `pricingPreview?.total_amount`

### Scenario 3: Switching Between Vehicles
1. Dialog opens for Vehicle A → Pricing displays
2. User closes dialog
3. Dialog opens for Vehicle B → All state resets (new useEffect)
4. Fresh pricing preview loads for Vehicle B
5. No stale data from Vehicle A

## Testing Checklist

- [x] **State Reset Test**: Open dialog, close, open again for different vehicle - verify no stale data
- [x] **Vehicle Type Selection**: Select vehicle type, verify immediate loading state appears
- [x] **Pricing Display**: After vehicle type selection, verify pricing displays correctly (not $0)
- [x] **Receipt Printing**: Process exit and verify receipt amount matches displayed pricing
- [x] **Multiple Vehicles**: Switch between multiple vehicles, verify each gets correct pricing
- [x] **Loading States**: Verify loading spinners appear during all async operations
- [x] **No Fee Scenario**: Verify "No Fee - Already Paid" displays correctly
- [x] **Paid Pass Scenario**: Verify paid pass status displays with no additional charges

## Technical Details

### State Variables Managed
- `pricingPreview`: Contains calculated pricing data from backend
- `showPricingPreview`: Boolean to control pricing display visibility
- `previewVehicleKey`: Unique key to track which vehicle's pricing is cached
- `selectedBodyTypeId`: Currently selected vehicle body type
- `isLoadingPricing`: Loading state for pricing calculation
- `exitResult`: Result of exit processing operation
- `showVehicleTypeModal`: Vehicle type selection modal visibility

### Dependencies
- Backend API: `/api/vehicle-passages/exit-pricing-preview`
- Service: `VehiclePassageService.getExitPricingPreview()`
- State hook: `useOperatorGates()` for gate context
- Toast notifications for user feedback

## Impact
- **UX Improvement**: Operators now see immediate feedback during pricing calculation
- **Data Accuracy**: Receipt amounts now match displayed pricing
- **State Consistency**: No more stale data between dialog opens
- **Error Prevention**: Reduced confusion from $0 pricing displays

## Future Considerations
- Consider adding debouncing to prevent rapid pricing recalculations
- Add error retry logic if pricing preview fails
- Consider caching pricing previews for recently viewed vehicles
- Add analytics to track pricing calculation times

## Related Files
- `/app/operator/parked/components/vehicle-exit-dialog.tsx` - Main dialog component
- `/utils/api/vehicle-passage-service.ts` - Exit processing service
- `/app/Services/VehiclePassageService.php` - Backend exit processing
- `/app/Services/PricingService.php` - Backend pricing calculation

## Notes
- These fixes are backward compatible with existing functionality
- No database schema changes required
- No API endpoint changes required
- Pure frontend state management improvements
