import { API_ENDPOINTS } from './endpoints';
import { get, post } from './api';
import { CameraDetection } from '@/hooks/use-detection-logs';

export interface PendingVehicleTypeDetection extends CameraDetection {
  processing_status: 'pending_vehicle_type';
}

export interface PendingExitDetection extends CameraDetection {
  processing_status: 'pending_exit';
  vehicle?: any;
  active_passage?: any;
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

export interface ProcessExitDetectionRequest {
  payment_confirmed?: boolean;
  operator_name?: string;
  payment_method?: string;
}

export interface ProcessExitDetectionResponse {
  success: boolean;
  data: {
    detection: CameraDetection;
    passage: any;
    result: any;
  };
  messages: string;
  status: number;
}

export interface LatestDetectionInfo {
  latest_id: number;
  total_count: number;
  latest_timestamp: string | null;
}

export interface LatestDetectionInfoResponse {
  success: boolean;
  data: LatestDetectionInfo;
  messages: string;
  status: number;
}

export interface FetchAndStoreResponse {
  success: boolean;
  data: {
    fetched: number;
    stored: number;
    skipped: number;
    errors: number;
    camera_unavailable?: boolean;
    detection?: {
      id: number;
      plate_number: string;
      detection_timestamp: string;
    } | null;
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

  /**
   * Get detections pending exit confirmation
   */
  static async getPendingExitDetections(): Promise<PendingExitDetection[]> {
    const response = await get<{
      success: boolean;
      data: PendingExitDetection[];
      messages: string;
      status: number;
    }>(API_ENDPOINTS.CAMERA_DETECTION.LOGS_PENDING_EXIT);

    if (response.success && response.data) {
      return response.data;
    }
    return [];
  }

  /**
   * Process exit detection with operator confirmation
   */
  static async processExitDetection(
    detectionId: number,
    data?: ProcessExitDetectionRequest
  ): Promise<ProcessExitDetectionResponse> {
    return post<ProcessExitDetectionResponse>(
      API_ENDPOINTS.CAMERA_DETECTION.PROCESS_EXIT(detectionId),
      data || {}
    );
  }

  /**
   * Get latest detection info (lightweight check for polling)
   */
  static async getLatestDetectionInfo(gateId?: number): Promise<LatestDetectionInfo | null> {
    try {
      const queryParams = gateId ? `?gate_id=${gateId}` : '';
      const response = await get<LatestDetectionInfoResponse>(
        `${API_ENDPOINTS.CAMERA_DETECTION.LOGS_LATEST}${queryParams}`
      );

      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching latest detection info:', error);
      return null;
    }
  }

  /**
   * Fetch camera logs from camera API and store new detections in database
   * This polls the camera directly and compares with DB to find new instances
   */
  static async fetchAndStoreFromCamera(): Promise<FetchAndStoreResponse> {
    return post<FetchAndStoreResponse>(
      API_ENDPOINTS.CAMERA_DETECTION.FETCH_AND_STORE,
      {}
    );
  }

  /**
   * Quick capture - optimized for operator real-time vehicle capture
   * Only fetches recent detections (last 2 minutes) for faster response
   */
  static async quickCapture(): Promise<FetchAndStoreResponse> {
    return post<FetchAndStoreResponse>(
      API_ENDPOINTS.CAMERA_DETECTION.QUICK_CAPTURE,
      {}
    );
  }
}




