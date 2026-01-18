#[cfg(windows)]
use winapi::um::winspool::*;
#[cfg(windows)]
use winapi::shared::ntdef::HANDLE;
#[cfg(windows)]
use std::ffi::CString;
#[cfg(windows)]
use std::ptr;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PrintReceiptRequest {
    printer_name: String,
    receipt_data: serde_json::Value,
}

#[tauri::command]
pub fn print_receipt(request: PrintReceiptRequest) -> Result<String, String> {
    // Generate ESC/POS commands
    let escpos_data = generate_escpos_receipt(&request.receipt_data);
    
    // Print to Windows printer
    #[cfg(windows)]
    {
        print_to_windows_printer(&request.printer_name, &escpos_data)
            .map(|_| "Receipt printed successfully".to_string())
            .map_err(|e| format!("Print error: {}", e))
    }
    
    #[cfg(not(windows))]
    {
        Err("Windows printer support is only available on Windows".to_string())
    }
}

#[tauri::command]
pub fn get_available_printers() -> Result<Vec<String>, String> {
    #[cfg(windows)]
    {
        list_windows_printers()
    }
    
    #[cfg(not(windows))]
    {
        Err("Windows printer support is only available on Windows".to_string())
    }
}

#[cfg(windows)]
fn print_to_windows_printer(printer_name: &str, data: &[u8]) -> Result<(), String> {
    unsafe {
        let printer_name_cstr = CString::new(printer_name)
            .map_err(|e| format!("Invalid printer name: {}", e))?;

        let mut h_printer: HANDLE = ptr::null_mut();
        let mut printer_defaults = PRINTER_DEFAULTSA {
            pDataType: ptr::null_mut(),
            pDevMode: ptr::null_mut(),
            DesiredAccess: PRINTER_ACCESS_USE,
        };

        let result = OpenPrinterA(
            printer_name_cstr.as_ptr() as *mut i8,
            &mut h_printer,
            &mut printer_defaults,
        );

        if result == 0 {
            return Err(format!("Failed to open printer: {}", printer_name));
        }

        let doc_name = CString::new("Parking Receipt").unwrap();
        let doc_type = CString::new("RAW").unwrap();
        let mut doc_info = DOC_INFO_1A {
            pDocName: doc_name.as_ptr() as *mut i8,
            pOutputFile: ptr::null_mut(),
            pDatatype: doc_type.as_ptr() as *mut i8,
        };

        let job_id = StartDocPrinterA(h_printer, 1, &mut doc_info as *mut _ as *mut u8);
        if job_id == 0 {
            ClosePrinter(h_printer);
            return Err("Failed to start print job".to_string());
        }

        if StartPagePrinter(h_printer) == 0 {
            EndDocPrinter(h_printer);
            ClosePrinter(h_printer);
            return Err("Failed to start page".to_string());
        }

        let mut bytes_written: u32 = 0;
        let result = WritePrinter(
            h_printer,
            data.as_ptr() as *mut _,
            data.len() as u32,
            &mut bytes_written,
        );

        if result == 0 {
            EndPagePrinter(h_printer);
            EndDocPrinter(h_printer);
            ClosePrinter(h_printer);
            return Err("Failed to write to printer".to_string());
        }

        EndPagePrinter(h_printer);
        EndDocPrinter(h_printer);
        ClosePrinter(h_printer);

        Ok(())
    }
}

#[cfg(not(windows))]
fn print_to_windows_printer(_printer_name: &str, _data: &[u8]) -> Result<(), String> {
    Err("Windows printer support is only available on Windows".to_string())
}

#[cfg(windows)]
fn list_windows_printers() -> Result<Vec<String>, String> {
    unsafe {
        let mut needed: u32 = 0;
        let mut returned: u32 = 0;

        EnumPrintersA(
            PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS,
            ptr::null_mut(),
            1,
            ptr::null_mut(),
            0,
            &mut needed,
            &mut returned,
        );

        if needed == 0 {
            return Ok(Vec::new());
        }

        let mut buffer = vec![0u8; needed as usize];

        let result = EnumPrintersA(
            PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS,
            ptr::null_mut(),
            1,
            buffer.as_mut_ptr(),
            needed,
            &mut needed,
            &mut returned,
        );

        if result == 0 {
            return Err("Failed to enumerate printers".to_string());
        }

        let mut printers = Vec::new();
        let mut offset = 0;

        for _ in 0..returned {
            let printer_info = buffer.as_ptr().add(offset) as *const PRINTER_INFO_1A;
            let name_ptr = (*printer_info).pName;

            if !name_ptr.is_null() {
                let name_cstr = CString::from_raw(name_ptr as *mut i8);
                if let Ok(name) = name_cstr.to_str() {
                    printers.push(name.to_string());
                }
                std::mem::forget(name_cstr);
            }

            offset += std::mem::size_of::<PRINTER_INFO_1A>();
        }

        Ok(printers)
    }
}

#[cfg(not(windows))]
fn list_windows_printers() -> Result<Vec<String>, String> {
    Err("Windows printer support is only available on Windows".to_string())
}

