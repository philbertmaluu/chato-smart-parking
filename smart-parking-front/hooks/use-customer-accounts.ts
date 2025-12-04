import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '@/utils/api/endpoints';
import { get, post, put, del } from '@/utils/api/api';

export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  address?: string;
  gender?: string;
  date_of_birth?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role?: {
    id: number;
    name: string;
    level: number;
  };
}

export interface Customer {
  id: number;
  user_id: number;
  customer_number: string;
  name: string;
  company_name?: string;
  customer_type: string;
  created_at: string;
  updated_at: string;
  user?: User;
  accounts?: Account[];
}

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
  customer?: Customer;
  account_vehicles?: AccountVehicle[];
  bundle_subscriptions?: BundleSubscription[];
}

export interface Vehicle {
  id: number;
  body_type_id: number;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  color: string;
  owner_name: string;
  is_registered: boolean;
  is_exempted: boolean;
  exemption_reason?: string;
  exemption_expires_at?: string;
  created_at: string;
  updated_at: string;
  body_type?: {
    id: number;
    name: string;
    category: string;
  };
}

export interface AccountVehicle {
  id: number;
  account_id: number;
  vehicle_id: number;
  is_primary: boolean;
  registered_at: string;
  created_at: string;
  updated_at: string;
  account?: Account;
  vehicle?: Vehicle;
}

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
}

export interface CreateCustomerAccountData {
  // User data
  username: string;
  email: string;
  phone: string;
  address?: string;
  gender?: string;
  date_of_birth?: string;
  
  // Customer data
  customer_number?: string;
  name: string;
  company_name?: string;
  customer_type: 'individual' | 'corporate';
  
  // Account data
  account_number?: string;
  account_name: string;
  account_type: 'prepaid' | 'postpaid';
  initial_balance: number;
  credit_limit?: number;
}

export interface UpdateCustomerAccountData {
  id: number;
  // User data
  username?: string;
  email?: string;
  phone?: string;
  address?: string;
  gender?: string;
  date_of_birth?: string;
  is_active?: boolean;
  
  // Customer data
  name?: string;
  company_name?: string;
  customer_type?: 'individual' | 'corporate';
  
  // Account data
  account_name?: string;
  account_type?: 'prepaid' | 'postpaid';
  balance?: number;
  credit_limit?: number;
  account_is_active?: boolean;
}

export const useCustomerAccounts = () => {
  const [customerAccounts, setCustomerAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  const fetchCustomerAccounts = useCallback(async (page: number = 1, search: string = '') => {
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
      }>(`${API_ENDPOINTS.CUSTOMER_ACCOUNTS.LIST}?${params.toString()}`);
      
      setCustomerAccounts(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer accounts');
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page]);

  const createCustomerAccount = useCallback(async (data: CreateCustomerAccountData) => {
    setLoading(true);
    setError(null);
    try {
      // Create complete customer account (User + Customer + Account)
      const response = await post<{ success: boolean; data: Account }>(
        API_ENDPOINTS.CUSTOMER_ACCOUNTS.CREATE,
        data
      );
      const created = response.data;
      setCustomerAccounts((prev) => [...prev, created]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCustomerAccount = useCallback(async (data: UpdateCustomerAccountData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await put<{ success: boolean; data: Account }>(
        API_ENDPOINTS.CUSTOMER_ACCOUNTS.UPDATE(data.id),
        data
      );
      const updated = response.data;
      setCustomerAccounts((prev) =>
        prev.map((account) =>
          account.id === data.id ? updated : account
        )
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update customer account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCustomerAccount = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await del(API_ENDPOINTS.CUSTOMER_ACCOUNTS.DELETE(id));
      setCustomerAccounts((prev) => prev.filter((account) => account.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleAccountStatus = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ success: boolean; data: Account }>(
        API_ENDPOINTS.ACCOUNTS.TOGGLE_STATUS(id),
        {}
      );
      const updated = response.data;
      setCustomerAccounts((prev) =>
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

  const addVehicleToAccount = useCallback(async (accountId: number, vehicleId: number, isPrimary: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ success: boolean; data: AccountVehicle }>(
        API_ENDPOINTS.CUSTOMER_ACCOUNTS.ADD_VEHICLE(accountId),
        { vehicle_id: vehicleId, is_primary: isPrimary }
      );
      // Refresh the account data to include the new vehicle
      await fetchCustomerAccounts();
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add vehicle to account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCustomerAccounts]);

  const removeVehicleFromAccount = useCallback(async (accountId: number, vehicleId: number) => {
    setLoading(true);
    setError(null);
    try {
      await del(API_ENDPOINTS.CUSTOMER_ACCOUNTS.REMOVE_VEHICLE(accountId, vehicleId));
      // Refresh the account data
      await fetchCustomerAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove vehicle from account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCustomerAccounts]);

  const getAccountVehicles = useCallback(async (accountId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: Vehicle[] }>(
        API_ENDPOINTS.CUSTOMER_ACCOUNTS.GET_VEHICLES(accountId)
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch account vehicles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    fetchCustomerAccounts(page);
  }, [fetchCustomerAccounts]);

  return {
    customerAccounts,
    loading,
    error,
    pagination,
    fetchCustomerAccounts,
    createCustomerAccount,
    updateCustomerAccount,
    deleteCustomerAccount,
    toggleAccountStatus,
    addVehicleToAccount,
    removeVehicleFromAccount,
    getAccountVehicles,
    handlePageChange,
  };
};
