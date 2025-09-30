import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { get, post, put, del } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/api/endpoints';

export interface VehicleBodyTypePrice {
  id: number;
  body_type_id: number;
  station_id: number;
  base_price: number;
  effective_from: string;
  effective_to?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  body_type?: {
    id: number;
    name: string;
    category: string;
  };
  station?: {
    id: number;
    name: string;
    code?: string;
  };
}

export interface CreateVehicleBodyTypePriceData {
  body_type_id: number;
  station_id: number;
  base_price: number;
  effective_from: string;
  effective_to?: string;
  is_active?: boolean;
}

export interface UpdateVehicleBodyTypePriceData extends CreateVehicleBodyTypePriceData {
  id: number;
}

export interface PaginationData {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  from: number;
  to: number;
}

export interface UseVehicleBodyTypePricesReturn {
  // State
  vehicleBodyTypePrices: VehicleBodyTypePrice[];
  loading: boolean;
  error: string | null;
  pagination: PaginationData;

  // Actions
  fetchVehicleBodyTypePrices: (page?: number, search?: string) => Promise<void>;
  createVehicleBodyTypePrice: (data: CreateVehicleBodyTypePriceData) => Promise<void>;
  updateVehicleBodyTypePrice: (data: UpdateVehicleBodyTypePriceData) => Promise<void>;
  deleteVehicleBodyTypePrice: (id: number) => Promise<void>;
  toggleActiveStatus: (id: number, isActive: boolean) => Promise<void>;
  getCurrentPrice: (bodyTypeId: number, stationId: number) => Promise<VehicleBodyTypePrice | null>;
  getPricesByStation: (stationId: number) => Promise<VehicleBodyTypePrice[]>;
  bulkUpdatePrices: (prices: UpdateVehicleBodyTypePriceData[]) => Promise<void>;
  getPricingSummary: () => Promise<any>;
}

