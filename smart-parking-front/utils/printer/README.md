# Direct USB Printer Support (Frontend Only)

This module allows printing directly from the frontend to a USB printer without needing the backend.

## How It Works

1. **Tauri Command**: A Rust function (`print_receipt`) is exposed as a Tauri command
2. **Windows Print API**: Uses Windows Print Spooler API to send ESC/POS commands directly to the printer
3. **No Backend Required**: Prints directly from the desktop app to the local USB printer

## Usage

```typescript
import { printReceiptDirect } from '@/utils/printer/direct-printer';
import { PRINTER_CONFIG } from '@/utils/printer/printer-config';

// Print a receipt (uses default printer from config)
await printReceiptDirect({
  company_name: 'Smart Parking System',
  receipt_type: 'ENTRY RECEIPT',
  receipt_id: 'REC-001',
  plate_number: 'ABC-123',
  amount: 'Tsh 5,000.00',
  footer: 'Thank you for parking with us!'
});

// Or specify a printer name explicitly
await printReceiptDirect({
  company_name: 'Smart Parking System',
  receipt_type: 'ENTRY RECEIPT',
  receipt_id: 'REC-001',
  plate_number: 'ABC-123',
  amount: 'Tsh 5,000.00',
  footer: 'Thank you for parking with us!'
}, 'POS-80C (copy 1)');
```

## Configuration

Default printer is configured in `printer-config.ts`:
- **Default Printer**: `POS-80C (copy 1)` (can be changed via `NEXT_PUBLIC_DEFAULT_PRINTER_NAME` env var)
- The system will automatically use the default printer if no printer name is provided

## Printer Name

Use the Windows printer name or share name:
- `POS-80C` - Printer name
- `POS-80C (copy 1)` - Default printer (configured)
- `POS80C` - Share name (if shared)

## Benefits

✅ **No Backend Required** - Works completely offline
✅ **Fast Printing** - Direct communication with printer
✅ **USB Support** - Works with USB-connected printers
✅ **Windows Shared** - Also works with shared printers

## Limitations

- **Windows Only** - Currently only supports Windows
- **Printer Must Be Installed** - Printer driver must be installed on Windows
- **Local Only** - Can only print to printers on the same PC

