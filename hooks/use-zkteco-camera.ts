"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ZKTecoCameraConfig, zktecoConfig, ZKTECO_STREAM_CONFIG } from "@/utils/config/zkteco-config";
import { API_BASE_URL } from "@/utils/config/config";

export interface ZKTecoCameraState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  currentStreamType: string | null;
  streamActive: boolean;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';
  lastSnapshot: string | null;
  deviceInfo: Record<string, any> | null;
}

export interface ZKTecoConnectionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface UseZKTecoCameraOptions {
  autoConnect?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export const useZKTecoCamera = (options: UseZKTecoCameraOptions = {}) => {
  const {
    autoConnect = false,
    retryAttempts = 3,
    retryDelay = 2000,
  } = options;

  // State management
  const [state, setState] = useState<ZKTecoCameraState>({
    isConnected: false,
    isLoading: false,
    error: null,
    currentStreamType: null,
    streamActive: false,
    connectionStatus: 'idle',
    lastSnapshot: null,
    deviceInfo: null,
  });

  // Refs for cleanup and stream management
  const streamContainer = useRef<HTMLDivElement | null>(null);
  const currentStream = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
  const retryTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Update state helper
  const updateState = useCallback((updates: Partial<ZKTecoCameraState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    retryTimeouts.current.forEach(timeout => clearTimeout(timeout));
    retryTimeouts.current = [];
  }, []);

  // API request helper
  const makeApiRequest = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ZKTecoConnectionResult> => {
    try {
      const config = zktecoConfig.getConfig();
      const headers = {
        'Content-Type': 'application/json',
        'X-Camera-IP': config.ip,
        'X-Camera-Username': config.username,
        'X-Camera-Password': config.password,
        ...options.headers,
      };

      // Use API_BASE_URL for Laravel backend endpoints
      const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.replace('/api/toll-v1', '')}`;

      const response = await fetch(fullUrl, {
        ...options,
        headers,
        signal: AbortSignal.timeout(ZKTECO_STREAM_CONFIG.timeout),
      });

      const contentType = response.headers.get('content-type');
      
      // Always try to parse JSON response for both success and error cases
      if (contentType?.includes('application/json')) {
        const result = await response.json();
        
        // Return the result regardless of HTTP status - let the caller handle it
        return {
          success: response.ok && result.success !== false,
          message: result.message || (response.ok ? 'Operation successful' : `HTTP ${response.status}: ${response.statusText}`),
          data: result.data || result,
        };
      }

      // For non-JSON responses
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        message: 'Request successful',
        data: response,
      };
    } catch (error) {
      console.error(`ZKTeco API Error (${endpoint}):`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, []);

  /**
   * Test camera connection
   */
  const testConnection = useCallback(async (
    customConfig?: Partial<ZKTecoCameraConfig>
  ): Promise<ZKTecoConnectionResult> => {
    updateState({ isLoading: true, connectionStatus: 'connecting', error: null });

    try {
      // Update config if custom values provided
      if (customConfig) {
        zktecoConfig.updateConfig(customConfig);
      }

      // Validate configuration first
      const validation = zktecoConfig.validateConfig();
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const result = await makeApiRequest('/api/toll-v1/zkteco/test-connection', {
        method: 'POST',
        body: JSON.stringify({ action: 'test-connection' }),
      });

      if (result.success) {
        updateState({
          isConnected: true,
          connectionStatus: 'connected',
          isLoading: false,
          error: null,
        });
      } else {
        updateState({
          isConnected: false,
          connectionStatus: 'error',
          isLoading: false,
          error: result.message,
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      updateState({
        isConnected: false,
        connectionStatus: 'error',
        isLoading: false,
        error: errorMessage,
      });

      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }, [makeApiRequest, updateState]);

  /**
   * Capture snapshot from camera
   */
  const captureSnapshot = useCallback(async (): Promise<ZKTecoConnectionResult> => {
    updateState({ isLoading: true, error: null });

    try {
      const result = await makeApiRequest('/api/toll-v1/zkteco/snapshot', {
        method: 'POST',
      });

      if (result.success && result.data) {
        // Create blob URL for the image
        const response = result.data as Response;
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);

        updateState({
          lastSnapshot: imageUrl,
          isLoading: false,
          error: null,
        });

        return {
          success: true,
          message: 'Snapshot captured successfully',
          data: { url: imageUrl, blob },
        };
      }

      throw new Error(result.message || 'Snapshot capture failed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Snapshot failed';
      updateState({ isLoading: false, error: errorMessage });

      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }, [makeApiRequest, updateState]);

  /**
   * Get device information
   */
  const getDeviceInfo = useCallback(async (): Promise<ZKTecoConnectionResult> => {
    try {
      const result = await makeApiRequest('/api/toll-v1/zkteco/device-info', {
        method: 'POST',
      });

      if (result.success) {
        updateState({ deviceInfo: result.data });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Device info failed';
      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }, [makeApiRequest, updateState]);

  /**
   * Start MJPEG stream
   */
  const startMJPEGStream = useCallback(async (
    container: HTMLDivElement
  ): Promise<ZKTecoConnectionResult> => {
    try {
      updateState({ isLoading: true, error: null, currentStreamType: 'mjpeg' });

      // Test connection first
      const connectionTest = await testConnection();
      if (!connectionTest.success) {
        throw new Error(connectionTest.message);
      }

      // Create img element for MJPEG stream
      const img = document.createElement('img');
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.maxWidth = '100%';
      img.style.objectFit = 'contain';

      // Set up error handling
      img.onerror = () => {
        updateState({
          isLoading: false,
          streamActive: false,
          error: 'MJPEG stream failed to load',
        });
      };

      img.onload = () => {
        updateState({
          isLoading: false,
          streamActive: true,
          error: null,
        });
      };

      // Set stream URL
      const config = zktecoConfig.getConfig();
      const streamUrl = zktecoConfig.getApiStreamUrl('mjpeg');
      img.src = streamUrl;

      // Clear container and add image
      container.innerHTML = '';
      container.appendChild(img);

      // Store reference
      currentStream.current = img;
      streamContainer.current = container;

      return {
        success: true,
        message: 'MJPEG stream started',
        data: { element: img },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'MJPEG stream failed';
      updateState({
        isLoading: false,
        streamActive: false,
        error: errorMessage,
      });

      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }, [testConnection, updateState]);

  /**
   * Start live snapshots (refreshing images)
   */
  const startSnapshotStream = useCallback(async (
    container: HTMLDivElement,
    intervalMs: number = 2000
  ): Promise<ZKTecoConnectionResult> => {
    try {
      updateState({ isLoading: true, error: null, currentStreamType: 'snapshot' });

      // Test connection first
      const connectionTest = await testConnection();
      if (!connectionTest.success) {
        throw new Error(connectionTest.message);
      }

      // Create img element
      const img = document.createElement('img');
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.maxWidth = '100%';
      img.style.objectFit = 'contain';

      // Initial snapshot
      const initialSnapshot = await captureSnapshot();
      if (initialSnapshot.success && initialSnapshot.data?.url) {
        img.src = initialSnapshot.data.url;
      }

      // Clear container and add image
      container.innerHTML = '';
      container.appendChild(img);

      // Set up interval for refreshing snapshots
      const interval = setInterval(async () => {
        if (!state.streamActive) {
          clearInterval(interval);
          return;
        }

        const snapshot = await captureSnapshot();
        if (snapshot.success && snapshot.data?.url) {
          img.src = snapshot.data.url;
        }
      }, intervalMs);

      // Store references
      currentStream.current = img;
      streamContainer.current = container;

      updateState({
        isLoading: false,
        streamActive: true,
        error: null,
      });

      return {
        success: true,
        message: 'Snapshot stream started',
        data: { element: img, interval },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Snapshot stream failed';
      updateState({
        isLoading: false,
        streamActive: false,
        error: errorMessage,
      });

      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }, [testConnection, captureSnapshot, updateState, state.streamActive]);

  /**
   * Stop current stream
   */
  const stopStream = useCallback(() => {
    if (streamContainer.current) {
      streamContainer.current.innerHTML = '';
    }
    
    if (currentStream.current) {
      if (currentStream.current instanceof HTMLImageElement) {
        currentStream.current.src = '';
      }
      currentStream.current = null;
    }

    // Clear any URLs to prevent memory leaks
    if (state.lastSnapshot) {
      URL.revokeObjectURL(state.lastSnapshot);
    }

    clearTimeouts();

    updateState({
      streamActive: false,
      currentStreamType: null,
      lastSnapshot: null,
    });
  }, [state.lastSnapshot, clearTimeouts, updateState]);

  /**
   * Get RTSP URLs
   */
  const getRtspUrls = useCallback(async (streamType: 'main' | 'sub' = 'main'): Promise<ZKTecoConnectionResult> => {
    try {
      const result = await makeApiRequest('/api/toll-v1/zkteco/rtsp-url', {
        method: 'POST',
        body: JSON.stringify({ stream_type: streamType }),
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'RTSP URL generation failed';
      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }, [makeApiRequest]);

  /**
   * Validate and update camera credentials
   */
  const updateCredentials = useCallback(async (
    credentials: Partial<ZKTecoCameraConfig>
  ): Promise<ZKTecoConnectionResult> => {
    try {
      updateState({ isLoading: true, error: null });

      zktecoConfig.updateConfig(credentials);
      
      const result = await makeApiRequest('/api/toll-v1/zkteco/validate-credentials', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (result.success) {
        updateState({
          isConnected: true,
          connectionStatus: 'connected',
          isLoading: false,
          error: null,
        });
      } else {
        updateState({
          isConnected: false,
          connectionStatus: 'error',
          isLoading: false,
          error: result.message,
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Credential validation failed';
      updateState({
        isConnected: false,
        connectionStatus: 'error',
        isLoading: false,
        error: errorMessage,
      });

      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }, [makeApiRequest, updateState]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      testConnection();
    }
  }, [autoConnect, testConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
      clearTimeouts();
    };
  }, [stopStream, clearTimeouts]);

  return {
    // State
    ...state,
    
    // Configuration
    config: zktecoConfig.getConfig(),
    
    // Connection management
    testConnection,
    updateCredentials,
    
    // Streaming
    startMJPEGStream,
    startSnapshotStream,
    stopStream,
    captureSnapshot,
    
    // Utilities
    getDeviceInfo,
    getRtspUrls,
    
    // Configuration methods
    updateConfig: zktecoConfig.updateConfig.bind(zktecoConfig),
    validateConfig: zktecoConfig.validateConfig.bind(zktecoConfig),
  };
};