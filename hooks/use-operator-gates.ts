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

export interface GateDevice {
  id: number;
  gate_id: number;
  device_type: string;
  name: string | null;
  device_id: string | null;
  serial_number: string | null;
  mac_address: string | null;
  ip_address: string;
  http_port: number;
  rtsp_port: number;
  use_https: boolean;
  subnet_mask: string | null;
  gateway: string | null;
  dns_server: string | null;
  username: string;
  password: string;
  direction: string;
  status: string;
  is_online: boolean;
  last_connected_at: string | null;
  last_ping_at: string | null;
  connection_timeout: number;
  ping_interval: number;
  supports_rtsp: boolean;
  supports_snapshot: boolean;
  supports_motion_detection: boolean;
  supports_audio: boolean;
  supports_ptz: boolean;
  open_duration: number | null;
  close_duration: number | null;
  auto_close: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  gate?: Gate;
}

interface UseOperatorGatesReturn {
  availableGates: Gate[];
  selectedGate: Gate | null;
  selectedGateDevices: GateDevice[];
  loading: boolean;
  error: string | null;
  fetchAvailableGates: () => Promise<void>;
  selectGate: (gateId: number) => Promise<boolean>;
  deselectGate: () => Promise<boolean>;
}

export function useOperatorGates(): UseOperatorGatesReturn {
  const [availableGates, setAvailableGates] = useState<Gate[]>([]);
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [selectedGateDevices, setSelectedGateDevices] = useState<GateDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSelectedGateDevices = useCallback(async () => {
    try {
      const response = await get<{
        success: boolean;
        data: any[];
        message: string;
      }>(API_ENDPOINTS.OPERATORS.MY_SELECTED_GATE_DEVICES);
      
      if (response.success && response.data) {
        setSelectedGateDevices(response.data || []);
      }
    } catch (err) {
      // Silently fail - gate might not have devices configured
      console.error('Error fetching gate devices:', err);
      setSelectedGateDevices([]);
    }
  }, []);

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
          // Fetch gate devices for the selected gate
          await fetchSelectedGateDevices();
        } else {
          setSelectedGate(null);
          setSelectedGateDevices([]);
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
  }, [fetchSelectedGateDevices]);

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
        // Store gate devices from response FIRST for instant camera feed update
        const gateDevices = response.data.gate_devices || [];
        setSelectedGateDevices(gateDevices);
        
        // Immediately update state with gate from availableGates for instant UI update
        const gateFromList = availableGates.find(g => g.id === gateId);
        if (gateFromList) {
          setSelectedGate(gateFromList);
        }
        
        // Refresh available gates in background to get updated list from backend
        // This will also fetch devices if needed, but we already have them from selectGate response
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
        // Clear selected gate and devices
        setSelectedGate(null);
        setSelectedGateDevices([]);
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
    selectedGateDevices,
    loading,
    error,
    fetchAvailableGates,
    selectGate,
    deselectGate,
  };
}
