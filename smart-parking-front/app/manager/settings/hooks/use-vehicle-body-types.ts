import { useState, useEffect, useCallback } from 'react';
import { get, post, put, del } from '@/utils/api/api';
import { API_ENDPOINTS } from '@/utils/api/endpoints';

export interface VehicleBodyType {
  id: number;
  name: string;
  description?: string;
  category?: 'light' | 'medium' | 'heavy' | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  vehicles?: any[];
  prices?: any[];
  bundle_vehicles?: any[];
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
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
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

export interface CreateVehicleBodyTypeData {
  name: string;
  description?: string;
  category?: 'light' | 'medium' | 'heavy';
  is_active?: boolean;
}

export interface UpdateVehicleBodyTypeData extends Partial<CreateVehicleBodyTypeData> {
  id: number;
}

export const useVehicleBodyTypes = () => {
  const [vehicleBodyTypes, setVehicleBodyTypes] = useState<VehicleBodyType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    perPage: 15,
    lastPage: 1,
  });

  // Fetch all vehicle body types
  const fetchVehicleBodyTypes = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<PaginatedResponse<VehicleBodyType>>(
        `${API_ENDPOINTS.VEHICLE_BODY_TYPES.LIST}?page=${page}`
      );
      
      if (response?.success && response?.data) {
        setVehicleBodyTypes(response.data.data || []);
        setPagination({
          currentPage: response.data.current_page || 1,
          total: response.data.total || 0,
          perPage: response.data.per_page || 15,
          lastPage: response.data.last_page || 1,
        });
      } else {
        setVehicleBodyTypes([]);
        setPagination({
          currentPage: 1,
          total: 0,
          perPage: 15,
          lastPage: 1,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicle body types');
      setVehicleBodyTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new vehicle body type
  const createVehicleBodyType = useCallback(async (data: CreateVehicleBodyTypeData) => {
    setLoading(true);
    setError(null);
    try {
      const newVehicleBodyType = await post<VehicleBodyType>(
        API_ENDPOINTS.VEHICLE_BODY_TYPES.CREATE,
        data
      );
      setVehicleBodyTypes(prev => [...prev, newVehicleBodyType]);
      return newVehicleBodyType;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vehicle body type');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update vehicle body type
  const updateVehicleBodyType = useCallback(async (data: UpdateVehicleBodyTypeData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedVehicleBodyType = await put<VehicleBodyType>(
        API_ENDPOINTS.VEHICLE_BODY_TYPES.UPDATE(data.id),
        data
      );
      setVehicleBodyTypes(prev =>
        prev.map(item =>
          item.id === data.id ? updatedVehicleBodyType : item
        )
      );
      return updatedVehicleBodyType;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vehicle body type');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete vehicle body type
  const deleteVehicleBodyType = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await del(API_ENDPOINTS.VEHICLE_BODY_TYPES.DELETE(id));
      setVehicleBodyTypes(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vehicle body type');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle active status
  const toggleActiveStatus = useCallback(async (id: number, isActive: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const updatedVehicleBodyType = await put<VehicleBodyType>(
        API_ENDPOINTS.VEHICLE_BODY_TYPES.UPDATE(id),
        { is_active: isActive }
      );
      setVehicleBodyTypes(prev =>
        prev.map(item =>
          item.id === id ? updatedVehicleBodyType : item
        )
      );
      return updatedVehicleBodyType;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vehicle body type status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle page change
  const handlePageChange = useCallback(async (page: number) => {
    await fetchVehicleBodyTypes(page);
  }, [fetchVehicleBodyTypes]);

  // Load vehicle body types on mount
  useEffect(() => {
    fetchVehicleBodyTypes();
  }, []);

  return {
    vehicleBodyTypes,
    loading,
    error,
    pagination,
    fetchVehicleBodyTypes,
    handlePageChange,
    createVehicleBodyType,
    updateVehicleBodyType,
    deleteVehicleBodyType,
    toggleActiveStatus,
  };
};
