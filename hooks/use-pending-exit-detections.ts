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
      // Step 1: Poll camera API to fetch new detections and store them in DB
      // This compares camera detections with DB and stores new ones
      console.log('[Exit Polling] Fetching from camera API and storing new detections...');
      try {
        const fetchResult = await CameraDetectionService.fetchAndStoreFromCamera();
        if (fetchResult.success && fetchResult.data) {
          const { fetched, stored } = fetchResult.data;
          console.log('[Exit Polling] Camera poll result:', { fetched, stored });
        }
      } catch (cameraErr) {
        console.warn('[Exit Polling] Camera fetch error (continuing with DB check):', cameraErr);
        // Continue even if camera fetch fails - still check DB for existing pending detections
      }

      // Step 2: Check for pending exit detections
      console.log('[Exit Polling] Fetching pending exit detections from DB...');
      const detections = await CameraDetectionService.getPendingExitDetections();
      console.log('[Exit Polling] Received', detections.length, 'exit detections');
      
      // Check for new detections
      const currentIds = new Set(detections.map(d => d.id));
      const previousIds = previousDetectionIdsRef.current;
      const isInitialLoad = previousIds.size === 0;
      
      // Find new detections (or all detections on initial load)
      const detectionsToShow = isInitialLoad 
        ? detections
        : detections.filter(d => !previousIds.has(d.id));
      
      if (detectionsToShow.length > 0) {
        console.log('[Exit Polling] Found', detectionsToShow.length, 'new exit detection(s)');

        // Get the most recent detection
        const latest = detectionsToShow.sort((a, b) => 
          new Date(b.detection_timestamp).getTime() - new Date(a.detection_timestamp).getTime()
        )[0];
        
        setLatestDetection(latest);
        onNewDetectionRef.current?.(latest);
      } else if (isInitialLoad && detections.length === 0) {
        setLatestDetection(null);
      }
      
      setPendingExitDetections(detections);
      previousDetectionIdsRef.current = currentIds;
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
  const clearLatestDetection = useCallback(() => {
    setLatestDetection(null);
  }, []);

  return {
    pendingExitDetections,
    latestDetection,
    loading,
    error,
    fetchPendingExitDetections,
    clearLatestDetection,
  };
};

