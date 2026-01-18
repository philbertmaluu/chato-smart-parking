use serde::{Deserialize, Serialize};
use serialport::SerialPortType;
use std::io::Write;
use std::time::Duration;

#[derive(Debug, Serialize, Deserialize)]
pub struct PortInfo {
    pub port_name: String,
    pub port_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GateResponse {
    pub success: bool,
    pub message: String,
    pub ports_tried: Vec<String>,
    pub successful_port: Option<String>,
}

#[tauri::command]
pub fn list_serial_ports() -> Result<Vec<PortInfo>, String> {
    println!("[Rust] Listing serial ports...");
    
    let ports = serialport::available_ports()
        .map_err(|e| format!("Failed to list ports: {}", e))?;
    
    let port_list: Vec<PortInfo> = ports
        .into_iter()
        .map(|p| {
            let port_type = match p.port_type {
                SerialPortType::UsbPort(_) => "USB".to_string(),
                SerialPortType::PciPort => "PCI".to_string(),
                SerialPortType::BluetoothPort => "Bluetooth".to_string(),
                SerialPortType::Unknown => "Unknown".to_string(),
            };
            
            println!("[Rust] Found port: {} ({})", p.port_name, port_type);
            
            PortInfo {
                port_name: p.port_name.clone(),
                port_type,
            }
        })
        .collect();
    
    println!("[Rust] Total ports found: {}", port_list.len());
    Ok(port_list)
}

#[tauri::command]
pub fn open_gate_all_ports(command: String) -> Result<GateResponse, String> {
    println!("[Rust] Opening gate on ALL ports with command: '{}'", command);
    
    let ports = serialport::available_ports()
        .map_err(|e| format!("Failed to list ports: {}", e))?;
    
    if ports.is_empty() {
        let err_msg = "No serial ports found on this system".to_string();
        println!("[Rust] ERROR: {}", err_msg);
        return Err(err_msg);
    }

    println!("[Rust] Found {} ports, trying each...", ports.len());

    let mut ports_tried = Vec::new();
    let mut successful_port = None;
    let mut any_success = false;

    for port_info in ports {
        let port_name = port_info.port_name.clone();
        ports_tried.push(port_name.clone());

        println!("[Rust] Trying port: {}", port_name);

        match serialport::new(&port_name, 9600)
            .timeout(Duration::from_millis(1000))
            .open()
        {
            Ok(mut port) => {
                let cmd_with_newline = format!("{}\r\n", command);
                
                match port.write_all(cmd_with_newline.as_bytes()) {
                    Ok(_) => {
                        println!("[Rust] ✓ Successfully sent '{}' to {}", command, port_name);
                        successful_port = Some(port_name.clone());
                        any_success = true;
                        
                        // Flush to ensure data is sent
                        let _ = port.flush();
                    }
                    Err(e) => {
                        println!("[Rust] ✗ Failed to write to {}: {}", port_name, e);
                    }
                }
            }
            Err(e) => {
                println!("[Rust] ✗ Failed to open {}: {}", port_name, e);
            }
        }
    }

    if any_success {
        let msg = format!("Gate command '{}' sent successfully", command);
        println!("[Rust] SUCCESS: {}", msg);
        
        Ok(GateResponse {
            success: true,
            message: msg,
            ports_tried,
            successful_port,
        })
    } else {
        let err_msg = format!(
            "Failed to send command to any port. Tried: {}",
            ports_tried.join(", ")
        );
        println!("[Rust] ERROR: {}", err_msg);
        Err(err_msg)
    }
}

#[tauri::command]
pub fn open_gate_specific_port(port_name: String, command: String) -> Result<GateResponse, String> {
    println!("[Rust] Opening gate on SPECIFIC port '{}' with command: '{}'", port_name, command);
    
    match serialport::new(&port_name, 9600)
        .timeout(Duration::from_millis(1000))
        .open()
    {
        Ok(mut port) => {
            let cmd_with_newline = format!("{}\r\n", command);
            
            port.write_all(cmd_with_newline.as_bytes())
                .map_err(|e| format!("Failed to write to {}: {}", port_name, e))?;

            // Flush to ensure data is sent
            port.flush()
                .map_err(|e| format!("Failed to flush {}: {}", port_name, e))?;

            println!("[Rust] ✓ Gate command sent to {}", port_name);

            Ok(GateResponse {
                success: true,
                message: format!("Gate opened via {}", port_name),
                ports_tried: vec![port_name.clone()],
                successful_port: Some(port_name),
            })
        }
        Err(e) => {
            let err_msg = format!("Failed to open {}: {}", port_name, e);
            println!("[Rust] ERROR: {}", err_msg);
            Err(err_msg)
        }
    }
}

