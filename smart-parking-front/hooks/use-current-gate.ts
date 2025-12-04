import { useState, useEffect } from "react";

interface Gate {
  id: number;
  name: string;
  station?: {
    name: string;
    code?: string;
  };
  gate_type: string;
}

interface CurrentGate {
  id: number;
  name: string;
  stationName: string;
  stationCode?: string;
  gateType: string;
}

const CURRENT_GATE_KEY = "smart-parking-current-gate";

export function useCurrentGate() {
  const [currentGate, setCurrentGate] = useState<CurrentGate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load current gate from localStorage on mount
  useEffect(() => {
    const loadCurrentGate = () => {
      try {
        const stored = localStorage.getItem(CURRENT_GATE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setCurrentGate(parsed);
        }
      } catch (error) {
        console.error("Error loading current gate:", error);
        localStorage.removeItem(CURRENT_GATE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentGate();
  }, []);

  // Set current gate and persist to localStorage
  const selectGate = (gate: Gate) => {
    const currentGateData: CurrentGate = {
      id: gate.id,
      name: gate.name,
      stationName: gate.station?.name || "Unknown Station",
      stationCode: gate.station?.code,
      gateType: gate.gate_type,
    };

    setCurrentGate(currentGateData);
    
    try {
      localStorage.setItem(CURRENT_GATE_KEY, JSON.stringify(currentGateData));
    } catch (error) {
      console.error("Error saving current gate:", error);
    }
  };

  // Clear current gate (for logout)
  const clearGate = () => {
    setCurrentGate(null);
    try {
      localStorage.removeItem(CURRENT_GATE_KEY);
    } catch (error) {
      console.error("Error clearing current gate:", error);
    }
  };

  // Get display name for the gate
  const getGateDisplayName = () => {
    if (!currentGate) return null;
    return `${currentGate.name} - ${currentGate.stationName}`;
  };

  return {
    currentGate,
    isLoading,
    selectGate,
    clearGate,
    getGateDisplayName,
  };
}
