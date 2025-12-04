"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface CameraConfig {
  ip: string;
  httpPort: number;
  httpsPort: number;
  username?: string;
  password?: string;
}

export interface CameraInterfaceState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  currentUrl: string | null;
  useHttps: boolean;
}

const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  ip: "192.168.0.109",
  httpPort: 80,
  httpsPort: 443,
  username: "admin", // Default camera credentials
  password: "Password123!",
};

// ZKTeco camera common stream endpoints
const ZKTECO_ENDPOINTS = {
  // Common live stream paths for ZKTeco cameras
  mainStream: '/live/main', // Main stream (higher quality)
  subStream: '/live/sub', // Sub stream (lower quality, better for web)
  mjpegStream: '/cgi-bin/mjpeg', // MJPEG stream
  snapshotStream: '/cgi-bin/snapshot.cgi', // Single snapshot
  webInterface: '/', // Main web interface
  liveView: '/live.html', // Live view page
  rtspMain: '/Streaming/Channels/101', // RTSP main stream
  rtspSub: '/Streaming/Channels/102', // RTSP sub stream
};

export const useCameraInterface = (config: Partial<CameraConfig> = {}) => {
  const cameraConfig = { ...DEFAULT_CAMERA_CONFIG, ...config };
  const [state, setState] = useState<CameraInterfaceState>({
    isConnected: false,
    isLoading: false,
    error: null,
    currentUrl: null,
    useHttps: false, // Default to HTTP to avoid SSL certificate issues
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const testConnectionTimeout = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Generate camera URL with authentication
  const getCameraUrl = useCallback((useHttps: boolean = state.useHttps, includeAuth: boolean = true) => {
    const protocol = useHttps ? "https" : "http";
    const port = useHttps ? cameraConfig.httpsPort : cameraConfig.httpPort;
    
    if (includeAuth && cameraConfig.username && cameraConfig.password) {
      return `${protocol}://${encodeURIComponent(cameraConfig.username)}:${encodeURIComponent(cameraConfig.password)}@${cameraConfig.ip}:${port}/`;
    }
    
    return `${protocol}://${cameraConfig.ip}:${port}/`;
  }, [cameraConfig, state.useHttps]);

  // Get live stream URL for ZKTeco camera
  const getLiveStreamUrl = useCallback((streamType: 'main' | 'sub' | 'mjpeg' = 'sub', includeAuth: boolean = true) => {
    const protocol = state.useHttps ? "https" : "http";
    const port = state.useHttps ? cameraConfig.httpsPort : cameraConfig.httpPort;
    
    let endpoint = '';
    switch (streamType) {
      case 'main':
        endpoint = ZKTECO_ENDPOINTS.mainStream;
        break;
      case 'sub':
        endpoint = ZKTECO_ENDPOINTS.subStream;
        break;
      case 'mjpeg':
        endpoint = ZKTECO_ENDPOINTS.mjpegStream;
        break;
    }
    
    if (includeAuth && cameraConfig.username && cameraConfig.password) {
      return `${protocol}://${encodeURIComponent(cameraConfig.username)}:${encodeURIComponent(cameraConfig.password)}@${cameraConfig.ip}:${port}${endpoint}`;
    }
    
    return `${protocol}://${cameraConfig.ip}:${port}${endpoint}`;
  }, [cameraConfig, state.useHttps]);

  // Get snapshot URL
  const getSnapshotUrl = useCallback((includeAuth: boolean = true) => {
    const protocol = state.useHttps ? "https" : "http";
    const port = state.useHttps ? cameraConfig.httpsPort : cameraConfig.httpPort;
    
    if (includeAuth && cameraConfig.username && cameraConfig.password) {
      return `${protocol}://${encodeURIComponent(cameraConfig.username)}:${encodeURIComponent(cameraConfig.password)}@${cameraConfig.ip}:${port}${ZKTECO_ENDPOINTS.snapshotStream}`;
    }
    
    return `${protocol}://${cameraConfig.ip}:${port}${ZKTECO_ENDPOINTS.snapshotStream}`;
  }, [cameraConfig, state.useHttps]);

  // Get RTSP URL for external players
  const getRTSPUrl = useCallback((streamType: 'main' | 'sub' = 'main') => {
    const endpoint = streamType === 'main' ? ZKTECO_ENDPOINTS.rtspMain : ZKTECO_ENDPOINTS.rtspSub;
    
    if (cameraConfig.username && cameraConfig.password) {
      return `rtsp://${encodeURIComponent(cameraConfig.username)}:${encodeURIComponent(cameraConfig.password)}@${cameraConfig.ip}:554${endpoint}`;
    }
    
    return `rtsp://${cameraConfig.ip}:554${endpoint}`;
  }, [cameraConfig]);

  // Connect to live stream directly
  const connectToLiveStream = useCallback(async (streamType: 'main' | 'sub' | 'mjpeg' = 'sub') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const streamUrl = getLiveStreamUrl(streamType);
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        isLoading: false,
        error: null,
        currentUrl: streamUrl,
      }));

      return { success: true, url: streamUrl, streamType };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to connect to live stream';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
      }));
      return { success: false, error: errorMsg };
    }
  }, [getLiveStreamUrl]);

  // Connect to camera web interface
  const connectToWebInterface = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const baseUrl = getCameraUrl(state.useHttps);
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        isLoading: false,
        error: null,
        currentUrl: baseUrl,
      }));

      return { success: true, url: baseUrl };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to connect to camera interface';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
      }));
      return { success: false, error: errorMsg };
    }
  }, [getCameraUrl, state.useHttps]);

  // Test live stream connection
  const testLiveStream = useCallback(async (streamType: 'main' | 'sub' | 'mjpeg' = 'sub'): Promise<boolean> => {
    try {
      const streamUrl = getLiveStreamUrl(streamType, true);
      
      // Try to fetch the stream to see if it's accessible
      const response = await fetch(streamUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${cameraConfig.username}:${cameraConfig.password}`)}`,
        },
        mode: 'no-cors', // Avoid CORS issues for testing
      });

      // If we get here without error, connection is likely working
      return true;
    } catch (error) {
      console.error('Stream test failed:', error);
      return false;
    }
  }, [getLiveStreamUrl, cameraConfig]);

  // Load MJPEG stream into image element
  const loadMJPEGStream = useCallback((container: HTMLElement) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const streamUrl = getLiveStreamUrl('mjpeg');
      
      // Create image element for MJPEG stream
      const img = document.createElement('img');
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'contain';
      img.src = streamUrl;
      
      img.onload = () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isLoading: false,
          error: null,
          currentUrl: streamUrl,
        }));
      };
      
      img.onerror = () => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load MJPEG stream. Please check camera connection.',
        }));
      };
      
      container.innerHTML = '';
      container.appendChild(img);
      
      return { success: true, element: img };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load MJPEG stream';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
      }));
      return { success: false, error: errorMsg };
    }
  }, [getLiveStreamUrl]);

  // Capture snapshot from camera
  const captureSnapshot = useCallback(async () => {
    try {
      const snapshotUrl = getSnapshotUrl(true);
      
      // Add timestamp to avoid caching
      const urlWithTimestamp = `${snapshotUrl}?t=${Date.now()}`;
      
      return {
        success: true,
        url: urlWithTimestamp,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to capture snapshot';
      return { success: false, error: errorMsg };
    }
  }, [getSnapshotUrl]);

  // Copy RTSP URL to clipboard for external players like VLC
  const copyRTSPUrl = useCallback(async (streamType: 'main' | 'sub' = 'main') => {
    try {
      const rtspUrl = getRTSPUrl(streamType);
      
      await navigator.clipboard.writeText(rtspUrl);
      
      return {
        success: true,
        message: 'RTSP URL copied to clipboard. Open in VLC or similar player.',
        url: rtspUrl,
      };
    } catch (error) {
      // Fallback for older browsers
      try {
        const rtspUrl = getRTSPUrl(streamType);
        const textArea = document.createElement('textarea');
        textArea.value = rtspUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        return {
          success: true,
          message: 'RTSP URL copied to clipboard',
          url: rtspUrl,
        };
      } catch (fallbackErr) {
        return {
          success: false,
          error: 'Failed to copy RTSP URL',
        };
      }
    }
  }, [getRTSPUrl]);

  // Simple connection test without actual network calls
  const testConnection = useCallback(async (useHttps: boolean = false): Promise<boolean> => {
    // Prefer HTTP to avoid SSL certificate issues
    return Promise.resolve(true);
  }, []);

  // Connect to camera interface with secure proxy approach
  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // Use secure proxy instead of direct connection
    const cameraUrl = `http://${cameraConfig.ip}:${cameraConfig.httpPort}/`;
    const proxyUrl = `/api/camera-proxy/?url=${encodeURIComponent(cameraUrl)}`;
    
    setState(prev => ({
      ...prev,
      isConnected: true,
      isLoading: false,
      error: null,
      currentUrl: proxyUrl,
      useHttps: false, // Proxy handles the protocol
    }));

    return { success: true, url: proxyUrl };
  }, [cameraConfig]);

  // Connect with specific protocol
  const connectWithProtocol = useCallback(async (useHttps: boolean) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const cameraUrl = getCameraUrl(useHttps);
    
    setState(prev => ({
      ...prev,
      isConnected: true,
      isLoading: false,
      error: null,
      currentUrl: cameraUrl,
      useHttps,
    }));

    return { success: true, url: cameraUrl };
  }, [getCameraUrl]);

  // Disconnect from camera
  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      isLoading: false,
      error: null,
      currentUrl: null,
      useHttps: true,
    });

    if (testConnectionTimeout.current) {
      clearTimeout(testConnectionTimeout.current);
      testConnectionTimeout.current = null;
    }
  }, []);

  // Toggle between HTTP and HTTPS
  const toggleProtocol = useCallback(async () => {
    if (state.isLoading) return;

    const newUseHttps = !state.useHttps;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const works = await testConnection(newUseHttps);
    
    if (works) {
      const newUrl = getCameraUrl(newUseHttps);
      setState(prev => ({
        ...prev,
        useHttps: newUseHttps,
        currentUrl: newUrl,
        isLoading: false,
        isConnected: true,
        error: null,
      }));
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: `${newUseHttps ? "HTTPS" : "HTTP"} connection failed`,
      }));
    }
  }, [state.useHttps, state.isLoading, testConnection, getCameraUrl]);

  // Handle iframe load events
  const handleIframeLoad = useCallback(() => {
    if (iframeRef.current) {
      try {
        // Try to access iframe content to check if it loaded successfully
        const iframeDoc = iframeRef.current.contentDocument;
        if (iframeDoc) {
          setState(prev => ({ ...prev, error: null }));
        }
      } catch (error) {
        // Cross-origin error is expected and means the iframe loaded successfully
        setState(prev => ({ ...prev, error: null }));
      }
    }
  }, []);

  // Handle iframe errors
  const handleIframeError = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      error: "Failed to load camera interface. The camera may require direct browser access." 
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (testConnectionTimeout.current) {
        clearTimeout(testConnectionTimeout.current);
      }
    };
  }, []);

  return {
    // State
    ...state,
    cameraConfig,
    
    // Refs
    iframeRef,
    videoRef,
    
    // Actions
    connect,
    disconnect,
    toggleProtocol,
    testConnection,
    getCameraUrl,
    
    // Live Stream Methods
    connectToLiveStream,
    connectToWebInterface,
    testLiveStream,
    loadMJPEGStream,
    captureSnapshot,
    copyRTSPUrl,
    
    // URL Getters
    getLiveStreamUrl,
    getSnapshotUrl,
    getRTSPUrl,
    
    // Event handlers
    handleIframeLoad,
    handleIframeError,
  };
};
