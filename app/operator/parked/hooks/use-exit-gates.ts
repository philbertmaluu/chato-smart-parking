import { useState, useEffect } from 'react';
import { GateControlService } from '@/utils/api/vehicle-passage-service';
import { toast } from 'sonner';

export interface ExitGate {
  id: number;
  name: string;
  gate_type: string;
  is_active: boolean;
  station?: {
    id: number;
    name: string;
    code?: string;
  };
}

export const useExitGates = () => {
  const [exitGates, setExitGates] = useState<ExitGate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGateId, setSelectedGateId] = useState<number | null>(null);

  // Fetch active gates that can be used for exit
  const fetchExitGates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await GateControlService.getActiveGates();
      
      // Handle the API response structure
      let gates: any[] = [];
      
      if (response && response.success && Array.isArray(response.data)) {
        gates = response.data;
      } else {
        throw new Error('Invalid response format: gates data is not available');
      }
      
      // Filter gates that can be used for exit (exit or both types)
      const exitGates = gates.filter(
        (gate: any) => gate.gate_type === 'exit' || gate.gate_type === 'both'
      );
      
      setExitGates(exitGates);
      
      // Auto-select first exit gate if available
      if (exitGates.length > 0 && !selectedGateId) {
        setSelectedGateId(exitGates[0].id);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch exit gates';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching exit gates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Select an exit gate
  const selectExitGate = (gateId: number) => {
    setSelectedGateId(gateId);
  };

  // Get selected gate details
  const getSelectedGate = (): ExitGate | null => {
    return exitGates.find(gate => gate.id === selectedGateId) || null;
  };

  // Test gate connection
  const testGateConnection = async (gateId: number) => {
    try {
      const result = await GateControlService.testGateConnection(gateId);
      if (result.success) {
        toast.success(`Gate ${result.data.gate_name} connection test successful`);
        return result;
      } else {
        toast.error(`Gate connection test failed: ${result.message}`);
        return result;
      }
    } catch (err: any) {
      toast.error(`Gate connection test error: ${err.message}`);
      throw err;
    }
  };

  // Manual gate control (for testing)
  const manualGateControl = async (
    gateId: number,
    action: 'open' | 'close' | 'deny',
    reason?: string
  ) => {
    try {
      const result = await GateControlService.manualControl({
        gate_id: gateId,
        action,
        reason: reason || 'Manual control from operator interface',
      });

      if (result.success) {
        toast.success(`Gate ${action} command sent successfully`);
        return result;
      } else {
        toast.error(`Gate control failed: ${result.message}`);
        return result;
      }
    } catch (err: any) {
      toast.error(`Gate control error: ${err.message}`);
      throw err;
    }
  };

  // Load exit gates on mount
  useEffect(() => {
    fetchExitGates();
  }, []);

  return {
    exitGates,
    loading,
    error,
    selectedGateId,
    selectedGate: getSelectedGate(),
    fetchExitGates,
    selectExitGate,
    testGateConnection,
    manualGateControl,
  };
};
