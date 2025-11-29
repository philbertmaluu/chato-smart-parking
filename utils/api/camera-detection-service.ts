import { API_ENDPOINTS } from './endpoints';
import { get, post } from './api';
import { CameraDetection } from '@/hooks/use-detection-logs';

export interface PendingVehicleTypeDetection extends CameraDetection {
  processing_status: 'pending_vehicle_type';
}

export interface ProcessWithVehicleTypeRequest {
  body_type_id: number;
}

export interface ProcessWithVehicleTypeResponse {
  success: boolean;
  data: {
    detection: CameraDetection;
    vehicle: any;
    passage: any;
  };
  messages: string;
  status: number;
}

export class CameraDetectionService {
  /**
   * Get detections pending vehicle type selection
   */
  static async getPendingVehicleTypeDetections(): Promise<PendingVehicleTypeDetection[]> {
    const response = await get<{
      success: boolean;
      data: PendingVehicleTypeDetection[];
      messages: string;
      status: number;
    }>(API_ENDPOINTS.CAMERA_DETECTION.LOGS_PENDING_VEHICLE_TYPE);

    if (response.success && response.data) {
      return response.data;
    }
    return [];
  }

  /**
   * Process detection with vehicle type
   */
  static async processWithVehicleType(
    detectionId: number,
    bodyTypeId: number
  ): Promise<ProcessWithVehicleTypeResponse> {
    return post<ProcessWithVehicleTypeResponse>(
      API_ENDPOINTS.CAMERA_DETECTION.PROCESS_WITH_VEHICLE_TYPE(detectionId),
      { body_type_id: bodyTypeId }
    );
  }
}