export function useVehicleBodyTypePrices(): UseVehicleBodyTypePricesReturn {
  const [vehicleBodyTypePrices, setVehicleBodyTypePrices] = useState<VehicleBodyTypePrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
    from: 0,
    to: 0,
  });

  const fetchVehicleBodyTypePrices = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10', // Use fixed value instead of pagination.perPage
      });

      if (search) {
        params.append('search', search);
      }

      const response = await get<any>(`${API_ENDPOINTS.VEHICLE_BODY_TYPE_PRICES.LIST}?${params}`);
      
      if (response.success) {
        setVehicleBodyTypePrices(response.data.data || []);
        setPagination({
          currentPage: response.data.current_page || 1,
          lastPage: response.data.last_page || 1,
          perPage: response.data.per_page || 10,
          total: response.data.total || 0,
          from: response.data.from || 0,
          to: response.data.to || 0,
        });
      } else {
        setError(response.message || 'Failed to fetch vehicle body type prices');
        toast.error(response.message || 'Failed to fetch vehicle body type prices');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch vehicle body type prices';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []); // Remove dependency to prevent infinite re-renders

  const createVehicleBodyTypePrice = useCallback(async (data: CreateVehicleBodyTypePriceData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await post<any>(API_ENDPOINTS.VEHICLE_BODY_TYPE_PRICES.CREATE, data);
      
      if (response.success) {
        toast.success('Vehicle body type price created successfully');
        await fetchVehicleBodyTypePrices(1); // Use page 1 instead of pagination.currentPage
      } else {
        setError(response.message || 'Failed to create vehicle body type price');
        toast.error(response.message || 'Failed to create vehicle body type price');
        throw new Error(response.message || 'Failed to create vehicle body type price');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create vehicle body type price';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchVehicleBodyTypePrices]);

  const updateVehicleBodyTypePrice = useCallback(async (data: UpdateVehicleBodyTypePriceData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await put<any>(API_ENDPOINTS.VEHICLE_BODY_TYPE_PRICES.UPDATE(data.id), data);
      
      if (response.success) {
        toast.success('Vehicle body type price updated successfully');
        await fetchVehicleBodyTypePrices(1); // Use page 1 instead of pagination.currentPage
      } else {
        setError(response.message || 'Failed to update vehicle body type price');
        toast.error(response.message || 'Failed to update vehicle body type price');
        throw new Error(response.message || 'Failed to update vehicle body type price');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update vehicle body type price';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchVehicleBodyTypePrices]);

  const deleteVehicleBodyTypePrice = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await del<any>(API_ENDPOINTS.VEHICLE_BODY_TYPE_PRICES.DELETE(id));
      
      if (response.success) {
        toast.success('Vehicle body type price deleted successfully');
        await fetchVehicleBodyTypePrices(1); // Use page 1 instead of pagination.currentPage
      } else {
        setError(response.message || 'Failed to delete vehicle body type price');
        toast.error(response.message || 'Failed to delete vehicle body type price');
        throw new Error(response.message || 'Failed to delete vehicle body type price');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete vehicle body type price';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchVehicleBodyTypePrices]);

  const toggleActiveStatus = useCallback(async (id: number, isActive: boolean) => {
    try {
      const response = await put<any>(API_ENDPOINTS.VEHICLE_BODY_TYPE_PRICES.UPDATE(id), {
        is_active: isActive,
      });
      
      if (response.success) {
        toast.success('Status updated successfully');
        await fetchVehicleBodyTypePrices(1); // Use page 1 instead of pagination.currentPage
      } else {
        toast.error(response.message || 'Failed to update status');
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
      throw err;
    }
  }, [fetchVehicleBodyTypePrices]);

  const getCurrentPrice = useCallback(async (bodyTypeId: number, stationId: number) => {
    try {
      const response = await post<any>(API_ENDPOINTS.VEHICLE_BODY_TYPE_PRICES.CURRENT_PRICE, {
        body_type_id: bodyTypeId,
        station_id: stationId,
      });
      
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (err: any) {
      console.error('Failed to get current price:', err);
      return null;
    }
  }, []);

  const getPricesByStation = useCallback(async (stationId: number) => {
    try {
      const response = await get<any>(API_ENDPOINTS.VEHICLE_BODY_TYPE_PRICES.BY_STATION(stationId));
      
      if (response.success) {
        return response.data || [];
      }
      return [];
    } catch (err: any) {
      console.error('Failed to get prices by station:', err);
      return [];
    }
  }, []);

  const bulkUpdatePrices = useCallback(async (prices: UpdateVehicleBodyTypePriceData[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await post<any>(API_ENDPOINTS.VEHICLE_BODY_TYPE_PRICES.BULK_UPDATE, {
        prices: prices,
      });
      
      if (response.success) {
        toast.success('Prices updated successfully');
        await fetchVehicleBodyTypePrices(1); // Use page 1 instead of pagination.currentPage
      } else {
        setError(response.message || 'Failed to update prices');
        toast.error(response.message || 'Failed to update prices');
        throw new Error(response.message || 'Failed to update prices');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update prices';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchVehicleBodyTypePrices]);

  const getPricingSummary = useCallback(async () => {
    try {
      const response = await get<any>(API_ENDPOINTS.VEHICLE_BODY_TYPE_PRICES.SUMMARY);
      
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (err: any) {
      console.error('Failed to get pricing summary:', err);
      return null;
    }
  }, []);

  return {
    // State
    vehicleBodyTypePrices,
    loading,
    error,
    pagination,

    // Actions
    fetchVehicleBodyTypePrices,
    createVehicleBodyTypePrice,
    updateVehicleBodyTypePrice,
    deleteVehicleBodyTypePrice,
    toggleActiveStatus,
    getCurrentPrice,
    getPricesByStation,
    bulkUpdatePrices,
    getPricingSummary,
  };
}
