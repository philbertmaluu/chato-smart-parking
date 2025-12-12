import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchCameraDetections,
  filterNewDetections,
  getLatestCameraIdForGate,
  setLatestCameraIdForGate,
  RawCameraDetection,
} from '@/utils/camera-local-client';
import { CameraDetectionService } from '@/utils/api/camera-detection-service';
import { usePageVisibility } from '@/hooks/use-page-visibility';
import { addLocalPendingDetection } from '@/utils/local-detection-storage';

interface CameraDevice {
  ip_address?: string | null;
  http_port?: number | null;
  computer_id?: number | null;
  username?: string | null;
  password?: string | null;
}

interface UseCameraLocalPollingOptions {
  gateId?: number | null;
  cameraDevice?: CameraDevice | null;
  enabled?: boolean;
  pollIntervalMs?: number;
  direction?: number | null;
  onNewDetections?: (detections: RawCameraDetection[]) => void;
  onPosted?: (detections: RawCameraDetection[]) => void;
}

// Enable frontend camera polling by default unless explicitly disabled
const featureEnabled =
  (process.env.NEXT_PUBLIC_CAMERA_FRONTEND_POLLING_ENABLED || 'true').toLowerCase() === 'true';
const defaultInterval =
  parseInt(process.env.NEXT_PUBLIC_CAMERA_FRONTEND_POLLING_INTERVAL_MS || '4000', 10) || 4000;
const defaultComputerId =
  parseInt(process.env.NEXT_PUBLIC_CAMERA_COMPUTER_ID || '1', 10) || 1;

export const useCameraLocalPolling = ({
  gateId,
  cameraDevice,
  enabled = true,
  pollIntervalMs,
  direction,
  onNewDetections,
  onPosted,
}: UseCameraLocalPollingOptions) => {
  const [lastDetection, setLastDetection] = useState<RawCameraDetection | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const isPageVisible = usePageVisibility();
  const abortRef = useRef<AbortController | null>(null);

  const effectiveInterval = pollIntervalMs || defaultInterval;
  const canRun =
    featureEnabled && enabled && Boolean(gateId) && Boolean(cameraDevice?.ip_address) && isPageVisible;

  const cameraIp = useMemo(() => cameraDevice?.ip_address || null, [cameraDevice]);
  const cameraHttpPort = useMemo(() => cameraDevice?.http_port || null, [cameraDevice]);
  const cameraComputerId = useMemo(
    () => cameraDevice?.computer_id || defaultComputerId,
    [cameraDevice]
  );
  const cameraUsername = useMemo(() => cameraDevice?.username || null, [cameraDevice]);
  const cameraPassword = useMemo(() => cameraDevice?.password || null, [cameraDevice]);

  const stopInflight = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const pollOnce = useCallback(async () => {
    if (!canRun || !gateId) return;

    stopInflight();
    const controller = new AbortController();
    abortRef.current = controller;

  const { detections, error } = await fetchCameraDetections({
      ip: cameraIp,
      httpPort: cameraHttpPort || undefined,
      computerId: cameraComputerId || undefined,
      username: cameraUsername || undefined,
      password: cameraPassword || undefined,
      signal: controller.signal,
    });

    if (error && error !== 'aborted') {
      setLastError(error);
    } else {
      setLastError(null);
    }

    if (!detections?.length) {
      return;
    }

    const latestBefore = getLatestCameraIdForGate(gateId);
    const newDetections = filterNewDetections(gateId, detections, false);

    if (newDetections.length === 0) {
      return;
    }

    // Store detections locally first - this will trigger useLocalPendingDetections to show the modal
    // The modal handler will post to backend after operator selects vehicle type
    try {
      const storedLocalDetections: any[] = [];
      
      for (const det of newDetections) {
        // Attach gate_id and direction before storing locally
        const detectionWithGate = {
          ...det,
          gate_id: gateId,
          direction: direction ?? det.direction ?? null,
        };
        
        // Store locally - this will be picked up by useLocalPendingDetections hook
        const localDetection = addLocalPendingDetection(gateId, detectionWithGate);
        storedLocalDetections.push(localDetection);
        
        // Update dedupe tracking to prevent re-processing same detection
        if (typeof det.id === 'number') {
          setLatestCameraIdForGate(gateId, det.id);
        }
      }
      
      // Set last detection for UI feedback
      setLastDetection(newDetections[newDetections.length - 1]);
      
      // Call callback for any UI updates
      onNewDetections?.(newDetections);
      
      // Note: We don't post to backend here anymore
      // The modal handler (vehicle-type-selection-modal) will post to backend
      // after operator selects the vehicle type
      
    } catch (storeError: any) {
      // Roll back dedupe to previous latest so we retry on next poll
      setLatestCameraIdForGate(gateId, latestBefore);
      setLastError(
        storeError instanceof Error ? storeError.message : 'Failed to store detections locally'
      );
    }
  }, [canRun, gateId, cameraIp, cameraHttpPort, cameraComputerId, cameraUsername, cameraPassword, direction, onNewDetections, stopInflight]);

  useEffect(() => {
    if (!canRun) {
      stopInflight();
      return;
    }

    const intervalId = setInterval(() => {
      pollOnce();
    }, effectiveInterval);

    // kick off immediately
    pollOnce();

    return () => {
      clearInterval(intervalId);
      stopInflight();
    };
  }, [canRun, effectiveInterval, pollOnce, stopInflight]);

  return {
    featureEnabled,
    lastDetection,
    lastError,
    pollOnce,
  };
};





