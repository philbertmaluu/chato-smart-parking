use tauri::command;

#[command]
pub fn open_gate(command: String) -> Result<String, String> {
    use std::process::Command;

    // Step 1: Auto-detect first COM port on Windows
    let mut port = "COM4".to_string(); // fallback

    if cfg!(windows) {
        let wmic_output = Command::new("wmic")
            .arg("path")
            .arg("Win32_SerialPort")
            .arg("get")
            .arg("DeviceID")
            .output()
            .map_err(|e| format!("Failed to run wmic: {}", e))?;

        let output_str = String::from_utf8_lossy(&wmic_output.stdout);

        for line in output_str.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("COM") {
                port = trimmed.to_string();
                break;
            }
        }
    }

    // Step 2: Build & execute the command
    let full_cmd = format!("echo {} > {}", command, port);

    let output = Command::new("cmd")
        .arg("/C")
        .arg(&full_cmd)
        .output()
        .map_err(|e| format!("Failed to execute command: {}", e))?;

    if output.status.success() {
        Ok(format!("Gate opened successfully on port {}", port))
    } else {
        let error = String::from_utf8_lossy(&output.stderr).to_string();
        Err(format!("Command failed on port {}: {}", port, error.trim()))
    }
}