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
    pub printer_name: String,
    pub receipt_data: serde_json::Value,
}

#[tauri::command]
pub fn print_receipt(request: PrintReceiptRequest) -> Result<String, String> {
    let escpos = generate_escpos_receipt(&request.receipt_data);

    #[cfg(windows)]
    {
        print_to_windows_printer(&request.printer_name, &escpos)
            .map(|_| "Receipt printed successfully".to_string())
            .map_err(|e| e)
    }

    #[cfg(not(windows))]
    {
        Err("Windows printer support only".to_string())
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
        Err("Windows printer support only".to_string())
    }
}

/* ───────────────────────── WINDOWS RAW PRINT ───────────────────────── */

#[cfg(windows)]
fn print_to_windows_printer(printer_name: &str, data: &[u8]) -> Result<(), String> {
    unsafe {
        let name = CString::new(printer_name).map_err(|_| "Invalid printer name")?;
        let mut handle: HANDLE = ptr::null_mut();

        let mut defaults = PRINTER_DEFAULTSA {
            pDataType: ptr::null_mut(),
            pDevMode: ptr::null_mut(),
            DesiredAccess: PRINTER_ACCESS_USE,
        };

        if OpenPrinterA(name.as_ptr() as *mut i8, &mut handle, &mut defaults) == 0 {
            return Err("Failed to open printer".into());
        }

        let doc_name = CString::new("Parking Receipt").unwrap();
        let doc_type = CString::new("RAW").unwrap();

        let mut info = DOC_INFO_1A {
            pDocName: doc_name.as_ptr() as *mut i8,
            pOutputFile: ptr::null_mut(),
            pDatatype: doc_type.as_ptr() as *mut i8,
        };

        if StartDocPrinterA(handle, 1, &mut info as *mut _ as *mut u8) == 0 {
            ClosePrinter(handle);
            return Err("Failed to start print job".into());
        }

        StartPagePrinter(handle);

        let mut written = 0;
        WritePrinter(
            handle,
            data.as_ptr() as *mut _,
            data.len() as u32,
            &mut written,
        );

        EndPagePrinter(handle);
        EndDocPrinter(handle);
        ClosePrinter(handle);

        Ok(())
    }
}

#[cfg(windows)]
fn list_windows_printers() -> Result<Vec<String>, String> {
    unsafe {
        let mut needed = 0;
        let mut returned = 0;

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
            return Ok(vec![]);
        }

        let mut buffer = vec![0u8; needed as usize];

        EnumPrintersA(
            PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS,
            ptr::null_mut(),
            1,
            buffer.as_mut_ptr(),
            needed,
            &mut needed,
            &mut returned,
        );

        let mut printers = Vec::new();
        let mut offset = 0;

        for _ in 0..returned {
            let info = buffer.as_ptr().add(offset) as *const PRINTER_INFO_1A;
            let name = CString::from_raw((*info).pName as *mut i8)
                .to_string_lossy()
                .to_string();
            printers.push(name);
            offset += std::mem::size_of::<PRINTER_INFO_1A>();
        }

        Ok(printers)
    }
}

/* ───────────────────────── ESC/POS QR CODE ───────────────────────── */

fn generate_qr_code_commands(data: &str) -> Vec<u8> {
    let bytes = data.as_bytes();
    let len = bytes.len();
    let pl = ((len + 3) % 256) as u8;
    let ph = ((len + 3) / 256) as u8;

    let mut c = Vec::new();
    c.extend_from_slice(&[0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]);
    c.extend_from_slice(&[0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x08]);
    c.extend_from_slice(&[0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31]);
    c.extend_from_slice(&[0x1D, 0x28, 0x6B, pl, ph, 0x31, 0x50, 0x30]);
    c.extend_from_slice(bytes);
    c.extend_from_slice(&[0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]);
    c
}

/* ───────────────────────── ESC/POS RECEIPT ───────────────────────── */

