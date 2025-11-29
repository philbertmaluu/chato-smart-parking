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

  // Fetch function
  const fetchPendingExitDetectionsInternal = useCallback(async () => {
    if (!enabledRef.current) {
      console.log('[Exit Polling] Skipped - enabled:', enabledRef.current);
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
      // Step 1: Check DB for existing pending exit detections FIRST (priority: process queue before fetching new)
      // This ensures existing queue is processed before fetching new detections
      console.log('[Exit Polling] Checking DB for existing pending exit detections...');
      let detections = await CameraDetectionService.getPendingExitDetections();
      console.log('[Exit Polling] Received', detections.length, 'pending exit detections from DB');
      
      // Step 2: Only fetch from camera API if no pending exit detections exist in DB
      // This ensures queue is processed first before adding new detections
      if (detections.length === 0) {
        console.log('[Exit Polling] No pending exit detections in queue, fetching from camera API...');
        try {
          const fetchResult = await CameraDetectionService.fetchAndStoreFromCamera();
          if (fetchResult.success && fetchResult.data) {
            const { fetched, stored } = fetchResult.data;
            console.log('[Exit Polling] Camera poll result:', { fetched, stored });
            
            // After fetching from camera, check DB again for newly stored detections
            if (stored > 0) {
              const newDetections = await CameraDetectionService.getPendingExitDetections();
              console.log('[Exit Polling] Found', newDetections.length, 'pending exit detections after camera fetch');
              // Update detections with newly fetched ones
              detections = newDetections;
            }
          }
        } catch (cameraErr) {
          console.warn('[Exit Polling] Camera fetch error:', cameraErr);
          // Continue even if camera fetch fails
        }
      } else {
        console.log('[Exit Polling] Queue has', detections.length, 'pending exit detections, processing queue first (skipping camera fetch)');
      }
      
      // Always process the first (oldest) detection from queue if it exists
      // Compare against current latestDetection to avoid re-showing the same detection
      if (detections.length > 0) {
        const firstDetection = detections[0]; // Oldest (FIFO - backend returns ASC order)
        
        // Only show if it's different from what we're currently showing
        // This ensures we don't re-show the same detection, but we do show the next one in queue
        setLatestDetection((currentLatest) => {
          if (!currentLatest || currentLatest.id !== firstDetection.id) {
            console.log('[Exit Polling] Processing exit detection from queue:', firstDetection.id, 'Plate:', firstDetection.numberplate, 'Total pending:', detections.length);
            // Trigger callback to show modal
            onNewDetectionRef.current?.(firstDetection);
            return firstDetection;
          }
          // Same detection still pending, keep showing it
          return currentLatest;
        });
      } else {
        // No pending exit detections, clear latest
        console.log('[Exit Polling] No pending exit detections in queue');
        setLatestDetection(null);
      }
      
      setPendingExitDetections(detections);
      // Don't update previousDetectionIdsRef here - only update when detection is actually processed
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        console.log('[Exit Polling] Request cancelled');
        return;
      }
      console.error('[Exit Polling] Error:', err);
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
      // Silently ignore cancellation errors
      if (err instanceof Error && err.message !== 'Debounced call cancelled') {
        console.error('Error fetching pending exit detections:', err);
      }
    }
  }, [fetchPendingExitDetectionsInternal]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchPendingExitDetections();
    }
  }, [enabled, fetchPendingExitDetections]);

  // Set up polling with fixed interval
  // Polling continues even when page is not visible to keep detecting new entries/exits
  useEffect(() => {
    if (!enabled) {
      console.log('[Exit Polling] Stopping - enabled:', enabled);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log('[Exit Polling] Starting with interval:', pollInterval, 'ms');

    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      console.log('[Exit Polling] Interval tick - fetching...');
      fetchPendingExitDetections();
    }, pollInterval);

    // Also fetch immediately when enabled/visible
    console.log('[Exit Polling] Initial fetch...');
    fetchPendingExitDetections();

    return () => {
      console.log('[Exit Polling] Cleanup - clearing interval');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isPageVisible, pollInterval, fetchPendingExitDetections]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[Exit Polling] Component unmounting - cleanup');
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
    console.log('[Exit Polling] Clearing latest exit detection, will fetch next in queue');
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

