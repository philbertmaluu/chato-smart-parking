import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '@/utils/api/endpoints';
import { get } from '@/utils/api/api';

export interface CameraDetection {
  id: number;
  timestamp: string;
  numberplate: string;
  locatedPlate: number;
  globalconfidence: string;
  averagecharheight: string;
  processtime: number;
  pDetectionTime: number;
  plateformat: number;
  country: number;
  country_str: string;
  vehicleleft: number;
  vehicletop: number;
  vehicleright: number;
  vehiclebottom: number;
  resultleft: number;
  resulttop: number;
  resultright: number;
  resultbottom: number;
  roimotionleft: number;
  roimotiontop: number;
  roimotionright: number;
  roimotionbottom: number;
  originalplate: string;
  speed: string;
  listid: string;
  namelistid: string;
  laneid: number;
  direction: number;
  make: number;
  model: number;
  color: number;
  imagepath: string;
  imageretailpath: string;
  width: number;
  height: number;
  utctime: string;
  evidences: number;
  veclass_str: string;
  color_str: string;
  make_str: string;
  model_str: string;
  br_ocurr: number;
  br_time: number;
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

export const useDetectionLogs = () => {
  const [detections, setDetections] = useState<CameraDetection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetchDetectionLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<DetectionLogsResponse>(
        API_ENDPOINTS.CAMERA_DETECTION.FETCH
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
  }, []);

  return {
    detections,
    loading,
    error,
    count,
    fetchDetectionLogs,
  };
};

