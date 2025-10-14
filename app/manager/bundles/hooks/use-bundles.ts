import { useEffect, useState, useCallback } from 'react';
import { get, post, put, del } from '@/utils/api/api';
import { API_ENDPOINTS } from '@/utils/api/endpoints';

export interface BundleType {
  id: number;
  name: string;
  duration_days: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bundle {
  id: number;
  bundle_type_id: number;
  name: string;
  amount: number;
  max_vehicles: number;
  max_passages?: number | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  bundle_type?: BundleType;
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

export interface CreateBundleData {
  bundle_type_id: number;
  name: string;
  amount: number;
  max_vehicles: number;
  max_passages?: number | null;
  description?: string;
  is_active?: boolean;
}

export interface UpdateBundleData extends Partial<CreateBundleData> {
  id: number;
}

export const useBundles = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    perPage: 15,
    lastPage: 1,
  });

  const fetchBundles = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<PaginatedResponse<Bundle>>(
        `${API_ENDPOINTS.BUNDLES.LIST}?page=${page}`
      );
      if (response?.success && response?.data) {
        setBundles(response.data.data || []);
        setPagination({
          currentPage: response.data.current_page || 1,
          total: response.data.total || 0,
          perPage: response.data.per_page || 15,
          lastPage: response.data.last_page || 1,
        });
      } else {
        setBundles([]);
        setPagination({ currentPage: 1, total: 0, perPage: 15, lastPage: 1 });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch bundles'
      );
      setBundles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBundle = useCallback(async (data: CreateBundleData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ success: boolean; data: Bundle }>(
        API_ENDPOINTS.BUNDLES.CREATE,
        data
      );
      const created = response.data;
      setBundles((prev) => [...prev, created]);
      return created;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create bundle'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBundle = useCallback(async (data: UpdateBundleData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await put<{ success: boolean; data: Bundle }>(
        API_ENDPOINTS.BUNDLES.UPDATE(data.id),
        data
      );
      const updated = response.data;
      setBundles((prev) =>
        prev.map((item) => (item.id === data.id ? updated : item))
      );
      return updated;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update bundle'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBundle = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await del(API_ENDPOINTS.BUNDLES.DELETE(id));
      setBundles((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete bundle'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleActiveStatus = useCallback(async (id: number, isActive: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ success: boolean; data: Bundle }>(
        API_ENDPOINTS.BUNDLES.TOGGLE_STATUS(id),
        { is_active: isActive }
      );
      const updated = response.data;
      setBundles((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
      return updated;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update bundle status'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = useCallback(async (page: number) => {
    await fetchBundles(page);
  }, [fetchBundles]);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  return {
    bundles,
    loading,
    error,
    pagination,
    fetchBundles,
    handlePageChange,
    createBundle,
    updateBundle,
    deleteBundle,
    toggleActiveStatus,
  };
};
