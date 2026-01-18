"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DoorOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OpenGateButtonProps {
  selectedGate?: {
    id: number;
    name: string;
  };
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  command?: string;
  specificPort?: string | null;
}

export function OpenGateButton({ 
  selectedGate, 
  size = "lg", 
  variant = "default",
  className = "",
  command = "hell",
  specificPort = null
}: OpenGateButtonProps) {
  const [gateOpening, setGateOpening] = useState(false);
  const [tauriAvailable, setTauriAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const checkTauri = async () => {
      try {
        // Tauri v2 check
        if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
          console.log('[OpenGateButton] Tauri v2 detected');
          setTauriAvailable(true);
          
          // Try to import invoke to verify it works
          const { invoke } = await import('@tauri-apps/api/core');
          console.log('[OpenGateButton] Tauri invoke available:', !!invoke);
        } else {
          console.log('[OpenGateButton] Tauri NOT detected');
          setTauriAvailable(false);
        }
      } catch (error) {
        console.error('[OpenGateButton] Tauri check error:', error);
        setTauriAvailable(false);
      }
    };

    checkTauri();
    
    // Recheck after delay
    const timer = setTimeout(checkTauri, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleOpenGate = async () => {
    if (selectedGate) {
      console.log(`[OpenGateButton] Opening gate: ${selectedGate.name} (ID: ${selectedGate.id})`);
    }

    try {
      setGateOpening(true);
      
      // Check Tauri availability
      if (!tauriAvailable) {
        toast.error("Desktop app required", {
          description: "Gate control only works in the desktop application",
          duration: 5000,
        });
        return;
      }

      // Import Tauri invoke (v2 way)
      const { invoke } = await import('@tauri-apps/api/core');
      
      console.log('[OpenGateButton] Invoking Rust command...');

      try {
        let result: any;
        
        if (specificPort) {
          console.log(`[OpenGateButton] Calling open_gate_specific_port: ${specificPort}`);
          result = await invoke('open_gate_specific_port', {
            portName: specificPort,
            command: command
          });
        } else {
          console.log('[OpenGateButton] Calling open_gate_all_ports');
          result = await invoke('open_gate_all_ports', {
            command: command
          });
        }

        console.log('[OpenGateButton] Rust response:', result);

        toast.success("Gate opened successfully!", {
          description: result.successful_port 
            ? `${selectedGate?.name || 'Gate'} via ${result.successful_port}`
            : `Command sent to ${result.ports_tried?.length || 0} port(s)`,
          duration: 3000,
        });

      } catch (tauriError: any) {
        console.error('[OpenGateButton] Tauri command error:', tauriError);
        toast.error("Failed to open gate", {
          description: String(tauriError),
        });
      }
    } catch (error: any) {
      console.error('[OpenGateButton] General error:', error);
      toast.error("Failed to open gate", {
        description: error.message || "Unknown error occurred"
      });
    } finally {
      setGateOpening(false);
    }
  };

  return (
    <Button
      onClick={handleOpenGate}
      disabled={gateOpening || tauriAvailable === false}
      size={size}
      variant={variant}
      className={`gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 ${className}`}
      title={tauriAvailable === false ? "Desktop app required for gate control" : "Open gate on all COM ports"}
    >
      {gateOpening ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Opening...
        </>
      ) : (
        <>
          <DoorOpen className="h-4 w-4" />
          Open Gate
          {tauriAvailable === false && <span className="ml-1 text-xs opacity-70">(Desktop only)</span>}
        </>
      )}
    </Button>
  );
}

export default OpenGateButton;