fn generate_escpos_receipt(d: &serde_json::Value) -> Vec<u8> {
    let mut c = Vec::new();

    // INIT
    c.extend_from_slice(&[0x1B, 0x40]);
    c.extend_from_slice(&[0x1B, 0x61, 0x01]);

    // HEADER
    c.extend_from_slice(&[0x1B, 0x21, 0x10]);
    c.extend_from_slice(d.get("company_name")
        .and_then(|v| v.as_str())
        .unwrap_or("CHATO DISTRICT COUNCIL")
        .as_bytes());
    c.push(0x0A);

    c.extend_from_slice(&[0x1B, 0x21, 0x00]);
    c.extend_from_slice(d.get("company_subtitle")
        .and_then(|v| v.as_str())
        .unwrap_or("STAKABADHI YA MALIPO")
        .as_bytes());
    c.push(0x0A);

    c.extend_from_slice("=".repeat(40).as_bytes());
    c.push(0x0A);

    // LEFT ALIGN
    c.extend_from_slice(&[0x1B, 0x61, 0x00]);

    macro_rules! line {
        ($label:expr, $key:expr) => {
            if let Some(v) = d.get($key).and_then(|v| v.as_str()) {
                c.extend_from_slice($label);
                c.extend_from_slice(v.as_bytes());
                c.push(0x0A);
            }
        };
    }

    line!(b"Risiti: ", "receipt_number");
    line!(b"Namba ya Gari: ", "plate_number");
    line!(b"Muda wa Kuingia: ", "entry_time");
    line!(b"Muda wa Kutoka: ", "exit_time");

    c.extend_from_slice("-".repeat(40).as_bytes());
    c.push(0x0A);

    // TABLE HEADER
    c.extend_from_slice(b"MAELEZO              SIKU     KIASI\n");
    c.extend_from_slice("-".repeat(40).as_bytes());
    c.push(0x0A);

    // TABLE ROW
    let desc = d.get("item_description").and_then(|v| v.as_str()).unwrap_or("-");
    let siku = d.get("item_quantity").and_then(|v| v.as_str()).unwrap_or("0.0");
    let amount = d.get("item_amount")
        .or_else(|| d.get("total_amount"))
        .and_then(|v| v.as_str())
        .unwrap_or("0");

    c.extend_from_slice(format!("{:<20}{:>6}{:>14}", desc, siku, amount).as_bytes());
    c.push(0x0A);

    c.extend_from_slice("=".repeat(40).as_bytes());
    c.push(0x0A);

    // TOTAL
    c.extend_from_slice(&[0x1B, 0x61, 0x01, 0x1B, 0x45, 0x01]);
    c.extend_from_slice(format!("JUMLA: TZS {}", amount).as_bytes());
    c.extend_from_slice(&[0x1B, 0x45, 0x00]);
    c.push(0x0A);

    // QR
    if let Some(qr) = d.get("qr_code_data").and_then(|v| v.as_str()) {
        c.push(0x0A);
        c.extend_from_slice(b"LIPIA KWA TIGOPESA\n");
        c.extend_from_slice(&generate_qr_code_commands(qr));
        c.push(0x0A);

        if let Some(n) = d.get("tigopesa_number").and_then(|v| v.as_str()) {
            c.extend_from_slice(b"Lipa Namba: ");
            c.extend_from_slice(n.as_bytes());
            c.push(0x0A);
        }
    }

    // OPERATOR + LOCATION
    c.push(0x0A);
    line!(b"Mpokea Fedha: ", "operator_name");
    line!(b"Lango: ", "location");

    // FOOTER (BOTTOM)
    c.push(0x0A);
    c.push(0x0A);

    c.extend_from_slice(&[0x1B, 0x61, 0x01]);
    c.extend_from_slice("=".repeat(40).as_bytes());
    c.push(0x0A);

    c.extend_from_slice(&[0x1B, 0x21, 0x10]);
    c.extend_from_slice(b"MWISHO WA STAKABADHI");
    c.push(0x0A);

    c.extend_from_slice(&[0x1B, 0x21, 0x00]);
    c.extend_from_slice("=".repeat(40).as_bytes());
    c.push(0x0A);

    // FEED + CUT
    c.push(0x0A);
    c.push(0x0A);
    c.push(0x0A);
    c.extend_from_slice(&[0x1D, 0x56, 0x00]);

    c
}
