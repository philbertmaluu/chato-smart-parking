import { useState, useEffect, useCallback, useRef } from 'react';

interface UseMJPEGStreamOptions {
  enabled?: boolean;
  fallbackToSnapshot?: boolean;
  useSnapshotOnly?: boolean; // Skip MJPEG attempts and use snapshot directly
  onError?: (error: string) => void;
}

interface MJPEGStreamState {
  isStreaming: boolean;
  error: string | null;
  isFallback: boolean;
}

export const useMJPEGStream = (
  cameraDevice: { ip_address: string; use_https?: boolean; http_port?: number } | null,
  options: UseMJPEGStreamOptions = {}
) => {
  const {
    enabled = true,
    fallbackToSnapshot = true,
    useSnapshotOnly = true, // Default to snapshot only due to CORS issues
    onError,
  } = options;

  const [state, setState] = useState<MJPEGStreamState>({
    isStreaming: false,
    error: null,
    isFallback: false,
  });

  const streamContainerRef = useRef<HTMLDivElement | null>(null);
  const streamImgRef = useRef<HTMLImageElement | null>(null);
  const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  
  // Store camera device in ref to avoid dependency issues
  const cameraDeviceRef = useRef(cameraDevice);
  const enabledRef = useRef(enabled);
  const fallbackToSnapshotRef = useRef(fallbackToSnapshot);
  const useSnapshotOnlyRef = useRef(useSnapshotOnly);
  const onErrorRef = useRef(onError);
  
  // Update refs when values change
  useEffect(() => {
    cameraDeviceRef.current = cameraDevice;
    enabledRef.current = enabled;
    fallbackToSnapshotRef.current = fallbackToSnapshot;
    useSnapshotOnlyRef.current = useSnapshotOnly;
    onErrorRef.current = onError;
  }, [cameraDevice, enabled, fallbackToSnapshot, useSnapshotOnly, onError]);

  const cleanup = useCallback(() => {
    // Clean up MJPEG stream
    if (streamImgRef.current) {
      streamImgRef.current.src = '';
      streamImgRef.current = null;
    }

    // Clean up snapshot fallback
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
    }

    // Clean up retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    retryCountRef.current = 0;
  }, []);

  const startSnapshotFallback = useCallback((container: HTMLElement) => {
    const device = cameraDeviceRef.current;
    if (!device || !device.ip_address) return;

    cleanup();

    const protocol = device.use_https ? 'https' : 'http';
    const port = device.http_port || 80;
    const snapshotUrl = `${protocol}://${device.ip_address}:${port}/edge/cgi-bin/vparcgi.cgi?computerid=1&oper=snapshot&resolution=800x600`;

    const img = document.createElement('img');
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.className = 'w-full h-full object-contain';

    const updateSnapshot = () => {
      const currentDevice = cameraDeviceRef.current;
      if (img && currentDevice?.ip_address) {
        const timestamp = new Date().toISOString();
        img.src = `${snapshotUrl}&i=${timestamp}`;
      }
    };

    updateSnapshot();
    // Use slower refresh to reduce load (1.5 seconds - same as detection polling)
    snapshotIntervalRef.current = setInterval(updateSnapshot, 1500); // 1.5s to reduce load

    container.innerHTML = '';
    container.appendChild(img);
    streamImgRef.current = img;

    setState({
      isStreaming: true,
      error: null,
      isFallback: true,
    });
  }, [cleanup]);

  const startMJPEGStream = useCallback((container: HTMLElement) => {
    const device = cameraDeviceRef.current;
    if (!device || !device.ip_address) {
      setState({
        isStreaming: false,
        error: 'No camera device configured',
        isFallback: false,
      });
      return;
    }

    cleanup();

    // Use Laravel proxy endpoint to avoid CORS issues
    // The backend will handle authentication and CORS headers
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/toll-v1';
    
    // Try proxy endpoint first (recommended - handles CORS)
    const proxyMjpegUrl = `${API_BASE_URL}/stream/mjpeg/camera1?t=${Date.now()}`;
    
    // Fallback: Try direct camera endpoints (may fail due to CORS)
    const protocol = device.use_https ? 'https' : 'http';
    const port = device.http_port || 80;
    const directEndpoints = [
      `/edge/cgi-bin/mjpeg`,
      `/cgi-bin/mjpeg`,
      `/mjpeg`,
    ];

    let currentEndpointIndex = -1; // -1 means try proxy first
    const tryNextEndpoint = () => {
      let mjpegUrl: string;
      
      if (currentEndpointIndex === -1) {
        // Try proxy endpoint first
        mjpegUrl = proxyMjpegUrl;
        console.log(`[MJPEG] Trying proxy endpoint: ${mjpegUrl}`);
      } else if (currentEndpointIndex < directEndpoints.length) {
        // Try direct camera endpoints
        mjpegUrl = `${protocol}://${device.ip_address}:${port}${directEndpoints[currentEndpointIndex]}`;
        console.log(`[MJPEG] Trying direct endpoint: ${mjpegUrl}`);
      } else {
        // All endpoints failed, fallback to snapshot
        if (fallbackToSnapshotRef.current) {
          console.log('[MJPEG] All endpoints failed, falling back to snapshot');
          startSnapshotFallback(container);
          const errorMsg = 'MJPEG stream failed, using snapshot fallback';
          setState(prev => {
            if (prev.error === errorMsg) return prev;
            return { ...prev, error: errorMsg };
          });
          onErrorRef.current?.(errorMsg);
        } else {
          const errorMsg = 'MJPEG stream failed after trying all endpoints';
          setState(prev => {
            if (!prev.isStreaming && prev.error === errorMsg) return prev;
            return {
              isStreaming: false,
              error: errorMsg,
              isFallback: false,
            };
          });
          onErrorRef.current?.(errorMsg);
        }
        return;
      }

      const img = document.createElement('img');
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      img.className = 'w-full h-full object-contain';
      
      // Only set crossOrigin for direct camera access (not proxy)
      if (currentEndpointIndex >= 0) {
        img.crossOrigin = 'anonymous';
      }

      let loadTimeout: NodeJS.Timeout | null = null;
      let hasLoaded = false;

      img.onload = () => {
        if (hasLoaded) return;
        hasLoaded = true;
        
        if (loadTimeout) {
          clearTimeout(loadTimeout);
          loadTimeout = null;
        }

        console.log(`[MJPEG] Successfully connected to: ${mjpegUrl}`);
        setState(prev => {
          if (prev.isStreaming && !prev.isFallback && !prev.error) {
            return prev;
          }
          return {
            isStreaming: true,
            error: null,
            isFallback: false,
          };
        });
        retryCountRef.current = 0;
      };

      img.onerror = () => {
        if (loadTimeout) {
          clearTimeout(loadTimeout);
          loadTimeout = null;
        }

        console.warn(`[MJPEG] Failed to load from: ${mjpegUrl}`);
        currentEndpointIndex++;
        
        // Try next endpoint after a short delay
        setTimeout(() => {
          tryNextEndpoint();
        }, 1000);
      };

      // Set timeout to detect if image never loads
      loadTimeout = setTimeout(() => {
        if (!hasLoaded) {
          console.warn(`[MJPEG] Timeout waiting for: ${mjpegUrl}`);
          img.onerror?.(new Event('error'));
        }
      }, 5000);

      container.innerHTML = '';
      container.appendChild(img);
      streamImgRef.current = img;
      img.src = mjpegUrl;

      setState(prev => {
        if (prev.isStreaming && !prev.isFallback && !prev.error) {
          return prev;
        }
        return {
          isStreaming: true,
          error: null,
          isFallback: false,
        };
      });
    };

    // Start trying endpoints (proxy first)
    tryNextEndpoint();
  }, [startSnapshotFallback, cleanup]);

  const stopStream = useCallback(() => {
    cleanup();
    setState({
      isStreaming: false,
      error: null,
      isFallback: false,
    });
  }, [cleanup]);

  // Refresh function to restart the stream - defined BEFORE effects that use it
  const refreshStream = useCallback(() => {
    const device = cameraDeviceRef.current;
    const isEnabled = enabledRef.current;
    const useSnapshot = useSnapshotOnlyRef.current || !fallbackToSnapshotRef.current;
    
    if (!isEnabled || !device || !device.ip_address || !streamContainerRef.current) {
      return;
    }

    // Stop current stream first
    stopStream();
    
    // Small delay to ensure cleanup is complete
    setTimeout(() => {
      if (streamContainerRef.current && cameraDeviceRef.current === device) {
        if (useSnapshot) {
          startSnapshotFallback(streamContainerRef.current);
        } else {
          startMJPEGStream(streamContainerRef.current);
        }
      }
    }, 100);
  }, [stopStream, startMJPEGStream, startSnapshotFallback]);

  // Store refreshStream in ref to avoid dependency issues
  const refreshStreamRef = useRef(refreshStream);
  useEffect(() => {
    refreshStreamRef.current = refreshStream;
  }, [refreshStream]);

  // Auto-start stream when enabled and camera device is available
  useEffect(() => {
    const device = cameraDeviceRef.current;
    const isEnabled = enabledRef.current;
    const useSnapshot = useSnapshotOnlyRef.current || !fallbackToSnapshotRef.current;
    
    if (!isEnabled || !device || !device.ip_address) {
      stopStream();
      return;
    }

    // Small delay to ensure container ref is set
    const timer = setTimeout(() => {
      if (streamContainerRef.current && cameraDeviceRef.current === device) {
        if (useSnapshot) {
          // Use snapshot mode directly (faster and more reliable)
          startSnapshotFallback(streamContainerRef.current);
        } else {
          // Try MJPEG first, then fallback to snapshot
          startMJPEGStream(streamContainerRef.current);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      // Don't stop stream on cleanup - let it continue if page is still visible
      // Only stop if explicitly disabled or device changes
    };
  }, [cameraDevice?.ip_address, cameraDevice?.use_https, cameraDevice?.http_port, enabled, useSnapshotOnly, startMJPEGStream, startSnapshotFallback, stopStream]);

  // Restart stream when page becomes visible again
  useEffect(() => {
    if (!enabled) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const device = cameraDeviceRef.current;
        if (device && device.ip_address && streamContainerRef.current) {
          // Page became visible, restart stream using ref to avoid dependency issues
          refreshStreamRef.current();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);

  return {
    streamContainerRef,
    isStreaming: state.isStreaming,
    error: state.error,
    isFallback: state.isFallback,
    startStream: startMJPEGStream,
    stopStream,
    refreshStream,
  };
};

