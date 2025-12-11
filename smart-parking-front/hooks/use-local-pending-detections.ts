/**
 * Hook to monitor and manage locally stored pending detections
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getOldestLocalPendingDetection,
  getLocalPendingDetectionsByGate,
  markLocalDetectionProcessed,
  markLocalDetectionFailed,
  LocalPendingDetection,
} from '@/utils/local-detection-storage';

interface UseLocalPendingDetectionsOptions {
  gateId?: number | null;
  enabled?: boolean;
  pollInterval?: number;
  onNewDetection?: (detection: LocalPendingDetection) => void;
}

export const useLocalPendingDetections = ({
  gateId,
  enabled = true,
  pollInterval = 2500,
  onNewDetection,
}: UseLocalPendingDetectionsOptions) => {
  const [latestDetection, setLatestDetection] = useState<LocalPendingDetection | null>(null);
  const [pendingDetections, setPendingDetections] = useState<LocalPendingDetection[]>([]);
  const enabledRef = useRef(enabled);
  const onNewDetectionRef = useRef(onNewDetection);
  const previousDetectionIdRef = useRef<string | null>(null);

  // Update refs when props change
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    onNewDetectionRef.current = onNewDetection;
  }, [onNewDetection]);

  const checkLocalDetections = useCallback(() => {
    if (!enabledRef.current) return;

    try {
      // Get oldest pending detection for the gate
      const oldest = getOldestLocalPendingDetection(gateId || undefined);
      
      // Show new detection if it's different from the last one shown
      if (oldest && oldest.id !== previousDetectionIdRef.current) {
        setLatestDetection(oldest);
        previousDetectionIdRef.current = oldest.id;
        // Trigger callback to show modal
        onNewDetectionRef.current?.(oldest);
      } else if (!oldest) {
        // No pending detections - reset tracking
        setLatestDetection(null);
        previousDetectionIdRef.current = null;
      }

      // Update pending list
      const allPending = gateId 
        ? getLocalPendingDetectionsByGate(gateId)
        : getOldestLocalPendingDetection() 
          ? [getOldestLocalPendingDetection()!]
          : [];
      setPendingDetections(allPending);
    } catch (error) {
      console.error('[useLocalPendingDetections] Error checking local detections:', error);
    }
  }, [gateId]);

  // Poll for local detections
  useEffect(() => {
    if (!enabled) return;

    // Check immediately
    checkLocalDetections();

    // Set up polling interval
    const intervalId = setInterval(checkLocalDetections, pollInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, pollInterval, checkLocalDetections]);

  // Also check when gate changes
  useEffect(() => {
    if (enabled && gateId) {
      checkLocalDetections();
    }
  }, [gateId, enabled, checkLocalDetections]);

  const clearLatestDetection = useCallback(() => {
    setLatestDetection(null);
    previousDetectionIdRef.current = null;
  }, []);

  return {
    latestDetection,
    pendingDetections,
    checkLocalDetections,
    clearLatestDetection,
    markProcessed: markLocalDetectionProcessed,
    markFailed: markLocalDetectionFailed,
  };
};

