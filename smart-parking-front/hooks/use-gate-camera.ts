import { useState, useEffect, useCallback } from 'react';

interface CameraConfig {
  ip: string;
  httpPort: number;
  rtspPort: number;
  username: string;
  password: string;
  useHttps: boolean;
  name?: string;
  deviceId?: string;
  supportsRtsp: boolean;
  supportsSnapshot: boolean;
}

interface UseGateCameraReturn {
  cameraConfig: CameraConfig | null;
  loading: boolean;
  error: string | null;
  fetchCameraConfig: (gateId: number) => Promise<void>;
}

export function useGateCamera(): UseGateCameraReturn {
  const [cameraConfig, setCameraConfig] = useState<CameraConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCameraConfig = useCallback(async (gateId: number) => {
    if (!gateId) {
      setError('Gate ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/toll-v1/gates/${gateId}/camera-config`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch camera configuration');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setCameraConfig(data.data);
      } else {
        throw new Error(data.message || 'Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch camera configuration';
      setError(errorMessage);
      console.error('Error fetching camera config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cameraConfig,
    loading,
    error,
    fetchCameraConfig,
  };
}
