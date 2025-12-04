import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '@/utils/api/endpoints';
import { get, post, put, del } from '@/utils/api/api';

export interface BundleSubscription {
  id: number;
  account_id: number;
  bundle_id: number;
  subscription_number: string;
  start_datetime: string;
  end_datetime: string;
  amount: number;
  passages_used: number;
  max_passages?: number;
  status: 'active' | 'expired' | 'cancelled' | 'suspended';
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  account?: {
    id: number;
    account_number: string;
    name: string;
    customer?: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  bundle?: {
    id: number;
    name: string;
    amount: number;
    max_vehicles: number;
    max_passages?: number;
    bundle_type?: {
      id: number;
      name: string;
      duration_days: number;
    };
  };
}

export interface CreateBundleSubscriptionData {
  account_id: number;
  bundle_id: number;
  start_datetime: string;
  end_datetime: string;
  amount: number;
  passages_used?: number;
  max_passages?: number;
  status?: 'active' | 'expired' | 'cancelled' | 'suspended';
  auto_renew?: boolean;
}

export interface UpdateBundleSubscriptionData extends Partial<CreateBundleSubscriptionData> {
  id: number;
}

export const useBundleSubscriptions = () => {
  const [bundleSubscriptions, setBundleSubscriptions] = useState<BundleSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  const fetchBundleSubscriptions = useCallback(async (page: number = 1, search: string = '') => {
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
          data: BundleSubscription[];
          last_page: number;
          per_page: number;
          total: number;
        };
        message: string;
        status: number;
      }>(`${API_ENDPOINTS.BUNDLE_SUBSCRIPTIONS.LIST}?${params.toString()}`);
      
      setBundleSubscriptions(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bundle subscriptions');
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page]);

  const createBundleSubscription = useCallback(async (data: CreateBundleSubscriptionData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ success: boolean; data: BundleSubscription }>(
        API_ENDPOINTS.BUNDLE_SUBSCRIPTIONS.CREATE,
        data
      );
      const created = response.data;
      setBundleSubscriptions((prev) => [...prev, created]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bundle subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBundleSubscription = useCallback(async (data: UpdateBundleSubscriptionData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await put<{ success: boolean; data: BundleSubscription }>(
        API_ENDPOINTS.BUNDLE_SUBSCRIPTIONS.UPDATE(data.id),
        data
      );
      const updated = response.data;
      setBundleSubscriptions((prev) =>
        prev.map((subscription) =>
          subscription.id === data.id ? updated : subscription
        )
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bundle subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBundleSubscription = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await del(API_ENDPOINTS.BUNDLE_SUBSCRIPTIONS.DELETE(id));
      setBundleSubscriptions((prev) => prev.filter((subscription) => subscription.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bundle subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBundleSubscriptionStatus = useCallback(async (id: number, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await put<{ success: boolean; data: BundleSubscription }>(
        API_ENDPOINTS.BUNDLE_SUBSCRIPTIONS.UPDATE_STATUS(id),
        { status }
      );
      const updated = response.data;
      setBundleSubscriptions((prev) =>
        prev.map((subscription) =>
          subscription.id === id ? updated : subscription
        )
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bundle subscription status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getActiveBundleSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: BundleSubscription[] }>(
        API_ENDPOINTS.BUNDLE_SUBSCRIPTIONS.ACTIVE_LIST
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active bundle subscriptions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBundleSubscriptionsByAccount = useCallback(async (accountId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: BundleSubscription[] }>(
        API_ENDPOINTS.BUNDLE_SUBSCRIPTIONS.BY_ACCOUNT(accountId)
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch account bundle subscriptions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBundleSubscriptionsByBundle = useCallback(async (bundleId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: BundleSubscription[] }>(
        API_ENDPOINTS.BUNDLE_SUBSCRIPTIONS.BY_BUNDLE(bundleId)
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bundle subscriptions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBundleSubscriptionsWithUsageStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: BundleSubscription[] }>(
        API_ENDPOINTS.BUNDLE_SUBSCRIPTIONS.USAGE_STATS
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bundle subscriptions with usage stats');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getExpiringBundleSubscriptions = useCallback(async (days: number = 7) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: BundleSubscription[] }>(
        API_ENDPOINTS.BUNDLE_SUBSCRIPTIONS.EXPIRING(days)
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch expiring bundle subscriptions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    fetchBundleSubscriptions(page);
  }, [fetchBundleSubscriptions]);

  return {
    bundleSubscriptions,
    loading,
    error,
    pagination,
    fetchBundleSubscriptions,
    createBundleSubscription,
    updateBundleSubscription,
    deleteBundleSubscription,
    updateBundleSubscriptionStatus,
    getActiveBundleSubscriptions,
    getBundleSubscriptionsByAccount,
    getBundleSubscriptionsByBundle,
    getBundleSubscriptionsWithUsageStats,
    getExpiringBundleSubscriptions,
    handlePageChange,
  };
};
