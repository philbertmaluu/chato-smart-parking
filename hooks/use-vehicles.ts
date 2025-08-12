import { useState, useEffect } from 'react';
import { get, post, put, del } from '@/utils/api/api';
import { API_ENDPOINTS } from '@/utils/api/endpoints';

export interface Vehicle {
  id: number;
  body_type_id: number;
  plate_number: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  owner_name?: string;
  is_registered: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  body_type?: {
    id: number;
    name: string;
    description?: string;
    category?: 'light' | 'medium' | 'heavy';
    is_active: boolean;
  };
}

export interface CreateVehicleData {
  body_type_id: number;
  plate_number: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  owner_name?: string;
  is_registered?: boolean;
}

export interface UpdateVehicleData extends Partial<CreateVehicleData> {
  id: number;
}

export interface VehicleLookupResponse {
  success: boolean;
  data: Vehicle | null;
  message: string;
  exists: boolean;
}

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    perPage: 15,
    lastPage: 1,
  });

  // Fetch all vehicles
  const fetchVehicles = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<any>(
        `${API_ENDPOINTS.VEHICLES.LIST}?page=${page}`
      );
      
      if (response?.success && response?.data) {
        setVehicles(response.data.data || []);
        setPagination({
          currentPage: response.data.current_page || 1,
          total: response.data.total || 0,
          perPage: response.data.per_page || 15,
          lastPage: response.data.last_page || 1,
        });
      } else {
        setVehicles([]);
        setPagination({
          currentPage: 1,
          total: 0,
          perPage: 15,
          lastPage: 1,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicles');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  // Lookup vehicle by plate number
  const lookupVehicleByPlate = async (plateNumber: string): Promise<VehicleLookupResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<VehicleLookupResponse>(
        API_ENDPOINTS.VEHICLES.LOOKUP_BY_PLATE(plateNumber)
      );
      
      if (response?.success) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Vehicle lookup completed',
          exists: !!response.data,
        };
      } else {
        return {
          success: false,
          data: null,
          message: response.message || 'Vehicle not found',
          exists: false,
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to lookup vehicle';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        message: errorMessage,
        exists: false,
      };
    } finally {
      setLoading(false);
    }
  };

  // Create new vehicle
  const createVehicle = async (data: CreateVehicleData): Promise<Vehicle> => {
    setLoading(true);
    setError(null);
    try {
      const newVehicle = await post<Vehicle>(
        API_ENDPOINTS.VEHICLES.CREATE,
        data
      );
      setVehicles(prev => [...prev, newVehicle]);
      return newVehicle;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create vehicle';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update vehicle
  const updateVehicle = async (data: UpdateVehicleData): Promise<Vehicle> => {
    setLoading(true);
    setError(null);
    try {
      const updatedVehicle = await put<Vehicle>(
        API_ENDPOINTS.VEHICLES.UPDATE(data.id),
        data
      );
      setVehicles(prev =>
        prev.map(item =>
          item.id === data.id ? updatedVehicle : item
        )
      );
      return updatedVehicle;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update vehicle';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete vehicle
  const deleteVehicle = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await del(API_ENDPOINTS.VEHICLES.DELETE(id));
      setVehicles(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete vehicle';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Search vehicles by plate number
  const searchVehiclesByPlate = async (plateNumber: string): Promise<Vehicle[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<any>(
        API_ENDPOINTS.VEHICLES.SEARCH_BY_PLATE(plateNumber)
      );
      
      if (response?.success && response?.data) {
        return response.data;
      } else {
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search vehicles';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get vehicles by body type
  const getVehiclesByBodyType = async (bodyTypeId: number): Promise<Vehicle[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<any>(
        API_ENDPOINTS.VEHICLES.BY_BODY_TYPE(bodyTypeId)
      );
      
      if (response?.success && response?.data) {
        return response.data;
      } else {
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vehicles by body type';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = async (page: number) => {
    await fetchVehicles(page);
  };

  // Load vehicles on mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  return {
    vehicles,
    loading,
    error,
    pagination,
    fetchVehicles,
    handlePageChange,
    lookupVehicleByPlate,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    searchVehiclesByPlate,
    getVehiclesByBodyType,
  };
};
