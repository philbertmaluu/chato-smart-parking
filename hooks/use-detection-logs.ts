import { useState, useCallback, useRef, useEffect } from 'react';
import { API_ENDPOINTS } from '@/utils/api/endpoints';
import { get } from '@/utils/api/api';
import { generateCacheKey, getCached, setCached, invalidateCache } from '@/utils/data-cache';
import { CameraDetectionService } from '@/utils/api/camera-detection-service';

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
  processing_status?: string | null;
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestIdRef = useRef<number>(0);

  const fetchDetectionLogs = useCallback(async (silent: boolean = false): Promise<void> => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    // Only show loading state if not a silent background fetch
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Build query parameters correctly
      const params = new URLSearchParams();
      if (gateId) {
        params.append('gate_id', gateId.toString());
      }
      // Reduced default per_page from 100 to 15 for faster loading
      params.append('per_page', '15');
      // Add timestamp to bypass cache and get fresh data
      params.append('_', Date.now().toString());
      
      const queryString = params.toString();
      const url = `${API_ENDPOINTS.CAMERA_DETECTION.FETCH}?${queryString}`;
      
      const response = await get<DetectionLogsResponse>(url);
      
      if (response.success && response.data) {
        // Don't cache - always get fresh data for real-time updates
        const newDetections = response.data.detections || [];
        setDetections(newDetections);
        setCount(response.data.count || 0);
        
        // Update latest ID ref
        if (newDetections.length > 0 && newDetections[0].id) {
          latestIdRef.current = newDetections[0].id;
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      // Only set error if not silent (to avoid showing errors on background polls)
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Failed to fetch detection logs');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
      abortControllerRef.current = null;
    }
  }, [gateId]);

  // Lightweight check for new detections (returns true if new data exists)
  const checkForNewDetections = useCallback(async (): Promise<boolean> => {
    try {
      const latestInfo = await CameraDetectionService.getLatestDetectionInfo(gateId);
      
      if (!latestInfo) {
        return false;
      }

      // Compare latest ID with current latest detection ID
      const currentLatestId = latestIdRef.current;
      const hasNewData = latestInfo.latest_id > currentLatestId;

      if (hasNewData) {
        console.log('[Detection Logs] New detection found via lightweight check. Latest ID:', latestInfo.latest_id, 'Current:', currentLatestId);
      }

      return hasNewData;  
    } catch (err) {
      console.error('[Detection Logs] Error checking for new detections:', err);
      return false;
    }
  }, [gateId]);

  // Lightweight check for new data (doesn't update state, just returns count)
  const checkForNewData = useCallback(async (): Promise<number> => {
    try {
      const queryParams = gateId ? `?gate_id=${gateId}&per_page=1` : '?per_page=1';
      const cacheKey = generateCacheKey(`${API_ENDPOINTS.CAMERA_DETECTION.FETCH}${queryParams}`);
      const cached = getCached<DetectionLogsResponse>(cacheKey);
      
      if (cached && cached.success && cached.data) {
        return cached.data.count || 0;
      }

      const response = await get<DetectionLogsResponse>(
        `${API_ENDPOINTS.CAMERA_DETECTION.FETCH}${queryParams}`
      );
      
      if (response.success && response.data) {
        // Cache the count check result
        setCached(cacheKey, response, 3000); // 3 second cache
        return response.data.count || 0;
      }
      return count;
    } catch (err) {
      return count;
    }
  }, [count, gateId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Invalidate cache when component unmounts
      invalidateCache(API_ENDPOINTS.CAMERA_DETECTION.FETCH);
    };
  }, []);

  return {
    detections,
    loading,
    error,
    count,
    fetchDetectionLogs,
    checkForNewData, 
    checkForNewDetections,
  };
};

