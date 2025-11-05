import { useState, useCallback, useEffect } from 'react';

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
}

const API_BASE_URL = 'http://127.0.0.1:8000/api/toll-v1';

export function useOperatorGates(): UseOperatorGatesReturn {
  const [availableGates, setAvailableGates] = useState<Gate[]>([]);
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }, []);

  const fetchAvailableGates = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      // Silently skip fetching if not authenticated
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/operators/me/available-gates`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch available gates: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setAvailableGates(result.data.available_gates || []);
        setSelectedGate(result.data.selected_gate || null);
      } else {
        throw new Error(result.message || 'Failed to fetch gates');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching available gates:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  const selectGate = useCallback(async (gateId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/operators/me/select-gate`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ gate_id: gateId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to select gate: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setSelectedGate(result.data);
        await fetchAvailableGates();
        return true;
      } else {
        throw new Error(result.message || 'Failed to select gate');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error selecting gate:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, fetchAvailableGates]);

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
  };
}
