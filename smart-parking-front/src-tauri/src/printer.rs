#[cfg(windows)]
use winapi::um::winspool::*;
#[cfg(windows)]
use winapi::shared::ntdef::HANDLE;
#[cfg(windows)]
use std::ffi::CString;
#[cfg(windows)]
use std::ptr;

#[cfg(windows)]
pub fn print_to_windows_printer(printer_name: &str, data: &[u8]) -> Result<(), String> {
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
pub fn print_to_windows_printer(_printer_name: &str, _data: &[u8]) -> Result<(), String> {
    Err("Windows printer support is only available on Windows".to_string())
}

#[cfg(windows)]
pub fn list_windows_printers() -> Result<Vec<String>, String> {
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
                let name_cstr = std::ffi::CStr::from_ptr(name_ptr as *const i8);
                if let Ok(name) = name_cstr.to_str() {
                    printers.push(name.to_string());
                }
            }

            offset += std::mem::size_of::<PRINTER_INFO_1A>();
        }

        Ok(printers)
    }
}

#[cfg(not(windows))]
pub fn list_windows_printers() -> Result<Vec<String>, String> {
    Err("Windows printer support is only available on Windows".to_string())
}

pub fn generate_escpos_receipt(receipt_data: &serde_json::Value) -> Vec<u8> {
    let mut commands = Vec::new();

    // 1. Initialize printer (ESC @)
    commands.extend_from_slice(&[0x1B, 0x40]);

    // 2. Header: Company Name
    commands.extend_from_slice(&[0x1B, 0x61, 0x01]); // Center
    commands.extend_from_slice(&[0x1B, 0x21, 0x10]); // Double height
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
            commands.extend_from_slice(b"      ");
            commands.extend_from_slice(s.as_bytes());
            commands.push(0x0A);
        });

    commands.extend_from_slice(b"****************************************\n\n");

    // 3. Body: Left Aligned Info
    commands.extend_from_slice(&[0x1B, 0x61, 0x00]); // Left align

    let info_fields = ["receipt_number", "receipt_ref", "date_time"];
    for field in info_fields {
        if let Some(s) = receipt_data.get(field).and_then(|v| v.as_str()) {
            commands.extend_from_slice(s.as_bytes());
            commands.push(0x0A);
        }
    }

    commands.push(0x0A);

    // 4. Items Table
    commands.extend_from_slice(b"Maelezo                    Kiasi (TZS)\n");
    commands.extend_from_slice(b"----------------------------------------\n");

    let desc = receipt_data.get("item_description").and_then(|v| v.as_str()).unwrap_or("Bus");
    let amount = receipt_data.get("total_amount")
        .or(receipt_data.get("item_amount"))
        .and_then(|v| v.as_str())
        .unwrap_or("3,000");

    commands.extend_from_slice(format!("{:<28}", desc).as_bytes());
    commands.extend_from_slice(format!("{:>12}", amount).as_bytes());
    commands.push(0x0A);

    // Quantity / Days
    let mut days_val = receipt_data.get("item_quantity")
        .and_then(|v| v.as_str())
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(0.0);
    if days_val < 0.0 { days_val = 0.0; }

    commands.extend_from_slice(format!("                            Day {:>6.1}\n", days_val).as_bytes());
    commands.extend_from_slice(b"----------------------------------------\n");

    // 5. Total Section
    commands.extend_from_slice(&[0x1B, 0x45, 0x01]); // Bold ON
    commands.extend_from_slice(b"JUMLA:                             ");
    commands.extend_from_slice(format!("{:>12}\n", amount).as_bytes());
    commands.extend_from_slice(&[0x1B, 0x45, 0x00]); // Bold OFF

    commands.push(0x0A);

    // 6. Operator & Location
    if let (Some(l), Some(v)) = (receipt_data.get("operator_label"), receipt_data.get("operator_name")) {
        commands.extend_from_slice(format!("{} {}\n", l.as_str().unwrap_or(""), v.as_str().unwrap_or("")).as_bytes());
    }
    if let (Some(l), Some(v)) = (receipt_data.get("location_label"), receipt_data.get("location")) {
        commands.extend_from_slice(format!("{} {}\n", l.as_str().unwrap_or(""), v.as_str().unwrap_or("")).as_bytes());
    }

    // --- FOOTER SECTION ---
    // 7. Footer Text (Centered)
    commands.extend_from_slice(&[0x1B, 0x61, 0x01]); // Center
    commands.extend_from_slice(b"\n*** MWISHO WA STAKABADHI ***\n");

    // 8. Feed and Cut
    // ESC d n: Feed n lines (here 6 lines) to move text past the tear-off bar
    commands.extend_from_slice(&[0x1B, 0x64, 0x06]); 
    
    // GS V m: Full cut
    commands.extend_from_slice(&[0x1D, 0x56, 0x00]);

    commands
}