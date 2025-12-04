import { useState, useCallback } from 'react';
import { PricingService } from '@/utils/api';
import type { PricingData, GateControlResponse } from '@/utils/api/types';
import { toast } from 'sonner';

interface UsePricingReturn {
  // State
  pricing: PricingData | null;
  gateAction: 'allow' | 'require_payment' | 'deny' | null;
  vehicle: any | null;
  receipt: any | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  processPlateDetection: (
    plateNumber: string,
    gateId: number,
    operatorId: number,
    direction?: 'entry' | 'exit',
    additionalData?: {
      account_id?: number;
      notes?: string;
    }
  ) => Promise<boolean>;
  
  calculatePricing: (
    vehicleId: number,
    stationId: number,
    accountId?: number
  ) => Promise<PricingData | null>;
  
  calculatePricingByPlate: (
    plateNumber: string,
    stationId: number,
    accountId?: number
  ) => Promise<PricingData | null>;
  
  resetPricing: () => void;
}

export function usePricing(): UsePricingReturn {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [gateAction, setGateAction] = useState<'allow' | 'require_payment' | 'deny' | null>(null);
  const [vehicle, setVehicle] = useState<any | null>(null);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPlateDetection = useCallback(async (
    plateNumber: string,
    gateId: number,
    operatorId: number,
    direction: 'entry' | 'exit' = 'entry',
    additionalData?: {
      account_id?: number;
      notes?: string;
    }
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await PricingService.processPlateDetection(
        plateNumber,
        gateId,
        operatorId,
        direction,
        additionalData
      );

      if (response.success && response.data) {
        const { vehicle: vehicleData, pricing: pricingData, gate_action, receipt: receiptData } = response.data;
        
        setVehicle(vehicleData);
        setPricing(pricingData);
        setGateAction(gate_action);
        setReceipt(receiptData);

        // Show appropriate toast based on payment type
        switch (pricingData.payment_type) {
          case 'Cash':
            if (pricingData.requires_payment) {
              toast.success(`Toll fee required: Tsh. ${pricingData.total_amount}`);
            } else {
              toast.success('No pricing configured for this vehicle type');
            }
            break;
          case 'Bundle':
            toast.success('Bundle subscription active - Free passage');
            break;
          case 'Exemption':
            toast.success(`Exempted: ${pricingData.description}`);
            break;
        }

        return true;
      } else {
        setError(response.message || 'Failed to process plate detection');
        toast.error(response.message || 'Failed to process plate detection');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process plate detection';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculatePricing = useCallback(async (
    vehicleId: number,
    stationId: number,
    accountId?: number
  ): Promise<PricingData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await PricingService.calculatePricing(
        vehicleId,
        stationId,
        accountId
      );

      if (response.success && response.data) {
        setPricing(response.data);
        return response.data;
      } else {
        setError(response.message || 'Failed to calculate pricing');
        toast.error(response.message || 'Failed to calculate pricing');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to calculate pricing';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculatePricingByPlate = useCallback(async (
    plateNumber: string,
    stationId: number,
    accountId?: number
  ): Promise<PricingData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await PricingService.calculatePricingByPlate(
        plateNumber,
        stationId,
        accountId
      );

      if (response.success && response.data) {
        setPricing(response.data);
        return response.data;
      } else {
        setError(response.message || 'Failed to calculate pricing');
        toast.error(response.message || 'Failed to calculate pricing');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to calculate pricing';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPricing = useCallback(() => {
    setPricing(null);
    setGateAction(null);
    setVehicle(null);
    setReceipt(null);
    setError(null);
  }, []);

  return {
    // State
    pricing,
    gateAction,
    vehicle,
    receipt,
    isLoading,
    error,

    // Actions
    processPlateDetection,
    calculatePricing,
    calculatePricingByPlate,
    resetPricing,
  };
}
