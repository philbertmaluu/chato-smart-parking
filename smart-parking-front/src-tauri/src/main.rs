// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;  // This imports the entire 'commands' folder/module
mod serial;

use tauri::Builder;

fn main() {
    Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::gate::open_gate,  // Registers your gate command
            commands::printer::print_receipt,
            commands::printer::get_available_printers,
            serial::list_serial_ports,
            serial::open_gate_all_ports,
            serial::open_gate_specific_port,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}