fn generate_escpos_receipt(receipt_data: &serde_json::Value) -> Vec<u8> {
    let mut commands = Vec::new();

    // Initialize printer
    commands.extend_from_slice(&[0x1B, 0x40]);

    // Set line spacing to 24 dots for compact receipt
    commands.extend_from_slice(&[0x1B, 0x33, 0x18]);

    // Center alignment
    commands.extend_from_slice(&[0x1B, 0x61, 0x01]);

    // Company name - double height + bold
    commands.extend_from_slice(&[0x1B, 0x21, 0x10]);
    receipt_data.get("company_name")
        .and_then(|v| v.as_str())
        .map(|s| commands.extend_from_slice(s.as_bytes()));
    commands.push(0x0A);

    // Reset text size
    commands.extend_from_slice(&[0x1B, 0x21, 0x00]);

    // Subtitle
    receipt_data.get("company_subtitle")
        .and_then(|v| v.as_str())
        .map(|s| {
            commands.extend_from_slice(s.as_bytes());
            commands.push(0x0A);
        });

    commands.push(0x0A);

    // Professional separator line
    commands.extend_from_slice("=".repeat(40).as_bytes());
    commands.push(0x0A);
    commands.push(0x0A);

    // Left alignment for details
    commands.extend_from_slice(&[0x1B, 0x61, 0x00]);

    // Receipt number
    receipt_data.get("receipt_number")
        .and_then(|v| v.as_str())
        .map(|s| {
            commands.extend_from_slice(b"RECEIPT: ");
            commands.extend_from_slice(s.as_bytes());
            commands.push(0x0A);
        });

    // Reference (Kumb. Na.)
    receipt_data.get("receipt_ref")
        .and_then(|v| v.as_str())
        .map(|s| {
            commands.extend_from_slice(b"REF: ");
            commands.extend_from_slice(s.as_bytes());
            commands.push(0x0A);
        });

    // Date & time
    receipt_data.get("date_time")
        .and_then(|v| v.as_str())
        .map(|s| {
            commands.extend_from_slice(b"DATE: ");
            commands.extend_from_slice(s.as_bytes());
            commands.push(0x0A);
        });

    commands.push(0x0A);

    // Professional separator
    commands.extend_from_slice("-".repeat(40).as_bytes());
    commands.push(0x0A);

    // Table header with better spacing
    commands.extend_from_slice(b"DESCRIPTION              AMOUNT (TZS)\n");
    commands.extend_from_slice("-".repeat(40).as_bytes());
    commands.push(0x0A);

    // Description + Amount
    let desc = receipt_data.get("item_description")
        .and_then(|v| v.as_str())
        .unwrap_or("Parking Fee");

    let amount = receipt_data.get("total_amount")
        .or_else(|| receipt_data.get("item_amount"))
        .or_else(|| receipt_data.get("item_unit_price"))
        .and_then(|v| v.as_str())
        .unwrap_or("3,000");

    // Format: left-aligned description, right-aligned amount
    commands.extend_from_slice(format!("{:<26}", desc).as_bytes());
    commands.extend_from_slice(format!("{:>14}", amount).as_bytes());
    commands.push(0x0A);

    // Day line - prevent negative values
    let mut days_val = receipt_data.get("item_quantity")
        .and_then(|v| v.as_str())
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(0.0);

    if days_val < 0.0 {
        days_val = 0.0;
    }

    let days_str = format!("{:.0}", days_val);

    if days_val > 0.0 {
        commands.extend_from_slice(b"Days:                          ");
        commands.extend_from_slice(format!("{:>12}", days_str).as_bytes());
        commands.push(0x0A);
    }

    // Professional separator and total
    commands.extend_from_slice("=".repeat(40).as_bytes());
    commands.push(0x0A);

    // Total - bold and centered
    commands.extend_from_slice(&[0x1B, 0x45, 0x01]); // Bold ON
    let total_line = format!("TOTAL: {}", amount);
    commands.extend_from_slice(format!("{:^40}", total_line).as_bytes());
    commands.push(0x0A);
    commands.extend_from_slice(&[0x1B, 0x45, 0x00]); // Bold OFF

    commands.extend_from_slice("=".repeat(40).as_bytes());
    commands.push(0x0A);
    commands.push(0x0A);

    // Operator & Location
    receipt_data.get("operator_label")
        .and_then(|v| v.as_str())
        .map(|s| commands.extend_from_slice(s.as_bytes()));
    receipt_data.get("operator_name")
        .and_then(|v| v.as_str())
        .map(|s| {
            commands.extend_from_slice(b" ");
            commands.extend_from_slice(s.as_bytes());
        });
    commands.push(0x0A);

    receipt_data.get("location_label")
        .and_then(|v| v.as_str())
        .map(|s| commands.extend_from_slice(s.as_bytes()));
    receipt_data.get("location")
        .and_then(|v| v.as_str())
        .map(|s| {
            commands.extend_from_slice(b" ");
            commands.extend_from_slice(s.as_bytes());
        });
    commands.push(0x0A);

    // Small spacing before footer
    commands.push(0x0A);
    commands.push(0x0A);

    // Professional footer - centered
    commands.extend_from_slice(&[0x1B, 0x61, 0x01]); // Center alignment
    commands.extend_from_slice("=".repeat(40).as_bytes());
    commands.push(0x0A);
    commands.extend_from_slice(&[0x1B, 0x21, 0x10]); // Double height for footer
    commands.extend_from_slice(b"MWISHO WA STAKABADHI\n");
    commands.extend_from_slice(&[0x1B, 0x21, 0x00]); // Reset text size
    commands.extend_from_slice("=".repeat(40).as_bytes());
    commands.push(0x0A);

    // Add 3 line feeds after footer for paper feed before cut
    commands.push(0x0A);
    commands.push(0x0A);
    commands.push(0x0A);

    // Paper cut (full cut)
    commands.extend_from_slice(&[0x1D, 0x56, 0x00]);

    commands
}
