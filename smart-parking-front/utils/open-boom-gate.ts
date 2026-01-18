// utils/open-boom-gate.ts
// Isolated function for opening boom gate via serial port

export async function openBoomGate(port: string = "COM4") {
  // Safety check - only run in Tauri desktop environment
  if (typeof window === "undefined" || !(window as any).__TAURI__) {
    console.log(`[BROWSER SIMULATION] echo hell > ${port}`);
    return { success: true, message: "Simulation: gate opened (browser)" };
  }

  try {
    // Dynamic import - only loads in real Tauri runtime
    const { Command } = await import("@tauri-apps/api/shell");

    const cmd = new Command("cmd", ["/C", `echo hell > ${port}`]);
    const output = await cmd.execute();

    if (output.code === 0) {
      console.log("Gate command success:", output.stdout);
      return { success: true, message: "Gate opened successfully" };
    } else {
      console.error("Gate command failed:", output.stderr);
      return { success: false, message: "Failed to open gate" };
    }
  } catch (err: any) {
    console.error("Tauri gate error:", err);
    return { success: false, message: err.message || "Unknown error" };
  }
}