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
  const shownDetectionIdsRef = useRef<Set<number>>(new Set()); // Track IDs that have been shown to prevent re-showing
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
      
      // Debug logging to help troubleshoot
      console.log('[usePendingDetections] Fetched detections:', {
        count: detections.length,
        detections: detections.map(d => ({ id: d.id, plate: d.numberplate, status: d.processing_status, gate_id: d.gate_id })),
        enabled: enabledRef.current,
        isPageVisible: isPageVisibleRef.current
      });
      
      // Always process the first (oldest) detection from queue if it exists
      // Compare against current latestDetection and shown IDs to avoid re-showing the same detection
      if (detections.length > 0) {
        // Find the first detection that hasn't been shown yet
        // This allows us to skip already-shown detections and move to new ones
        let detectionToShow = null;
        for (const detection of detections) {
          if (!shownDetectionIdsRef.current.has(detection.id)) {
            detectionToShow = detection;
            break;
          }
        }
        
        if (detectionToShow) {
          console.log('[usePendingDetections] New detection found, triggering callback:', {
            id: detectionToShow.id,
            plate: detectionToShow.numberplate,
            gate_id: detectionToShow.gate_id,
          });
          
          setLatestDetection((currentLatest) => {
            if (!currentLatest || currentLatest.id !== detectionToShow.id) {
              // Mark as shown BEFORE triggering callback to prevent duplicate triggers
              shownDetectionIdsRef.current.add(detectionToShow.id);
              // Trigger callback to show modal
              onNewDetectionRef.current?.(detectionToShow);
              return detectionToShow;
            }
            // Same detection still pending, keep showing it
            return currentLatest;
          });
        } else {
          // All detections in queue have been shown - they're still pending
          // This means the operator hasn't processed them yet, or they're stuck
          console.log('[usePendingDetections] All detections in queue have been shown, waiting for processing:', {
            queueSize: detections.length,
            shownIds: Array.from(shownDetectionIdsRef.current),
          });
          
          // Clear latestDetection if it's not in the current queue (it was processed)
          setLatestDetection((currentLatest) => {
            if (currentLatest) {
              const stillInQueue = detections.some(d => d.id === currentLatest.id);
              if (!stillInQueue) {
                // Detection was processed and removed from queue - clear it
                shownDetectionIdsRef.current.delete(currentLatest.id);
                console.log('[usePendingDetections] Detection was processed, removed from shown IDs:', currentLatest.id);
                return null;
              }
            }
            return currentLatest;
          });
        }
      } else {
        // No pending detections, clear latest and reset shown IDs
        console.log('[usePendingDetections] No pending detections found - queue is empty');
        setLatestDetection(null);
        // Clear shown IDs when queue is empty - all detections have been processed
        shownDetectionIdsRef.current.clear();
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
  // IMPORTANT: Remove the detection ID from shownDetectionIdsRef when it's processed
  // This ensures that if the detection is still in the queue (shouldn't happen, but just in case),
  // it won't block other detections, and if it's processed and removed from queue, we can show new ones
  const clearLatestDetection = useCallback(() => {
    const currentLatest = latestDetection;
    setLatestDetection(null);
    // Clear the previous IDs ref so next detection can be shown
    previousDetectionIdsRef.current.clear();
    // Remove the processed detection ID from shownDetectionIdsRef
    // This allows the next detection in queue to be shown immediately
    if (currentLatest?.id) {
      shownDetectionIdsRef.current.delete(currentLatest.id);
      console.log('[usePendingDetections] Removed processed detection from shown IDs:', currentLatest.id);
    }
    // Immediately fetch next detection in queue
    setTimeout(() => {
      fetchPendingDetectionsInternal();
    }, 100);
  }, [fetchPendingDetectionsInternal, latestDetection]);

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

