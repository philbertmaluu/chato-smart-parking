import { useState, useEffect, useCallback, useRef } from 'react';
import { CameraDetectionService, PendingExitDetection } from '@/utils/api/camera-detection-service';
import { usePageVisibility } from './use-page-visibility';

interface UsePendingExitDetectionsOptions {
  enabled?: boolean;
  pollInterval?: number; // in milliseconds
  onNewDetection?: (detection: PendingExitDetection) => void;
}

export const usePendingExitDetections = (options: UsePendingExitDetectionsOptions = {}) => {
  const {
    enabled = true,
    pollInterval = 1500, // Default 1.5 seconds
    onNewDetection,
  } = options;

  const [pendingExitDetections, setPendingExitDetections] = useState<PendingExitDetection[]>([]);
  const [latestDetection, setLatestDetection] = useState<PendingExitDetection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousDetectionIdsRef = useRef<Set<number>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPageVisible = usePageVisibility();

  // Store latest values in refs to avoid dependency issues
  const enabledRef = useRef(enabled);
  const isPageVisibleRef = useRef(isPageVisible);
  const onNewDetectionRef = useRef(onNewDetection);

  // Update refs when values change
  useEffect(() => {
    enabledRef.current = enabled;
    isPageVisibleRef.current = isPageVisible;
    onNewDetectionRef.current = onNewDetection;
  }, [enabled, isPageVisible, onNewDetection]);

  // Fetch function - no polling noise
  const fetchPendingExitDetectionsInternal = useCallback(async () => {
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
      // Only read from DB-backed exit queue. Camera fetching is handled by the backend scheduler
      // (fetch:camera-data), which keeps the queue up to date.
      const detections = await CameraDetectionService.getPendingExitDetections();
      
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
        // No pending exit detections, clear latest
        setLatestDetection(null);
      }
      
      setPendingExitDetections(detections);
      // Don't update previousDetectionIdsRef here - only update when detection is actually processed
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch pending exit detections');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []); // No dependencies - uses refs instead

  const fetchPendingExitDetections = useCallback(async () => {
    try {
      await fetchPendingExitDetectionsInternal();
    } catch (err) {
      // Silently ignore cancellation errors and other errors
      // Only log critical errors that need attention
      if (err instanceof Error && err.name !== 'AbortError' && err.message !== 'Debounced call cancelled') {
        // Silent error handling - no console noise
      }
    }
  }, [fetchPendingExitDetectionsInternal]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchPendingExitDetections();
    }
  }, [enabled, fetchPendingExitDetections]);

  // Gentle polling - check for new exit detections every 2-3 seconds when page is visible
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
    fetchPendingExitDetections();

    // Set up gentle polling (every 2.5 seconds) to check for new exit detections
    // Only poll when page is visible to avoid unnecessary requests
    intervalRef.current = setInterval(() => {
      if (enabledRef.current && isPageVisibleRef.current) {
        fetchPendingExitDetectionsInternal();
      }
    }, 2500); // 2.5 seconds - gentle polling without being too aggressive

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isPageVisible, fetchPendingExitDetections, fetchPendingExitDetectionsInternal]);

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
      fetchPendingExitDetectionsInternal();
    }, 100);
  }, [fetchPendingExitDetectionsInternal]);

  return {
    pendingExitDetections,
    latestDetection,
    loading,
    error,
    fetchPendingExitDetections,
    clearLatestDetection,
  };
};

