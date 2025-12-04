import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '@/utils/api/endpoints';
import { get, post, put, del } from '@/utils/api/api';

export interface Vehicle {
  id: number;
  body_type_id: number;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  color: string;
  owner_name: string;
  is_registered: boolean;
  is_exempted: boolean;
  exemption_reason?: string;
  exemption_expires_at?: string;
  created_at: string;
  updated_at: string;
  body_type?: {
    id: number;
    name: string;
    category: string;
  };
}

export interface CreateVehicleData {
  body_type_id: number;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  color: string;
  owner_name: string;
  is_registered: boolean;
  is_exempted: boolean;
  exemption_reason?: string;
  exemption_expires_at?: string;
}

export interface UpdateVehicleData {
  body_type_id?: number;
  plate_number?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  owner_name?: string;
  is_registered?: boolean;
  is_exempted?: boolean;
  exemption_reason?: string;
  exemption_expires_at?: string;
}

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  const fetchVehicles = useCallback(async (page: number = 1, search: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '15', // Use fixed per_page to avoid dependency issues
      });
      
      if (search) {
        params.append('search', search);
      }

      const response = await get<{
        success: boolean;
        data: {
          current_page: number;
          data: Vehicle[];
          last_page: number;
          per_page: number;
          total: number;
        };
        message: string;
        status: number;
      }>(`${API_ENDPOINTS.VEHICLES.LIST}?${params.toString()}`);
      
      setVehicles(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  }, []);

  const createVehicle = useCallback(async (data: CreateVehicleData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ success: boolean; data: Vehicle }>(
        API_ENDPOINTS.VEHICLES.CREATE,
        data
      );
      const created = response.data;
      setVehicles((prev) => [...prev, created]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vehicle');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVehicle = useCallback(async (id: number, data: UpdateVehicleData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await put<{ success: boolean; data: Vehicle }>(
        API_ENDPOINTS.VEHICLES.UPDATE(id),
        data
      );
      const updated = response.data;
      setVehicles((prev) =>
        prev.map((vehicle) =>
          vehicle.id === id ? updated : vehicle
        )
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vehicle');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteVehicle = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await del(API_ENDPOINTS.VEHICLES.DELETE(id));
      setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vehicle');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleVehicleStatus = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ success: boolean; data: Vehicle }>(
        API_ENDPOINTS.VEHICLES.TOGGLE_STATUS(id),
        {}
      );
      const updated = response.data;
      setVehicles((prev) =>
        prev.map((vehicle) =>
          vehicle.id === id ? updated : vehicle
        )
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle vehicle status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getActiveVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: Vehicle[] }>(
        API_ENDPOINTS.VEHICLES.ACTIVE_LIST
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active vehicles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getVehiclesByBodyType = useCallback(async (bodyTypeId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: Vehicle[] }>(
        API_ENDPOINTS.VEHICLES.BY_BODY_TYPE(bodyTypeId)
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicles by body type');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchVehicles = useCallback(async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: Vehicle[] }>(
        `${API_ENDPOINTS.VEHICLES.LIST}?search=${encodeURIComponent(searchTerm)}`
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search vehicles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    fetchVehicles(page);
  }, [fetchVehicles]);

  return {
    vehicles,
    loading,
    error,
    pagination,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    toggleVehicleStatus,
    getActiveVehicles,
    getVehiclesByBodyType,
    searchVehicles,
    handlePageChange,
  };
};