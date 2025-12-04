import { useEffect, useState, useCallback } from 'react';
import { get, post } from '@/utils/api/api';
import { API_ENDPOINTS } from '@/utils/api/endpoints';
import type { Station } from '@/app/manager/settings/hooks/use-stations';
import type { Gate } from '@/app/manager/settings/hooks/use-gates';

export interface Operator {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  profile_photo: string | null;
  address: string | null;
  gender: string | null;
  date_of_birth: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role?: {
    id: number;
    name: string;
    description: string;
  };
  assigned_stations?: Station[];
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
  messages?: string;
  status?: number;
}

export interface AssignStationData {
  station_id: number;
}

export interface CreateOperatorData {
  username: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  address: string;
  gender: 'male' | 'female' | 'other';
  date_of_birth: string;
  role_id: number;
}

export const useOperators = () => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total: 0,
    per_page: 15,
    last_page: 1,
  });

  const fetchOperators = useCallback(async (page: number = 1, search: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '15',
      });
      if (search) {
        params.append('search', search);
      }

      const response = await get<PaginatedResponse<Operator>>(
        `${API_ENDPOINTS.OPERATORS.LIST}?${params.toString()}`
      );
      
      if (response.success && response.data) {
        setOperators(response.data.data);
        setPagination({
          current_page: response.data.current_page,
          total: response.data.total,
          per_page: response.data.per_page,
          last_page: response.data.last_page,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch operators');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllOperators = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: Operator[] }>(
        API_ENDPOINTS.OPERATORS.ALL
      );
      
      if (response.success && response.data) {
        setOperators(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch operators');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOperatorDetails = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: Operator }>(
        API_ENDPOINTS.OPERATORS.DETAILS(id)
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch operator details');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOperatorStations = useCallback(async (operatorId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: Station[] }>(
        API_ENDPOINTS.OPERATORS.STATIONS(operatorId)
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch operator stations');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAvailableGates = useCallback(async (operatorId: number, stationId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: Gate[] }>(
        `${API_ENDPOINTS.OPERATORS.AVAILABLE_GATES(operatorId)}?station_id=${stationId}`
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch available gates');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignStation = useCallback(async (operatorId: number, data: AssignStationData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ success: boolean; data: Operator }>(
        API_ENDPOINTS.OPERATORS.ASSIGN_STATION(operatorId),
        data
      );
      
      // Refresh operators list
      await fetchOperators(pagination.current_page);
      
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign station');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchOperators, pagination.current_page]);

  const unassignStation = useCallback(async (operatorId: number, stationId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ success: boolean; data: Operator }>(
        API_ENDPOINTS.OPERATORS.UNASSIGN_STATION(operatorId),
        { station_id: stationId }
      );
      
      // Refresh operators list
      await fetchOperators(pagination.current_page);
      
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign station');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchOperators, pagination.current_page]);

  const createOperator = useCallback(async (data: CreateOperatorData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ success: boolean; data: Operator }>(
        API_ENDPOINTS.OPERATORS.CREATE,
        data
      );
      
      // Refresh operators list
      await fetchOperators(pagination.current_page);
      
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create operator');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchOperators, pagination.current_page]);

  const activateOperator = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ success: boolean; data: Operator }>(
        API_ENDPOINTS.OPERATORS.ACTIVATE(id),
        {}
      );
      // Refetch operators list to get updated data
      await fetchOperators(pagination.current_page);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate operator');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchOperators, pagination.current_page]);

  const deactivateOperator = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ success: boolean; data: Operator }>(
        API_ENDPOINTS.OPERATORS.DEACTIVATE(id),
        {}
      );
      // Refetch operators list to get updated data
      await fetchOperators(pagination.current_page);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate operator');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchOperators, pagination.current_page]);

  const handlePageChange = useCallback((page: number) => {
    fetchOperators(page);
  }, [fetchOperators]);

  useEffect(() => {
    fetchOperators(1);
  }, [fetchOperators]);

  return {
    operators,
    loading,
    error,
    pagination,
    fetchOperators,
    fetchAllOperators,
    fetchOperatorDetails,
    getOperatorStations,
    getAvailableGates,
    assignStation,
    unassignStation,
    createOperator,
    activateOperator,
    deactivateOperator,
    handlePageChange,
  };
};

