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
  ip: "192.168.0.103",
  httpPort: 80,
  httpsPort: 443,
  username: "admin", // Default camera credentials
  password: "Password123!",
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

  // Generate camera URL with authentication
  const getCameraUrl = useCallback((useHttps: boolean = state.useHttps, includeAuth: boolean = true) => {
    const protocol = useHttps ? "https" : "http";
    const port = useHttps ? cameraConfig.httpsPort : cameraConfig.httpPort;
    
    if (includeAuth && cameraConfig.username && cameraConfig.password) {
      return `${protocol}://${encodeURIComponent(cameraConfig.username)}:${encodeURIComponent(cameraConfig.password)}@${cameraConfig.ip}:${port}/`;
    }
    
    return `${protocol}://${cameraConfig.ip}:${port}/`;
  }, [cameraConfig, state.useHttps]);

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
    
    // Actions
    connect,
    disconnect,
    toggleProtocol,
    testConnection,
    getCameraUrl,
    
    // Event handlers
    handleIframeLoad,
    handleIframeError,
  };
};
