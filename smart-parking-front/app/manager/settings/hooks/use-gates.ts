import { useEffect, useState, useCallback } from 'react';
import { get, post, put, del } from '@/utils/api/api';
import { API_ENDPOINTS } from '@/utils/api/endpoints';
import type { Station } from './use-stations';

export interface Gate {
  id: number;
  station_id: number;
  name: string;
  gate_type: 'entry' | 'exit' | 'both';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  station?: Station; // when API includes related station object
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

export interface CreateGateData {
  station_id: number;
  name: string;
  gate_type?: 'entry' | 'exit' | 'both';
  is_active?: boolean;
}

export interface UpdateGateData extends Partial<CreateGateData> {
  id: number;
}

export const useGates = () => {
  const [gates, setGates] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    perPage: 15,
    lastPage: 1,
  });

  const fetchGates = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<PaginatedResponse<Gate>>(
        `${API_ENDPOINTS.GATES.LIST}?page=${page}`
      );
      if (response?.success && response?.data) {
        setGates(response.data.data || []);
        setPagination({
          currentPage: response.data.current_page || 1,
          total: response.data.total || 0,
          perPage: response.data.per_page || 15,
          lastPage: response.data.last_page || 1,
        });
      } else {
        setGates([]);
        setPagination({ currentPage: 1, total: 0, perPage: 15, lastPage: 1 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gates');
      setGates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGate = async (data: CreateGateData) => {
    setLoading(true);
    setError(null);
    try {
      const created = await post<Gate>(API_ENDPOINTS.GATES.CREATE, data);
      setGates((prev) => [...prev, created]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gate');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateGate = async (data: UpdateGateData) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await put<Gate>(API_ENDPOINTS.GATES.UPDATE(data.id), data);
      setGates((prev) => prev.map((g) => (g.id === data.id ? updated : g)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update gate');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteGate = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await del(API_ENDPOINTS.GATES.DELETE(id));
      setGates((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete gate');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveStatus = async (id: number, isActive: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await put<Gate>(API_ENDPOINTS.GATES.UPDATE(id), {
        is_active: isActive,
      });
      setGates((prev) => prev.map((g) => (g.id === id ? updated : g)));
      return updated;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update gate status'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchByStation = async (stationId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<Gate[]>(
        API_ENDPOINTS.GATES.BY_STATION(stationId)
      );
      setGates(response || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch station gates');
      setGates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActive = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<any>(API_ENDPOINTS.GATES.ACTIVE_LIST);
      if (response?.success && response?.data) {
        setGates(response.data || []);
      } else {
        setGates([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active gates');
      setGates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = useCallback(async (page: number) => {
    await fetchGates(page);
  }, [fetchGates]);

  useEffect(() => {
    fetchGates();
  }, [fetchGates]);

  return {
    gates,
    loading,
    error,
    pagination,
    fetchGates,
    fetchByStation,
    fetchActive,
    handlePageChange,
    createGate,
    updateGate,
    deleteGate,
    toggleActiveStatus,
  };
};
