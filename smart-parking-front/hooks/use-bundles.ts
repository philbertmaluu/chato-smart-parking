import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '@/utils/api/endpoints';
import { get, post, put, del } from '@/utils/api/api';

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

export interface CreateBundleData {
  bundle_type_id: number;
  name: string;
  amount: number;
  max_vehicles: number;
  max_passages?: number;
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
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  const fetchBundles = useCallback(async (page: number = 1, search: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: pagination.per_page.toString(),
      });
      
      if (search) {
        params.append('search', search);
      }

      const response = await get<{
        success: boolean;
        data: {
          current_page: number;
          data: Bundle[];
          last_page: number;
          per_page: number;
          total: number;
        };
        message: string;
        status: number;
      }>(`${API_ENDPOINTS.BUNDLES.LIST}?${params.toString()}`);
      
      setBundles(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bundles');
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page]);

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
      setError(err instanceof Error ? err.message : 'Failed to create bundle');
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
        prev.map((bundle) =>
          bundle.id === data.id ? updated : bundle
        )
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bundle');
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
      setBundles((prev) => prev.filter((bundle) => bundle.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bundle');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleActiveStatus = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ success: boolean; data: Bundle }>(
        API_ENDPOINTS.BUNDLES.TOGGLE_STATUS(id),
        {}
      );
      const updated = response.data;
      setBundles((prev) =>
        prev.map((bundle) =>
          bundle.id === id ? updated : bundle
        )
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle bundle status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getActiveBundles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: Bundle[] }>(
        API_ENDPOINTS.BUNDLES.ACTIVE_LIST
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active bundles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    fetchBundles(page);
  }, [fetchBundles]);

  return {
    bundles,
    loading,
    error,
    pagination,
    fetchBundles,
    createBundle,
    updateBundle,
    deleteBundle,
    toggleActiveStatus,
    getActiveBundles,
    handlePageChange,
  };
};
