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

interface CameraDevice {
  ip_address?: string | null;
  http_port?: number | null;
  computer_id?: number | null;
}

interface UseCameraLocalPollingOptions {
  gateId?: number | null;
  cameraDevice?: CameraDevice | null;
  enabled?: boolean;
  pollIntervalMs?: number;
  onNewDetections?: (detections: RawCameraDetection[]) => void;
}

const featureEnabled =
  (process.env.NEXT_PUBLIC_CAMERA_FRONTEND_POLLING_ENABLED || '').toLowerCase() === 'true';
const defaultInterval =
  parseInt(process.env.NEXT_PUBLIC_CAMERA_FRONTEND_POLLING_INTERVAL_MS || '4000', 10) || 4000;
const defaultComputerId =
  parseInt(process.env.NEXT_PUBLIC_CAMERA_COMPUTER_ID || '1', 10) || 1;

export const useCameraLocalPolling = ({
  gateId,
  cameraDevice,
  enabled = true,
  pollIntervalMs,
  onNewDetections,
}: UseCameraLocalPollingOptions) => {
  const [lastDetection, setLastDetection] = useState<RawCameraDetection | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
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

    // Attach gate_id before POST
    const payload = newDetections.map((det) => ({
      ...det,
      gate_id: gateId,
    }));

    try {
      setIsPosting(true);
      await CameraDetectionService.storeDetectionsFromBrowser(payload, gateId);
      // Commit dedupe only on success
      const maxId = newDetections[newDetections.length - 1].id;
      if (typeof maxId === 'number') {
        setLatestCameraIdForGate(gateId, maxId);
      }
      setLastDetection(newDetections[newDetections.length - 1]);
      onNewDetections?.(newDetections);
    } catch (postError: any) {
      // Roll back dedupe to previous latest so we retry on next poll
      setLatestCameraIdForGate(gateId, latestBefore);
      setLastError(
        postError instanceof Error ? postError.message : 'Failed to push detections to backend'
      );
    } finally {
      setIsPosting(false);
    }
  }, [canRun, gateId, cameraIp, cameraHttpPort, cameraComputerId, onNewDetections, stopInflight]);

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
    isPosting,
    pollOnce,
  };
};
