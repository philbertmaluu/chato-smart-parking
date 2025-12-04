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

  // Fetch function - simplified, no polling noise
  const fetchPendingDetectionsInternal = useCallback(async () => {
    if (!enabledRef.current) {
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
      // Only read from DB-backed queue. Camera fetching is handled by the backend scheduler
      // (fetch:camera-data), which keeps the queue up to date.
      const detections = await CameraDetectionService.getPendingVehicleTypeDetections();
      
      // Always process the first (oldest) detection from queue if it exists
      // Compare against current latestDetection to avoid re-showing the same detection
      if (detections.length > 0) {
        const firstDetection = detections[0]; // Oldest (FIFO - backend returns ASC order)
        
        // Only show if it's different from what we're currently showing
        // This ensures we don't re-show the same detection, but we do show the next one in queue
        setLatestDetection((currentLatest) => {
          if (!currentLatest || currentLatest.id !== firstDetection.id) {
            // Trigger callback to show modal
            onNewDetectionRef.current?.(firstDetection);
            return firstDetection;
          }
          // Same detection still pending, keep showing it
          return currentLatest;
        });
      } else {
        // No pending detections, clear latest
        setLatestDetection(null);
      }
      
      setPendingDetections(detections);
      // Don't update previousDetectionIdsRef here - only update when detection is actually processed
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
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
      // Silently ignore cancellation errors and other errors
      // Only log critical errors that need attention
      if (err instanceof Error && err.name !== 'AbortError' && err.message !== 'Debounced call cancelled') {
        // Silent error handling - no console noise
      }
    }
  }, [fetchPendingDetectionsInternal]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchPendingDetections();
    }
  }, [enabled, fetchPendingDetections]);

  // Gentle polling - check for new detections every 2-3 seconds when page is visible
  // Background processing is handled by Laravel scheduler (cron jobs)
  // This ensures new detections are shown to operator quickly without excessive noise
  useEffect(() => {
    if (!enabled || !isPageVisible) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch on mount
    fetchPendingDetections();

    // Set up gentle polling (every 2.5 seconds) to check for new detections
    // Only poll when page is visible to avoid unnecessary requests
    intervalRef.current = setInterval(() => {
      if (enabledRef.current && isPageVisibleRef.current) {
        fetchPendingDetectionsInternal();
      }
    }, 2500); // 2.5 seconds - gentle polling without being too aggressive

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isPageVisible, fetchPendingDetections, fetchPendingDetectionsInternal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Clear latest detection after it's been handled
  // This allows the next detection in queue to be shown
  const clearLatestDetection = useCallback(() => {
    setLatestDetection(null);
    // Clear the previous IDs ref so next detection can be shown
    previousDetectionIdsRef.current.clear();
    // Immediately fetch next detection in queue
    setTimeout(() => {
      fetchPendingDetectionsInternal();
    }, 100);
  }, [fetchPendingDetectionsInternal]);

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

