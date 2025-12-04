import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '@/utils/api/endpoints';
import { get, post, put, del } from '@/utils/api/api';

export interface Customer {
  id: number;
  user_id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  date_of_birth?: string;
  gender?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    email: string;
    name: string;
  };
  accounts?: Array<{
    id: number;
    account_number: string;
    name: string;
    account_type: string;
    balance: number;
    is_active: boolean;
  }>;
}

export interface CreateCustomerData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  date_of_birth?: string;
  gender?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  id: number;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  const fetchCustomers = useCallback(async (page: number = 1, search: string = '') => {
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
          data: Customer[];
          last_page: number;
          per_page: number;
          total: number;
        };
        message: string;
        status: number;
      }>(`${API_ENDPOINTS.CUSTOMERS.LIST}?${params.toString()}`);
      
      setCustomers(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page]);

  const createCustomer = useCallback(async (data: CreateCustomerData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ success: boolean; data: Customer }>(
        API_ENDPOINTS.CUSTOMERS.CREATE,
        data
      );
      const created = response.data;
      setCustomers((prev) => [...prev, created]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCustomer = useCallback(async (data: UpdateCustomerData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await put<{ success: boolean; data: Customer }>(
        API_ENDPOINTS.CUSTOMERS.UPDATE(data.id),
        data
      );
      const updated = response.data;
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === data.id ? updated : customer
        )
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update customer');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCustomer = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await del(API_ENDPOINTS.CUSTOMERS.DELETE(id));
      setCustomers((prev) => prev.filter((customer) => customer.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getActiveCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: Customer[] }>(
        API_ENDPOINTS.CUSTOMERS.ACTIVE_LIST
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active customers');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCustomerStatistics = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; data: any }>(
        API_ENDPOINTS.CUSTOMERS.STATISTICS(id)
      );
      return response.data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer statistics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    fetchCustomers(page);
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    pagination,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getActiveCustomers,
    getCustomerStatistics,
    handlePageChange,
  };
};
