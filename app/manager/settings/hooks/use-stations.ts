import { useEffect, useState } from 'react';
import { get, post, put, del } from '@/utils/api/api';
import { API_ENDPOINTS } from '@/utils/api/endpoints';

export interface Station {
  id: number;
  name: string;
  location?: string | null;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
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

export interface CreateStationData {
  name: string;
  location?: string;
  code: string;
  is_active?: boolean;
}

export interface UpdateStationData extends Partial<CreateStationData> {
  id: number;
}

export const useStations = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    perPage: 15,
    lastPage: 1,
  });

  const fetchStations = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<PaginatedResponse<Station>>(
        `${API_ENDPOINTS.STATIONS.LIST}?page=${page}`
      );
      if (response?.success && response?.data) {
        setStations(response.data.data || []);
        setPagination({
          currentPage: response.data.current_page || 1,
          total: response.data.total || 0,
          perPage: response.data.per_page || 15,
          lastPage: response.data.last_page || 1,
        });
      } else {
        setStations([]);
        setPagination({ currentPage: 1, total: 0, perPage: 15, lastPage: 1 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stations');
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  const createStation = async (data: CreateStationData) => {
    setLoading(true);
    setError(null);
    try {
      const created = await post<Station>(API_ENDPOINTS.STATIONS.CREATE, data);
      setStations((prev) => [...prev, created]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create station');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateStation = async (data: UpdateStationData) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await put<Station>(
        API_ENDPOINTS.STATIONS.UPDATE(data.id),
        data
      );
      setStations((prev) => prev.map((s) => (s.id === data.id ? updated : s)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update station');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteStation = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await del(API_ENDPOINTS.STATIONS.DELETE(id));
      setStations((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete station');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveStatus = async (id: number, isActive: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await put<Station>(
        API_ENDPOINTS.STATIONS.UPDATE(id),
        { is_active: isActive }
      );
      setStations((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return updated;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update station status'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (page: number) => {
    await fetchStations(page);
  };

  useEffect(() => {
    fetchStations();
  }, []);

  return {
    stations,
    loading,
    error,
    pagination,
    fetchStations,
    handlePageChange,
    createStation,
    updateStation,
    deleteStation,
    toggleActiveStatus,
  };
};
