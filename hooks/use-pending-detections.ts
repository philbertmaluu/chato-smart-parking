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
      // Step 1: Check DB for existing pending detections FIRST (priority: process queue before fetching new)
      // This ensures existing queue is processed before fetching new detections
      console.log('[Polling] Checking DB for existing pending detections...');
      let detections = await CameraDetectionService.getPendingVehicleTypeDetections();
      console.log('[Polling] Received', detections.length, 'pending detections from DB');
      
      // Step 2: Only fetch from camera API if no pending detections exist in DB
      // This ensures queue is processed first before adding new detections
      if (detections.length === 0) {
        console.log('[Polling] No pending detections in queue, fetching from camera API...');
        try {
          const fetchResult = await CameraDetectionService.fetchAndStoreFromCamera();
          if (fetchResult.success && fetchResult.data) {
            const { fetched, stored } = fetchResult.data;
            console.log('[Polling] Camera poll result:', { fetched, stored });
            
            // After fetching from camera, check DB again for newly stored detections
            if (stored > 0) {
              const newDetections = await CameraDetectionService.getPendingVehicleTypeDetections();
              console.log('[Polling] Found', newDetections.length, 'pending detections after camera fetch');
              // Update detections with newly fetched ones
              detections = newDetections;
            }
          }
        } catch (cameraErr) {
          console.warn('[Polling] Camera fetch error:', cameraErr);
          // Continue even if camera fetch fails
        }
      } else {
        console.log('[Polling] Queue has', detections.length, 'pending detections, processing queue first (skipping camera fetch)');
      }
      
      // Always process the first (oldest) detection from queue if it exists
      // Compare against current latestDetection to avoid re-showing the same detection
      if (detections.length > 0) {
        const firstDetection = detections[0]; // Oldest (FIFO - backend returns ASC order)
        
        // Only show if it's different from what we're currently showing
        // This ensures we don't re-show the same detection, but we do show the next one in queue
        setLatestDetection((currentLatest) => {
          if (!currentLatest || currentLatest.id !== firstDetection.id) {
            console.log('[Polling] Processing detection from queue:', firstDetection.id, 'Plate:', firstDetection.numberplate, 'Total pending:', detections.length);
            // Signal activity to adaptive polling
            if (useAdaptiveRef.current) {
              adaptivePollingRef.current.signalActivity();
            }
            // Trigger callback to show modal
            onNewDetectionRef.current?.(firstDetection);
            return firstDetection;
          }
          // Same detection still pending, keep showing it
          return currentLatest;
        });
      } else {
        // No pending detections, clear latest
        console.log('[Polling] No pending detections in queue');
        setLatestDetection(null);
      }
      
      setPendingDetections(detections);
      // Don't update previousDetectionIdsRef here - only update when detection is actually processed
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
  // This allows the next detection in queue to be shown
  const clearLatestDetection = useCallback(() => {
    console.log('[Polling] Clearing latest detection, will fetch next in queue');
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

