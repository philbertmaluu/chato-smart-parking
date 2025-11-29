import { useState, useEffect, useCallback, useRef } from 'react';
import { CameraDetectionService, PendingVehicleTypeDetection } from '@/utils/api/camera-detection-service';
import { useAdaptivePolling } from './use-adaptive-polling';
import { usePageVisibility } from './use-page-visibility';

interface UsePendingDetectionsOptions {
  enabled?: boolean;
  pollInterval?: number; // in milliseconds (deprecated - now uses adaptive polling)
  onNewDetection?: (detection: PendingVehicleTypeDetection) => void;
  useAdaptive?: boolean; // Enable adaptive polling (default: true)
}

export const usePendingDetections = (options: UsePendingDetectionsOptions = {}) => {
  const {
    enabled = true,
    pollInterval, // Deprecated but kept for backward compatibility
    onNewDetection,
    useAdaptive = true,
  } = options;

  const [pendingDetections, setPendingDetections] = useState<PendingVehicleTypeDetection[]>([]);
  const [latestDetection, setLatestDetection] = useState<PendingVehicleTypeDetection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousDetectionIdsRef = useRef<Set<number>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPageVisible = usePageVisibility();

  // Use adaptive polling if enabled, otherwise use fixed interval
  // Default to 1.5 seconds as requested
  const defaultInterval = pollInterval || 1500; // 1.5 seconds
  const adaptivePolling = useAdaptivePolling({
    baseInterval: defaultInterval,
    fastInterval: 1000, // 1 second for activity
    slowInterval: 2000, // 2 seconds for quiet periods (not too slow)
  });

  const currentPollInterval = useAdaptive 
    ? adaptivePolling.currentInterval 
    : defaultInterval;

  // Store latest values in refs to avoid dependency issues
  const enabledRef = useRef(enabled);
  const isPageVisibleRef = useRef(isPageVisible);
  const useAdaptiveRef = useRef(useAdaptive);
  const onNewDetectionRef = useRef(onNewDetection);
  const adaptivePollingRef = useRef(adaptivePolling);

  // Update refs when values change
  useEffect(() => {
    enabledRef.current = enabled;
    isPageVisibleRef.current = isPageVisible;
    useAdaptiveRef.current = useAdaptive;
    onNewDetectionRef.current = onNewDetection;
    adaptivePollingRef.current = adaptivePolling;
  }, [enabled, isPageVisible, useAdaptive, onNewDetection, adaptivePolling]);

  // Fetch function - simplified and more reliable
  const fetchPendingDetectionsInternal = useCallback(async () => {
    if (!enabledRef.current) {
      console.log('[Polling] Skipped - enabled:', enabledRef.current);
      return;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);
    
    try {
      // Step 1: Poll camera API to fetch new detections and store them in DB
      // This compares camera detections with DB and stores new ones
      console.log('[Polling] Fetching from camera API and storing new detections...');
      try {
        const fetchResult = await CameraDetectionService.fetchAndStoreFromCamera();
        if (fetchResult.success && fetchResult.data) {
          const { fetched, stored } = fetchResult.data;
          console.log('[Polling] Camera poll result:', { fetched, stored });
        }
      } catch (cameraErr) {
        console.warn('[Polling] Camera fetch error (continuing with DB check):', cameraErr);
        // Continue even if camera fetch fails - still check DB for existing pending detections
      }

      // Step 2: Check for pending detections that need vehicle type selection
      console.log('[Polling] Fetching pending detections from DB...');
      const detections = await CameraDetectionService.getPendingVehicleTypeDetections();
      console.log('[Polling] Received', detections.length, 'detections');
      
      // Check for new detections
      const currentIds = new Set(detections.map(d => d.id));
      const previousIds = previousDetectionIdsRef.current;
      const isInitialLoad = previousIds.size === 0;
      
      // Find new detections (or all detections on initial load)
      const detectionsToShow = isInitialLoad 
        ? detections
        : detections.filter(d => !previousIds.has(d.id));
      
      if (detectionsToShow.length > 0) {
        console.log('[Polling] Found', detectionsToShow.length, 'new detection(s)');
        // Signal activity to adaptive polling
        if (useAdaptiveRef.current) {
          adaptivePollingRef.current.signalActivity();
        }

        // Get the most recent detection
        const latest = detectionsToShow.sort((a, b) => 
          new Date(b.detection_timestamp).getTime() - new Date(a.detection_timestamp).getTime()
        )[0];
        
        setLatestDetection(latest);
        onNewDetectionRef.current?.(latest);
      } else if (isInitialLoad && detections.length === 0) {
        setLatestDetection(null);
      }
      
      setPendingDetections(detections);
      previousDetectionIdsRef.current = currentIds;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        console.log('[Polling] Request cancelled');
        return;
      }
      console.error('[Polling] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pending detections');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []); // No dependencies - uses refs instead

  // Direct fetch without debouncing for more reliable polling
  // Debouncing was causing delays that prevented timely detection
  const fetchPendingDetections = useCallback(async () => {
    try {
      await fetchPendingDetectionsInternal();
    } catch (err) {
      // Silently ignore cancellation errors
      if (err instanceof Error && err.message !== 'Debounced call cancelled') {
        console.error('Error fetching pending detections:', err);
      }
    }
  }, [fetchPendingDetectionsInternal]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchPendingDetections();
    }
  }, [enabled, fetchPendingDetections]);

  // Set up polling with adaptive interval
  // Polling continues even when page is not visible to keep detecting new entries/exits
  useEffect(() => {
    if (!enabled) {
      console.log('[Polling] Stopping - enabled:', enabled);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log('[Polling] Starting with interval:', currentPollInterval, 'ms');

    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      console.log('[Polling] Interval tick - fetching...');
      fetchPendingDetections();
    }, currentPollInterval);

    // Also fetch immediately when enabled/visible
    console.log('[Polling] Initial fetch...');
    fetchPendingDetections();

    return () => {
      console.log('[Polling] Cleanup - clearing interval');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isPageVisible, currentPollInterval, fetchPendingDetections]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[Polling] Component unmounting - cleanup');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Clear latest detection after it's been handled
  const clearLatestDetection = useCallback(() => {
    setLatestDetection(null);
  }, []);

  return {
    pendingDetections,
    latestDetection,
    loading,
    error,
    fetchPendingDetections,
    clearLatestDetection,
    pollingSpeed: useAdaptive ? adaptivePolling.currentSpeed : 'normal',
  };
};

