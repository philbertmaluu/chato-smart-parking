# Vehicle Passage Testing Guide

This guide explains how to test the vehicle passage and gate control functionality that has been implemented.

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd smart-parking-backend
   php artisan serve --host=127.0.0.1 --port=8000
   ```

2. **Frontend Development Server Running**
   ```bash
   cd smart-parking-app
   npm run dev
   ```

3. **Database Seeded**
   ```bash
   cd smart-parking-backend
   php artisan db:seed --class=PaymentTypeSeeder
   php artisan db:seed --class=VehicleBodyTypeSeeder
   php artisan db:seed --class=GateSeeder
   ```

4. **User Authentication**
   - Log in to the application with a valid operator account
   - Ensure you have the necessary permissions

## Testing the Vehicle Passage Functionality

### 1. Access the Test Component

1. Navigate to the operator entry page: `http://localhost:3000/operator/entry`
2. You should see a "Test Vehicle Passage Service" card at the bottom of the page
3. Check the authentication status - it should show "Authenticated" if you're logged in

### 2. Test Vehicle Entry

1. **Enter Test Data:**
   - Plate Number: `ABC-123` (or any valid plate number)
   - Gate ID: `1` (or any existing gate ID)

2. **Click "Test Entry"**
   - This will attempt to process a vehicle entry through the API
   - Check the browser console for detailed logs
   - The result will be displayed in the test component

3. **Expected Results:**
   - If successful: Green success message and receipt data
   - If failed: Red error message with details

### 3. Test Quick Lookup

1. **Enter a Plate Number** that exists in the database
2. **Click "Quick Lookup"**
3. **Expected Results:**
   - Vehicle information if found
   - Error message if not found

### 4. Test Manual Vehicle Entry Flow

1. **Select a Gate** from the dropdown at the top of the page
2. **Click "Manual Entry"** button
3. **Search for a Vehicle:**
   - Enter a plate number
   - Click search
   - If vehicle exists, proceed to entry processing
   - If vehicle doesn't exist, register a new vehicle

4. **Configure Entry Settings:**
   - Choose passage type: Toll, Free, or Exempted
   - For toll passages: Select payment method and type
   - For exempted passages: Enter exemption reason
   - Add optional notes

5. **Process Entry:**
   - Click "Process Entry"
   - Verify receipt generation
   - Check that passage is created in the database

## Testing Different Scenarios

### Toll Passage
- Select "Toll" passage type
- Choose payment method (cash/card/mpesa)
- Select payment type
- Verify payment processing and receipt generation

### Free Passage
- Select "Free" passage type
- Verify no payment required
- Check receipt shows "FREE" amount

### Exempted Passage
- Select "Exempted" passage type
- Enter exemption reason
- Verify no payment required
- Check receipt shows "FREE" amount

## Monitoring and Debugging

### Browser Console
Check the browser console for:
- API request details
- Response data
- Error messages
- Authentication status

### Backend Logs
Check Laravel logs for:
- Vehicle passage processing
- Gate control actions
- Receipt generation
- Error details

```bash
tail -f storage/logs/laravel.log
```

### Database Verification
Check that records are being created:

```sql
-- Check vehicle passages
SELECT * FROM vehicle_passages ORDER BY created_at DESC LIMIT 5;

-- Check receipts
SELECT * FROM receipts ORDER BY created_at DESC LIMIT 5;

-- Check vehicles
SELECT * FROM vehicles ORDER BY created_at DESC LIMIT 5;
```

## Common Issues and Solutions

### 1. Authentication Error
**Problem:** "Authentication required" error
**Solution:** 
- Log in to the application
- Check that auth token is stored in localStorage
- Verify user has operator permissions

### 2. Gate Not Found
**Problem:** "Gate not found" error
**Solution:**
- Ensure gates are seeded in the database
- Use a valid gate ID
- Check gate is active

### 3. Payment Type Not Found
**Problem:** "Payment type not found" error
**Solution:**
- Run payment type seeder: `php artisan db:seed --class=PaymentTypeSeeder`
- Use valid payment type ID

### 4. Vehicle Body Type Not Found
**Problem:** "Vehicle body type not found" error
**Solution:**
- Run vehicle body type seeder: `php artisan db:seed --class=VehicleBodyTypeSeeder`
- Use valid body type ID

### 5. API Connection Error
**Problem:** Network error or connection refused
**Solution:**
- Ensure backend server is running on port 8000
- Check API base URL configuration
- Verify CORS settings

## API Endpoints Tested

The following endpoints are tested through the vehicle passage service:

- `POST /api/toll-v1/vehicle-passages/entry` - Process vehicle entry
- `POST /api/toll-v1/vehicle-passages/quick-lookup` - Quick plate lookup
- `POST /api/toll-v1/gate-control/plate-detection` - Gate control with plate detection
- `GET /api/toll-v1/receipts/number/{number}` - Get receipt by number

## Expected Flow

1. **Vehicle Detection** → Plate number input
2. **Vehicle Lookup** → Search existing or create new vehicle
3. **Gate Selection** → Operator selects appropriate gate
4. **Passage Type Selection** → Choose between toll/free/exempted
5. **Payment Processing** → For toll passages, handle payment
6. **Receipt Generation** → Automatic receipt creation
7. **Gate Control** → Backend determines gate action (open/deny)

## Success Criteria

A successful test should result in:
- ✅ Vehicle entry processed successfully
- ✅ Passage record created in database
- ✅ Receipt generated (if payment made)
- ✅ Gate action determined (open/deny)
- ✅ Proper receipt display with all details
- ✅ No errors in console or logs

## Next Steps

After successful testing:
1. Remove the test component from the entry page
2. Test the full vehicle entry flow through the UI
3. Test vehicle exit functionality
4. Test gate control scenarios
5. Verify receipt printing functionality
