import { useEffect, useState, useCallback } from 'react';
import { get, post, put, del } from '@/utils/api/api';
import { API_ENDPOINTS } from '@/utils/api/endpoints';

export interface BundleType {
  id: number;
  name: string;
  duration_days: number; // 1=daily, 7=weekly, 30=monthly, 365=yearly
  description?: string;
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

export interface CreateBundleTypeData {
  name: string;
  duration_days: number;
  description?: string;
  is_active?: boolean;
}

export interface UpdateBundleTypeData extends Partial<CreateBundleTypeData> {
  id: number;
}

export const useBundleTypes = () => {
  const [bundleTypes, setBundleTypes] = useState<BundleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    perPage: 15,
    lastPage: 1,
  });

  const fetchBundleTypes = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<PaginatedResponse<BundleType>>(
        `${API_ENDPOINTS.BUNDLE_TYPES.LIST}?page=${page}`
      );
      if (response?.success && response?.data) {
        setBundleTypes(response.data.data || []);
        setPagination({
          currentPage: response.data.current_page || 1,
          total: response.data.total || 0,
          perPage: response.data.per_page || 15,
          lastPage: response.data.last_page || 1,
        });
      } else {
        setBundleTypes([]);
        setPagination({ currentPage: 1, total: 0, perPage: 15, lastPage: 1 });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch bundle types'
      );
      setBundleTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBundleType = useCallback(async (data: CreateBundleTypeData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ success: boolean; data: BundleType }>(
        API_ENDPOINTS.BUNDLE_TYPES.CREATE,
        data
      );
      const created = response.data;
      setBundleTypes((prev) => [...prev, created]);
      return created;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create bundle type'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBundleType = useCallback(async (data: UpdateBundleTypeData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await put<{ success: boolean; data: BundleType }>(
        API_ENDPOINTS.BUNDLE_TYPES.UPDATE(data.id),
        data
      );
      const updated = response.data;
      setBundleTypes((prev) =>
        prev.map((item) => (item.id === data.id ? updated : item))
      );
      return updated;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update bundle type'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBundleType = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await del(API_ENDPOINTS.BUNDLE_TYPES.DELETE(id));
      setBundleTypes((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete bundle type'
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
      const response = await post<{ success: boolean; data: BundleType }>(
        API_ENDPOINTS.BUNDLE_TYPES.TOGGLE_STATUS(id),
        { is_active: isActive }
      );
      const updated = response.data;
      setBundleTypes((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
      return updated;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update bundle type status'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = useCallback(async (page: number) => {
    await fetchBundleTypes(page);
  }, [fetchBundleTypes]);

  useEffect(() => {
    fetchBundleTypes();
  }, []);

  return {
    bundleTypes,
    loading,
    error,
    pagination,
    fetchBundleTypes,
    handlePageChange,
    createBundleType,
    updateBundleType,
    deleteBundleType,
    toggleActiveStatus,
  };
};
