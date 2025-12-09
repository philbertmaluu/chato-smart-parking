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

        // Open printer
        let result = OpenPrinterA(
            printer_name_cstr.as_ptr() as *mut i8,
            &mut h_printer,
            &mut printer_defaults,
        );

        if result == 0 {
            return Err(format!("Failed to open printer: {}", printer_name));
        }

        // Start document
        let doc_name = CString::new("Smart Parking Receipt").unwrap();
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

        // Start page
        if StartPagePrinter(h_printer) == 0 {
            EndDocPrinter(h_printer);
            ClosePrinter(h_printer);
            return Err("Failed to start page".to_string());
        }

        // Write data
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

        // End page and document
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
        
        // First call to get the size needed (using Level 1 for simpler structure)
        EnumPrintersA(
            PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS,
            ptr::null_mut(),
            1, // Level 1 - simpler structure
            ptr::null_mut(),
            0,
            &mut needed,
            &mut returned,
        );
        
        if needed == 0 {
            return Ok(Vec::new());
        }
        
        // Allocate buffer
        let mut buffer = vec![0u8; needed as usize];
        
        // Second call to get the actual data
        let result = EnumPrintersA(
            PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS,
            ptr::null_mut(),
            1, // Level 1
            buffer.as_mut_ptr() as *mut u8,
            needed,
            &mut needed,
            &mut returned,
        );
        
        if result == 0 {
            return Err("Failed to enumerate printers".to_string());
        }
        
        let mut printers = Vec::new();
        let mut offset = 0;
        
        // PRINTER_INFO_1A has a fixed size
        for _ in 0..returned {
            let printer_info = buffer.as_ptr().add(offset) as *const PRINTER_INFO_1A;
            let name_ptr = (*printer_info).pName;
            
            if !name_ptr.is_null() {
                let name_cstr = CString::from_raw(name_ptr as *mut i8);
                if let Ok(name) = name_cstr.to_str() {
                    printers.push(name.to_string());
                }
                // Don't drop the CString as it's owned by Windows
                std::mem::forget(name_cstr);
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

// ESC/POS command helpers
pub fn generate_escpos_receipt(receipt_data: &serde_json::Value) -> Vec<u8> {
    let mut commands = Vec::new();
    
    // Initialize printer
    commands.extend_from_slice(&[0x1B, 0x40]); // ESC @ - Initialize
    
    // Set center alignment
    commands.extend_from_slice(&[0x1B, 0x61, 0x01]); // ESC a 1 - Center
    
    // Set double width and height for header
    commands.extend_from_slice(&[0x1D, 0x21, 0x11]); // GS ! 11 - Double width and height
    
    // Company name
    if let Some(company) = receipt_data.get("company_name") {
        if let Some(name) = company.as_str() {
            commands.extend_from_slice(name.as_bytes());
            commands.push(0x0A); // Line feed
        }
    }
    
    // Reset text size
    commands.extend_from_slice(&[0x1D, 0x21, 0x00]); // GS ! 00 - Normal size
    
    // Receipt type
    if let Some(receipt_type) = receipt_data.get("receipt_type") {
        if let Some(typ) = receipt_type.as_str() {
            commands.extend_from_slice(typ.as_bytes());
            commands.push(0x0A);
        }
    }
    
    commands.extend_from_slice(b"================================");
    commands.push(0x0A);
    
    // Set left alignment
    commands.extend_from_slice(&[0x1B, 0x61, 0x00]); // ESC a 0 - Left
    
    // Core receipt identifiers
    if let Some(receipt_id) = receipt_data.get("receipt_id") {
        commands.extend_from_slice(b"Receipt No: ");
        if let Some(id) = receipt_id.as_str() {
            commands.extend_from_slice(id.as_bytes());
        }
        commands.push(0x0A);
    }
    
    if let Some(plate) = receipt_data.get("plate_number") {
        commands.extend_from_slice(b"Plate No: ");
        if let Some(p) = plate.as_str() {
            commands.extend_from_slice(p.as_bytes());
        }
        commands.push(0x0A);
    }
    
    if let Some(vehicle_type) = receipt_data.get("vehicle_type") {
        commands.extend_from_slice(b"Vehicle Type: ");
        if let Some(vt) = vehicle_type.as_str() {
            commands.extend_from_slice(vt.as_bytes());
        }
        commands.push(0x0A);
    }
    
    // Times and duration
    if let Some(entry_time) = receipt_data.get("entry_time") {
        commands.extend_from_slice(b"Entry Time: ");
        if let Some(et) = entry_time.as_str() {
            commands.extend_from_slice(et.as_bytes());
        }
        commands.push(0x0A);
    }
    
    if let Some(exit_time) = receipt_data.get("exit_time") {
        commands.extend_from_slice(b"Exit Time: ");
        if let Some(xt) = exit_time.as_str() {
            commands.extend_from_slice(xt.as_bytes());
        }
        commands.push(0x0A);
    }
    
    if let Some(duration) = receipt_data.get("duration") {
        commands.extend_from_slice(b"Duration: ");
        if let Some(d) = duration.as_str() {
            commands.extend_from_slice(d.as_bytes());
        }
        commands.push(0x0A);
    }
    
    // Gate / payment
    if let Some(gate) = receipt_data.get("gate") {
        commands.extend_from_slice(b"Gate: ");
        if let Some(g) = gate.as_str() {
            commands.extend_from_slice(g.as_bytes());
        }
        commands.push(0x0A);
    }
    
    if let Some(payment_method) = receipt_data.get("payment_method") {
        commands.extend_from_slice(b"Payment: ");
        if let Some(pm) = payment_method.as_str() {
            commands.extend_from_slice(pm.as_bytes());
        }
        commands.push(0x0A);
    }

    if let Some(station) = receipt_data.get("station") {
        commands.extend_from_slice(b"Station: ");
        if let Some(st) = station.as_str() {
            commands.extend_from_slice(st.as_bytes());
        }
        commands.push(0x0A);
    }

    if let Some(operator) = receipt_data.get("operator") {
        commands.extend_from_slice(b"Operator: ");
        if let Some(op) = operator.as_str() {
            commands.extend_from_slice(op.as_bytes());
        }
        commands.push(0x0A);
    }
    
    commands.extend_from_slice(b"--------------------------------");
    commands.push(0x0A);
    
    // Amounts
    if let Some(base_amount) = receipt_data.get("base_amount") {
        commands.extend_from_slice(b"Base Amount: ");
        if let Some(ba) = base_amount.as_str() {
            commands.extend_from_slice(ba.as_bytes());
        }
        commands.push(0x0A);
    }
    
    if let Some(discount_amount) = receipt_data.get("discount_amount") {
        commands.extend_from_slice(b"Discount: ");
        if let Some(da) = discount_amount.as_str() {
            commands.extend_from_slice(da.as_bytes());
        }
        commands.push(0x0A);
    }
    
    if let Some(total_amount) = receipt_data.get("total_amount") {
        commands.extend_from_slice(&[0x1B, 0x21, 0x08]); // Bold
        commands.extend_from_slice(b"Total Amount: ");
        if let Some(ta) = total_amount.as_str() {
            commands.extend_from_slice(ta.as_bytes());
        }
        commands.extend_from_slice(&[0x1B, 0x21, 0x00]); // Normal
        commands.push(0x0A);
    } else if let Some(amount) = receipt_data.get("amount") {
        commands.extend_from_slice(&[0x1B, 0x21, 0x08]); // Bold
        commands.extend_from_slice(b"Amount: ");
        if let Some(amt) = amount.as_str() {
            commands.extend_from_slice(amt.as_bytes());
        }
        commands.extend_from_slice(&[0x1B, 0x21, 0x00]); // Normal
        commands.push(0x0A);
    }
    
    commands.extend_from_slice(b"================================");
    commands.push(0x0A);
    
    // Footer
    commands.extend_from_slice(&[0x1B, 0x61, 0x01]); // Center
    if let Some(footer) = receipt_data.get("footer") {
        if let Some(f) = footer.as_str() {
            commands.extend_from_slice(f.as_bytes());
        }
    } else {
        commands.extend_from_slice(b"Thank you!");
    }
    commands.push(0x0A);
    commands.push(0x0A);
    commands.push(0x0A);
    
    // Cut paper
    commands.extend_from_slice(&[0x1D, 0x56, 0x41, 0x03]); // GS V A 3 - Partial cut
    
    commands
}

