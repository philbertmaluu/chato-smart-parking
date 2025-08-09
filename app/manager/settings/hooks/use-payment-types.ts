import { useState, useEffect } from 'react';
import { get, post, put, del } from '@/utils/api/api';
import { API_ENDPOINTS } from '@/utils/api/endpoints';

export interface PaymentType {
  id: number;
  name: string;
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
  messages: string;
  status: number;
}

export interface CreatePaymentTypeData {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdatePaymentTypeData extends Partial<CreatePaymentTypeData> {
  id: number;
}

export const usePaymentTypes = () => {
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    total: 0,
    perPage: 15,
    lastPage: 1,
  });

  // Fetch all payment types
  const fetchPaymentTypes = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<PaginatedResponse<PaymentType>>(
        `${API_ENDPOINTS.PAYMENT_TYPES?.LIST || 'payment-types'}?page=${page}`
      );
      
      if (response?.success && response?.data) {
        setPaymentTypes(response.data.data || []);
        setPagination({
          currentPage: response.data.current_page || 1,
          total: response.data.total || 0,
          perPage: response.data.per_page || 15,
          lastPage: response.data.last_page || 1,
        });
      } else {
        setPaymentTypes([]);
        setPagination({
          currentPage: 1,
          total: 0,
          perPage: 15,
          lastPage: 1,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment types');
      setPaymentTypes([]);
    } finally {
      setLoading(false);
    }
  };

  // Create new payment type
  const createPaymentType = async (data: CreatePaymentTypeData) => {
    setLoading(true);
    setError(null);
    try {
      const newPaymentType = await post<PaymentType>(
        API_ENDPOINTS.PAYMENT_TYPES?.CREATE || 'payment-types',
        data
      );
      setPaymentTypes(prev => [...prev, newPaymentType]);
      return newPaymentType;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment type');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update payment type
  const updatePaymentType = async (data: UpdatePaymentTypeData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedPaymentType = await put<PaymentType>(
        API_ENDPOINTS.PAYMENT_TYPES?.UPDATE?.(data.id) || `payment-types/${data.id}`,
        data
      );
      setPaymentTypes(prev =>
        prev.map(item =>
          item.id === data.id ? updatedPaymentType : item
        )
      );
      return updatedPaymentType;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment type');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete payment type
  const deletePaymentType = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await del(API_ENDPOINTS.PAYMENT_TYPES?.DELETE?.(id) || `payment-types/${id}`);
      setPaymentTypes(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment type');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Toggle active status
  const toggleActiveStatus = async (id: number, isActive: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const updatedPaymentType = await put<PaymentType>(
        API_ENDPOINTS.PAYMENT_TYPES?.UPDATE?.(id) || `payment-types/${id}`,
        { is_active: isActive }
      );
      setPaymentTypes(prev =>
        prev.map(item =>
          item.id === id ? updatedPaymentType : item
        )
      );
      return updatedPaymentType;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment type status');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = async (page: number) => {
    await fetchPaymentTypes(page);
  };

  // Load payment types on mount
  useEffect(() => {
    fetchPaymentTypes();
  }, []);

  return {
    paymentTypes,
    loading,
    error,
    pagination,
    fetchPaymentTypes,
    handlePageChange,
    createPaymentType,
    updatePaymentType,
    deletePaymentType,
    toggleActiveStatus,
  };
};
