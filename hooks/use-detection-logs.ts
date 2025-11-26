import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '@/utils/api/endpoints';
import { get } from '@/utils/api/api';

export interface CameraDetection {
  id: number;
  camera_detection_id: number;
  gate_id: number | null;
  gate?: {
    id: number;
    name: string;
    station_id: number;
  };
  numberplate: string;
  originalplate: string;
  detection_timestamp: string;
  timestamp?: string; // Alias for detection_timestamp
  utc_time: string;
  located_plate: boolean;
  global_confidence: string | number;
  globalconfidence?: string; // Alias for backward compatibility
  average_char_height: string;
  process_time: number;
  processtime?: number; // Alias for process_time
  plate_format: number;
  country: number;
  country_str: string;
  vehicle_left: number;
  vehicle_top: number;
  vehicle_right: number;
  vehicle_bottom: number;
  result_left: number;
  result_top: number;
  result_right: number;
  result_bottom: number;
  speed: string;
  lane_id: number;
  laneid?: number; // Alias for lane_id
  direction: number;
  make: number;
  model: number;
  color: number;
  make_str: string;
  model_str: string;
  color_str: string;
  veclass_str: string;
  image_path: string;
  imagepath?: string; // Alias for image_path
  image_retail_path: string;
  imageretailpath?: string; // Alias for image_retail_path
  width: number;
  height: number;
  list_id: string;
  name_list_id: string;
  evidences: number;
  br_ocurr: number;
  br_time: number;
  raw_data: any;
  processed: boolean;
  processed_at: string | null;
  processing_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DetectionLogsResponse {
  success: boolean;
  data: {
    detections: CameraDetection[];
    count: number;
  };
  messages: string;
  status: number;
}

export const useDetectionLogs = (gateId?: number) => {
  const [detections, setDetections] = useState<CameraDetection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetchDetectionLogs = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = gateId ? `?gate_id=${gateId}` : '';
      const response = await get<DetectionLogsResponse>(
        `${API_ENDPOINTS.CAMERA_DETECTION.FETCH}${queryParams}`
      );
      
      if (response.success && response.data) {
        setDetections(response.data.detections || []);
        setCount(response.data.count || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch detection logs');
    } finally {
      setLoading(false);
    }
  }, [gateId]);

  // Lightweight check for new data (doesn't update state, just returns count)
  const checkForNewData = useCallback(async (): Promise<number> => {
    try {
      const queryParams = gateId ? `?gate_id=${gateId}&per_page=1` : '?per_page=1';
      const response = await get<DetectionLogsResponse>(
        `${API_ENDPOINTS.CAMERA_DETECTION.FETCH}${queryParams}`
      );
      
      if (response.success && response.data) {
        return response.data.count || 0;
      }
      return count;
    } catch (err) {
      return count;
    }
  }, [count, gateId]);

  return {
    detections,
    loading,
    error,
    count,
    fetchDetectionLogs,
    checkForNewData,
  };
};

