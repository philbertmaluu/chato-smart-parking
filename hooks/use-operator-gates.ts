import { useState, useCallback, useEffect } from 'react';
import { API_ENDPOINTS } from '@/utils/api/endpoints';
import { get, post } from '@/utils/api/api';

export interface Gate {
  id: number;
  name: string;
  gate_type: 'entry' | 'exit' | 'both';
  station_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  station?: {
    id: number;
    name: string;
    code: string;
  };
  is_occupied?: boolean;
  is_selected?: boolean;
  selected_by?: string;
  occupied_by?: {
    id: number;
    name: string;
  };
}

interface UseOperatorGatesReturn {
  availableGates: Gate[];
  selectedGate: Gate | null;
  loading: boolean;
  error: string | null;
  fetchAvailableGates: () => Promise<void>;
  selectGate: (gateId: number) => Promise<boolean>;
  deselectGate: () => Promise<boolean>;
}

export function useOperatorGates(): UseOperatorGatesReturn {
  const [availableGates, setAvailableGates] = useState<Gate[]>([]);
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableGates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await get<{
        success: boolean;
        data: {
          available_gates: Gate[];
          selected_gate: Gate | null;
        };
        message: string;
      }>(API_ENDPOINTS.OPERATORS.MY_AVAILABLE_GATES);
      
      if (response.success && response.data) {
        setAvailableGates(response.data.available_gates || []);
        // Set selected gate if available
        if (response.data.selected_gate) {
          setSelectedGate(response.data.selected_gate);
        } else {
          setSelectedGate(null);
        }
      } else {
        throw new Error(response.message || 'Failed to fetch gates');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching available gates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectGate = useCallback(async (gateId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await post<{
        success: boolean;
        data: {
          operator: any;
          gate_devices: any[];
        };
        message: string;
      }>(API_ENDPOINTS.OPERATORS.SELECT_GATE, { gate_id: gateId });
      
      if (response.success) {
        // Immediately update state with gate from availableGates for instant UI update
        const gateFromList = availableGates.find(g => g.id === gateId);
        if (gateFromList) {
          setSelectedGate(gateFromList);
        }
        
        // Refresh available gates in background to get updated list from backend
        fetchAvailableGates();
        return true;
      } else {
        throw new Error(response.message || 'Failed to select gate');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error selecting gate:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [availableGates, fetchAvailableGates]);

  const deselectGate = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await post<{
        success: boolean;
        data: any;
        message: string;
      }>(API_ENDPOINTS.OPERATORS.DESELECT_GATE, {});
      
      if (response.success) {
        // Clear selected gate
        setSelectedGate(null);
        // Refresh available gates to get updated list
        await fetchAvailableGates();
        return true;
      } else {
        throw new Error(response.message || 'Failed to deselect gate');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error deselecting gate:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAvailableGates]);

  useEffect(() => {
    fetchAvailableGates();
  }, [fetchAvailableGates]);

  return {
    availableGates,
    selectedGate,
    loading,
    error,
    fetchAvailableGates,
    selectGate,
    deselectGate,
  };
}
