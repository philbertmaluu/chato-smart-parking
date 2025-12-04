import { useEffect, useState, useCallback } from 'react';
import { get, post, put, del } from '@/utils/api/api';
import { API_ENDPOINTS } from '@/utils/api/endpoints';
import type { Gate } from './use-gates';

export interface GateDevice {
  id: number;
  gate_id: number;
  device_type: 'camera';
  name: string | null;
  device_id: string | null;
  serial_number: string | null;
  mac_address: string | null;
  ip_address: string;
  http_port: number;
  rtsp_port: number | null;
  use_https: boolean;
  subnet_mask: string | null;
  gateway: string | null;
  dns_server: string | null;
  username: string;
  password: string;
  direction: 'entry' | 'exit' | 'both';
  status: 'active' | 'inactive' | 'maintenance' | 'error';
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
  deleted_at?: string | null;
  gate?: Gate; // when API includes related gate object
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{ url: string | null; label: string; active: boolean }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
  messages: string;
  status: number;
}

export interface CreateGateDeviceData {
  gate_id: number;
  device_type?: 'camera';
  name?: string | null;
  device_id?: string | null;
  serial_number?: string | null;
  mac_address?: string | null;
  ip_address: string;
  http_port?: number;
  rtsp_port?: number | null;
  use_https?: boolean;
  subnet_mask?: string | null;
  gateway?: string | null;
  dns_server?: string | null;
  username: string;
  password: string;
  direction?: 'entry' | 'exit' | 'both';
  status?: 'active' | 'inactive' | 'maintenance' | 'error';
  connection_timeout?: number;
  ping_interval?: number;
  supports_rtsp?: boolean;
  supports_snapshot?: boolean;
  supports_motion_detection?: boolean;
  supports_audio?: boolean;
  supports_ptz?: boolean;
  open_duration?: number | null;
  close_duration?: number | null;
  auto_close?: boolean;
}

export interface UpdateGateDeviceData extends Partial<CreateGateDeviceData> {
  id: number;
}

export const useGateDevices = () => {
  const [gateDevices, setGateDevices] = useState<GateDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    perPage: 15,
    lastPage: 1,
  });

  const fetchGateDevices = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<PaginatedResponse<GateDevice>>(
        `${API_ENDPOINTS.GATE_DEVICES.LIST}?page=${page}`
      );
      if (response?.success && response?.data) {
        setGateDevices(response.data.data || []);
        setPagination({
          currentPage: response.data.current_page || 1,
          total: response.data.total || 0,
          perPage: response.data.per_page || 15,
          lastPage: response.data.last_page || 1,
        });
      } else {
        setGateDevices([]);
        setPagination({ currentPage: 1, total: 0, perPage: 15, lastPage: 1 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gate devices');
      setGateDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGateDevice = async (data: CreateGateDeviceData) => {
    setLoading(true);
    setError(null);
    try {
      const created = await post<GateDevice>(API_ENDPOINTS.GATE_DEVICES.CREATE, data);
      setGateDevices((prev) => [...prev, created]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gate device');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateGateDevice = async (data: UpdateGateDeviceData) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await put<GateDevice>(
        API_ENDPOINTS.GATE_DEVICES.UPDATE(data.id),
        data
      );
      setGateDevices((prev) => prev.map((d) => (d.id === data.id ? updated : d)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update gate device');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteGateDevice = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await del(API_ENDPOINTS.GATE_DEVICES.DELETE(id));
      setGateDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete gate device');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveStatus = async (id: number, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await put<GateDevice>(
        API_ENDPOINTS.GATE_DEVICES.UPDATE(id),
        { status: status }
      );
      setGateDevices((prev) => prev.map((d) => (d.id === id ? updated : d)));
      return updated;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update gate device status'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchByGate = async (gateId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<GateDevice[]>(
        API_ENDPOINTS.GATE_DEVICES.BY_GATE(gateId)
      );
      setGateDevices(response || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gate devices');
      setGateDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = useCallback(async (page: number) => {
    await fetchGateDevices(page);
  }, [fetchGateDevices]);

  useEffect(() => {
    fetchGateDevices();
  }, [fetchGateDevices]);

  return {
    gateDevices,
    loading,
    error,
    pagination,
    fetchGateDevices,
    fetchByGate,
    handlePageChange,
    createGateDevice,
    updateGateDevice,
    deleteGateDevice,
    toggleActiveStatus,
  };
};

