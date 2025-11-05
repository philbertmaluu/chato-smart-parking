"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface StreamStats {
  fps: number;
  uptime: string;
}

export interface CameraCredentials {
  username: string;
  password: string;
  ip: string;
  port: string;
  path: string;
}

export type StreamType = '' | 'mjpeg' | 'optimized' | 'snapshot' | 'hls';
export type StreamStatus = 'ready' | 'starting' | 'live' | 'error' | 'stopped';

export interface StreamState {
  streamActive: boolean;
  currentStreamType: StreamType;
  streamStatus: StreamStatus;
  error: string | null;
  stats: StreamStats;
}

export interface StreamResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const useStream = () => {
  // State management
  const [streamActive, setStreamActive] = useState(false);
  const [currentStreamType, setCurrentStreamType] = useState<StreamType>('');
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('ready');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StreamStats>({ fps: 0, uptime: '00:00' });

  // Refs for cleanup and state tracking
  const streamStartTime = useRef<number | null>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const statsInterval = useRef<NodeJS.Timeout | null>(null);
  const streamTimeout = useRef<NodeJS.Timeout | null>(null);
  const isAttemptingStream = useRef<boolean>(false);

  // Camera credentials - you can make this configurable
  const cameraCredentials: CameraCredentials = {
    username: 'admin',
    password: 'Password123!',
    ip: '192.168.0.109',
    port: '554',
    path: '/stream'
  };

