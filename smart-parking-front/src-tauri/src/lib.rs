mod printer;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct PrintReceiptRequest {
    printer_name: String,
    receipt_data: serde_json::Value,
}

#[tauri::command]
fn print_receipt(request: PrintReceiptRequest) -> Result<String, String> {
    // Generate ESC/POS commands
    let escpos_data = printer::generate_escpos_receipt(&request.receipt_data);
    
    // Print to Windows printer
    #[cfg(windows)]
    {
        printer::print_to_windows_printer(&request.printer_name, &escpos_data)
            .map(|_| "Receipt printed successfully".to_string())
            .map_err(|e| format!("Print error: {}", e))
    }
    
    #[cfg(not(windows))]
    {
        Err("Windows printer support is only available on Windows".to_string())
    }
}

#[tauri::command]
fn get_available_printers() -> Result<Vec<String>, String> {
    #[cfg(windows)]
    {
        printer::list_windows_printers()
    }
    
    #[cfg(not(windows))]
    {
        Err("Windows printer support is only available on Windows".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![print_receipt, get_available_printers])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
