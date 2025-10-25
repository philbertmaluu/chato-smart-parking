import { post, get } from './api';
import { API_ENDPOINTS } from './endpoints';
import type { 
  ApiResponse, 
  PricingData, 
  GateControlResponse, 
  PlateDetectionRequest,
  PricingCalculationRequest 
} from './types';

export class PricingService {
  /**
   * Process vehicle entry through plate detection
   * This is the main entry point for vehicle processing
   */
  static async processPlateDetection(
    plateNumber: string,
    gateId: number,
    operatorId: number,
    direction: 'entry' | 'exit' = 'entry',
    additionalData?: {
      account_id?: number;
      notes?: string;
    }
  ): Promise<ApiResponse<GateControlResponse>> {
    const requestData: PlateDetectionRequest = {
      plate_number: plateNumber,
      gate_id: gateId,
      operator_id: operatorId,
      direction: direction,
      additional_data: additionalData,
    };

    return post<ApiResponse<GateControlResponse>>(
      API_ENDPOINTS.GATE_CONTROL.PLATE_DETECTION,
      requestData
    );
  }

  /**
   * Calculate pricing for vehicle entry
   */
  static async calculatePricing(
    vehicleId: number,
    stationId: number,
    accountId?: number
  ): Promise<ApiResponse<PricingData>> {
    const requestData: PricingCalculationRequest = {
      vehicle_id: vehicleId,
      station_id: stationId,
      account_id: accountId,
    };

    return post<ApiResponse<PricingData>>(
      API_ENDPOINTS.PRICING.CALCULATE,
      requestData
    );
  }

  /**
   * Calculate pricing by plate number
   */
  static async calculatePricingByPlate(
    plateNumber: string,
    stationId: number,
    accountId?: number
  ): Promise<ApiResponse<PricingData>> {
    const requestData: PricingCalculationRequest = {
      plate_number: plateNumber,
      station_id: stationId,
      account_id: accountId,
    };

    return post<ApiResponse<PricingData>>(
      API_ENDPOINTS.PRICING.CALCULATE_BY_PLATE,
      requestData
    );
  }

  /**
   * Get pricing summary for a station
   */
  static async getStationPricingSummary(
    stationId: number
  ): Promise<ApiResponse<any>> {
    return get<ApiResponse<any>>(
      API_ENDPOINTS.PRICING.STATION_SUMMARY(stationId)
    );
  }

  /**
   * Validate pricing configuration for a station
   */
  static async validateStationPricing(
    stationId: number
  ): Promise<ApiResponse<any>> {
    return get<ApiResponse<any>>(
      API_ENDPOINTS.PRICING.STATION_VALIDATE(stationId)
    );
  }

  /**
   * Quick lookup for vehicle information
   */
  static async quickLookup(
    plateNumber: string
  ): Promise<ApiResponse<any>> {
    return post<ApiResponse<any>>(
      API_ENDPOINTS.GATE_CONTROL.QUICK_LOOKUP,
      { plate_number: plateNumber }
    );
  }
}

export default PricingService;
