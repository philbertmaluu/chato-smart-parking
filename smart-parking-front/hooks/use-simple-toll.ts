import { useState, useCallback } from 'react';
import { post } from '@/utils/api/api';
import { toast } from 'sonner';

interface TollEntryData {
  plate_number: string;
  gate_id: number;
  operator_id: number;
  body_type_id?: number;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  owner_name?: string;
  notes?: string;
}

interface TollResponse {
  success: boolean;
  message: string;
  data?: {
    vehicle: any;
    passage: any;
    pricing: any;
    gate_action: string;
    receipt?: any;
  };
}

export function useToll() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processEntry = useCallback(async (entryData: TollEntryData): Promise<TollResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await post<TollResponse>('/toll/entry', entryData);
      
      if (response.success) {
        toast.success(response.message || 'Vehicle entry processed successfully');
      } else {
        toast.error(response.message || 'Failed to process vehicle entry');
      }
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process vehicle entry';
      setError(errorMessage);
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const processExit = useCallback(async (plateNumber: string, gateId: number, operatorId: number): Promise<TollResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await post<TollResponse>('/toll/exit', {
        plate_number: plateNumber,
        gate_id: gateId,
        operator_id: operatorId
      });
      
      if (response.success) {
        toast.success(response.message || 'Vehicle exit processed successfully');
      } else {
        toast.error(response.message || 'Failed to process vehicle exit');
      }
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process vehicle exit';
      setError(errorMessage);
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateToll = useCallback(async (plateNumber: string, gateId: number): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const response = await post('/toll/calculate-toll', {
        plate_number: plateNumber,
        gate_id: gateId
      });
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to calculate toll';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    processEntry,
    processExit,
    calculateToll
  };
}
