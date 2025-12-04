import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '@/utils/api/endpoints';
import { get, post, put, del } from '@/utils/api/api';

export interface Account {
  id: number;
  customer_id: number;
  account_number: string;
  name: string;
  account_type: 'prepaid' | 'postpaid';
  balance: number;
  credit_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  customer?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  account_vehicles?: Array<{
    id: number;
    vehicle_id: number;
    is_primary: boolean;
    registered_at: string;
    vehicle?: {
      id: number;
      plate_number: string;
      vehicle_type: string;
    };
  }>;
  bundle_subscriptions?: Array<{
    id: number;
    status: string;
    passages_used: number;
    max_passages: number;
  }>;
}

export interface CreateAccountData {
  customer_id: number;
  account_number?: string;
  name: string;
  account_type: 'prepaid' | 'postpaid';
  balance: number;
  credit_limit?: number;
  is_active?: boolean;
}

export interface UpdateAccountData extends Partial<CreateAccountData> {
  id: number;
}

export interface AccountStatistics {
  total_balance: number;
  available_credit: number;
  total_vehicles: number;
  active_bundle_subscriptions: number;
  total_passages: number;
  recent_transactions: Array<any>;
  recent_invoices: Array<any>;
}

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  const fetchAccounts = useCallback(async (page: number = 1, search: string = '') => {
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
          data: Account[];
          last_page: number;
          per_page: number;
          total: number;
        };
        message: string;
        status: number;
      }>(`${API_ENDPOINTS.ACCOUNTS.LIST}?${params.toString()}`);
      
      setAccounts(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page]);

  const createAccount = useCallback(async (data: CreateAccountData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ success: boolean; data: Account }>(
        API_ENDPOINTS.ACCOUNTS.CREATE,
        data
      );
      const created = response.data;
      setAccounts((prev) => [...prev, created]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAccount = useCallback(async (data: UpdateAccountData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await put<{ success: boolean; data: Account }>(
        API_ENDPOINTS.ACCOUNTS.UPDATE(data.id),
        data
      );
      const updated = response.data;
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === data.id ? updated : account
        )
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await del(API_ENDPOINTS.ACCOUNTS.DELETE(id));
      setAccounts((prev) => prev.filter((account) => account.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleActiveStatus = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ success: boolean; data: Account }>(
        API_ENDPOINTS.ACCOUNTS.TOGGLE_STATUS(id),
        {}
      );
      const updated = response.data;
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === id ? updated : account
        )
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle account status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getActiveAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: Account[] }>(
        API_ENDPOINTS.ACCOUNTS.ACTIVE_LIST
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active accounts');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAccountsByCustomer = useCallback(async (customerId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: Account[] }>(
        API_ENDPOINTS.ACCOUNTS.BY_CUSTOMER(customerId)
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer accounts');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAccountStatistics = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: AccountStatistics }>(
        API_ENDPOINTS.ACCOUNTS.STATISTICS(id)
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch account statistics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    fetchAccounts(page);
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    pagination,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    toggleActiveStatus,
    getActiveAccounts,
    getAccountsByCustomer,
    getAccountStatistics,
    handlePageChange,
  };
};