  // Utility functions
  const clearAllIntervals = useCallback(() => {
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
      refreshInterval.current = null;
    }
    if (statsInterval.current) {
      clearInterval(statsInterval.current);
      statsInterval.current = null;
    }
    if (streamTimeout.current) {
      clearTimeout(streamTimeout.current);
      streamTimeout.current = null;
    }
  }, []);

  const resetStreamState = useCallback(() => {
    setStreamActive(false);
    setCurrentStreamType('');
    setStreamStatus('stopped');
    setError(null);
    isAttemptingStream.current = false;
    streamStartTime.current = null;
    setStats({ fps: 0, uptime: '00:00' });
  }, []);

  const updateStreamStats = useCallback(() => {
    if (streamActive && streamStartTime.current) {
      const elapsed = Math.floor((Date.now() - streamStartTime.current) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      const uptimeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      let fps = 0;
      switch (currentStreamType) {
        case 'mjpeg':
        case 'optimized':
          fps = 1;
          break;
        case 'snapshot':
          fps = 0.5;
          break;
        case 'hls':
          fps = 25; // Assuming standard HLS
          break;
        default:
          fps = 0;
      }

      setStats({ fps, uptime: uptimeString });
    } else {
      setStats({ fps: 0, uptime: '00:00' });
    }
  }, [streamActive, currentStreamType]);

  const startStatsUpdates = useCallback(() => {
    if (statsInterval.current) clearInterval(statsInterval.current);
    statsInterval.current = setInterval(updateStreamStats, 1000);
  }, [updateStreamStats]);

  // Stream management functions
  const startMJPEGStream = useCallback(async (container: HTMLElement): Promise<StreamResponse> => {
    if (streamActive) {
      return {
        success: false,
        message: 'Please stop the current stream first'
      };
    }

    if (isAttemptingStream.current) {
      return {
        success: false,
        message: 'Stream connection already in progress. Please wait.'
      };
    }

    isAttemptingStream.current = true;
    setStreamStatus('starting');
    setError(null);
    
    let hasTriedFallback = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    const attemptStream = (url: string, isFallback: boolean = false): Promise<StreamResponse> => {
      return new Promise((resolve) => {
        const streamImg = document.createElement('img');
        
        // Configure image element
        streamImg.style.width = '100%';
        streamImg.style.height = 'auto';
        streamImg.className = 'rounded-lg';
        streamImg.crossOrigin = 'anonymous';
        streamImg.loading = 'eager';
        streamImg.decoding = 'sync';
        
        // Set up timeout
        if (streamTimeout.current) clearTimeout(streamTimeout.current);
        streamTimeout.current = setTimeout(() => {
          if (streamImg.src && !streamImg.complete) {
            streamImg.onerror?.(new Event('error'));
          }
        }, 10000);
        
        // Set up load handler
        streamImg.onload = () => {
          if (streamTimeout.current) clearTimeout(streamTimeout.current);
          setStreamActive(true);
          setCurrentStreamType(isFallback ? 'mjpeg' : 'optimized');
          setStreamStatus('live');
          streamStartTime.current = Date.now();
          setError(null);
          isAttemptingStream.current = false;
          
          container.innerHTML = '';
          container.appendChild(streamImg);
          startStatsUpdates();
          
          resolve({
            success: true,
            message: 'MJPEG stream started successfully'
          });
        };
        
        // Set up error handler
        streamImg.onerror = () => {
          if (streamTimeout.current) clearTimeout(streamTimeout.current);
          
          if (!isAttemptingStream.current) {
            resolve({
              success: false,
              message: 'Stream attempt cancelled'
            });
            return;
          }
          
          retryCount++;
          
          if (retryCount <= maxRetries) {
            if (!hasTriedFallback) {
              hasTriedFallback = true;
              setError(`Optimized stream failed. Trying MJPEG fallback... (Attempt ${retryCount}/${maxRetries})`);
              setTimeout(() => {
                attemptStream(`/api/toll-v1/stream/mjpeg/camera1?${Date.now()}`, true)
                  .then(resolve);
              }, 1000);
            } else {
              setError(`MJPEG stream failed. Retrying... (Attempt ${retryCount}/${maxRetries})`);
              setTimeout(() => {
                attemptStream(`/api/toll-v1/stream/mjpeg/camera1?${Date.now()}`, true)
                  .then(resolve);
              }, 1000);
            }
          } else {
            const errorMessage = 'Stream connection failed after multiple attempts. Please check camera connection and try again.';
            setError(errorMessage);
            setStreamStatus('error');
            setStreamActive(false);
            isAttemptingStream.current = false;
            container.innerHTML = '<div class="text-center text-red-500 p-4">Stream connection failed</div>';
            
            resolve({
              success: false,
              message: errorMessage
            });
          }
        };
        
        // Start the stream
        streamImg.src = url;
      });
    };
    
    return attemptStream(`/api/toll-v1/stream/optimized/camera1?${Date.now()}`);
  }, [streamActive, startStatsUpdates]);

  const startSnapshotStream = useCallback(async (container: HTMLElement): Promise<StreamResponse> => {
    if (streamActive && currentStreamType !== 'snapshot') {
      return {
        success: false,
        message: 'Please stop the current stream first'
      };
    }

    setStreamStatus('starting');
    setError(null);

    const testImg = document.createElement('img');
    
    // Set up timeout
    if (streamTimeout.current) clearTimeout(streamTimeout.current);
    streamTimeout.current = setTimeout(() => {
      if (testImg.src && !testImg.complete) {
        testImg.onerror?.(new Event('error'));
      }
    }, 10000);
    
    return new Promise((resolve) => {
      testImg.onload = () => {
        if (streamTimeout.current) clearTimeout(streamTimeout.current);
        setStreamActive(true);
        setCurrentStreamType('snapshot');
        setStreamStatus('live');
        streamStartTime.current = Date.now();
        setError(null);

        container.innerHTML = '';
        testImg.style.width = '100%';
        testImg.style.height = 'auto';
        testImg.className = 'rounded-lg';
        container.appendChild(testImg);

        // Start refresh interval with error handling
        if (refreshInterval.current) clearInterval(refreshInterval.current);
        let consecutiveErrors = 0;
        const maxConsecutiveErrors = 5;
        
        refreshInterval.current = setInterval(() => {
          if (streamActive && currentStreamType === 'snapshot') {
            const img = document.createElement('img');
            img.src = `/stream/snapshot/camera1?t=${Date.now()}`;
            img.style.width = '100%';
            img.style.height = 'auto';
            img.className = 'rounded-lg';

            img.onload = () => {
              consecutiveErrors = 0;
              const currentContainer = container;
              if (currentContainer.firstChild) {
                currentContainer.replaceChild(img, currentContainer.firstChild);
              }
            };
            
            img.onerror = () => {
              consecutiveErrors++;
              console.warn(`Snapshot update failed (${consecutiveErrors}/${maxConsecutiveErrors})`);
              
              if (consecutiveErrors >= maxConsecutiveErrors) {
                if (refreshInterval.current) {
                  clearInterval(refreshInterval.current);
                  refreshInterval.current = null;
                }
                setError('Too many consecutive snapshot failures. Stopping stream.');
                setStreamStatus('error');
                setStreamActive(false);
              }
            };
          }
        }, 1500);

        startStatsUpdates();
        
        resolve({
          success: true,
          message: 'Snapshot stream started successfully'
        });
      };

      testImg.onerror = () => {
        if (streamTimeout.current) clearTimeout(streamTimeout.current);
        const errorMessage = 'Failed to capture snapshots. Check camera connection.';
        setError(errorMessage);
        setStreamStatus('error');
        setStreamActive(false);
        
        resolve({
          success: false,
          message: errorMessage
        });
      };

      testImg.src = `/stream/snapshot/camera1?t=${Date.now()}`;
    });
  }, [streamActive, currentStreamType, startStatsUpdates]);

  const startHLSStream = useCallback(async (container: HTMLElement): Promise<StreamResponse> => {
    if (streamActive) {
      return {
        success: false,
        message: 'Please stop the current stream first'
      };
    }

    setStreamStatus('starting');
    setError(null);

    try {
      const response = await fetch('/api/toll-v1/stream/hls/camera1');
      
      if (!response.ok) {
        throw new Error('HLS stream initialization failed');
      }
      
      const blob = await response.blob();
      
      // HLS stream is ready, set up video player
      const video = document.createElement('video');
      video.controls = true;
      video.autoplay = true;
      video.muted = true;
      video.style.width = '100%';
      video.style.height = 'auto';
      video.className = 'rounded-lg';

      // Load HLS.js if available
      if (typeof window !== 'undefined' && (window as any).Hls && (window as any).Hls.isSupported()) {
        const hls = new (window as any).Hls();
        hls.loadSource('/api/toll-v1/stream/hls/camera1');
        hls.attachMedia(video);

        hls.on((window as any).Hls.Events.MEDIA_ATTACHED, () => {
          console.log('HLS media attached');
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = '/api/toll-v1/stream/hls/camera1';
      } else {
        throw new Error('HLS not supported in this browser');
      }

      container.innerHTML = '';
      container.appendChild(video);

      setStreamActive(true);
      setCurrentStreamType('hls');
      setStreamStatus('live');
      streamStartTime.current = Date.now();
      startStatsUpdates();

      return {
        success: true,
        message: 'HLS stream started successfully'
      };
    } catch (err) {
      const errorMessage = 'HLS stream failed. Please try MJPEG or Snapshot stream instead.';
      setError(errorMessage);
      setStreamStatus('error');
      setStreamActive(false);
      container.innerHTML = '<div class="text-center text-red-500 p-4">HLS stream failed. Try another stream type.</div>';
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [streamActive, startStatsUpdates]);

  const captureSnapshot = useCallback(async (container: HTMLElement): Promise<StreamResponse> => {
    setStreamStatus('starting');
    setError(null);

    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        setError(null);
        
        if (!streamActive) {
          container.innerHTML = '';
          img.style.width = '100%';
          img.style.height = 'auto';
          img.className = 'rounded-lg';
          container.appendChild(img);
          
          setStreamStatus('ready');
          setTimeout(() => setStreamStatus('ready'), 3000);
        }
        
        resolve({
          success: true,
          message: 'Snapshot captured successfully'
        });
      };

      img.onerror = () => {
        const errorMessage = 'Failed to capture snapshot';
        setError(errorMessage);
        setStreamStatus('error');
        
        resolve({
          success: false,
          message: errorMessage
        });
      };

      img.src = `/stream/snapshot/camera1?t=${Date.now()}`;
    });
  }, [streamActive]);

  const stopStream = useCallback(async (): Promise<StreamResponse> => {
    if (!streamActive) {
      return {
        success: false,
        message: 'No active stream to stop'
      };
    }

    clearAllIntervals();

    // Stop HLS stream on server if needed
    if (currentStreamType === 'hls') {
      try {
        await fetch('/api/toll-v1/stream/hls/camera1/stop', {
          method: 'POST'
        });
      } catch (error) {
        console.log('HLS stop error:', error);
      }
    }

    resetStreamState();
    
    return {
      success: true,
      message: 'Stream stopped successfully'
    };
  }, [streamActive, currentStreamType, clearAllIntervals, resetStreamState]);

  const testConnection = useCallback(async (): Promise<StreamResponse> => {
    setError(null);
    
    try {
      const response = await fetch('/camera/test-connection', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setError(null);
        return {
          success: true,
          message: 'Connection test successful'
        };
      } else {
        const errorMessage = `Connection test failed: ${data.message}`;
        setError(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (err) {
      const errorMessage = 'Connection test error';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  }, []);

  const copyStreamURL = useCallback(async (): Promise<StreamResponse> => {
    const rtspUrl = `rtsp://${cameraCredentials.username}:${encodeURIComponent(cameraCredentials.password)}@${cameraCredentials.ip}:${cameraCredentials.port}${cameraCredentials.path}`;

    try {
      await navigator.clipboard.writeText(rtspUrl);
      setError(null);
      return {
        success: true,
        message: 'Stream URL copied to clipboard'
      };
    } catch (err) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = rtspUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setError(null);
        return {
          success: true,
          message: 'Stream URL copied to clipboard'
        };
      } catch (fallbackErr) {
        const errorMessage = 'Failed to copy stream URL';
        setError(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }
    }
  }, [cameraCredentials]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllIntervals();
    };
  }, [clearAllIntervals]);

  return {
    // State
    streamActive,
    currentStreamType,
    streamStatus,
    error,
    stats,
    cameraCredentials,
    
    // Stream management
    startMJPEGStream,
    startSnapshotStream,
    startHLSStream,
    captureSnapshot,
    stopStream,
    
    // Utility functions
    testConnection,
    copyStreamURL,
  };
};
