import { zktecoConfig } from '@/utils/config/zkteco-config';

export type RawCameraDetection = Record<string, any> & {
  id?: number;
  numberplate?: string;
  timestamp?: string;
  utctime?: string;
  gate_id?: number;
};

export interface CameraFetchOptions {
  ip?: string | null;
  httpPort?: number | null;
  computerId?: number;
  fromDate?: string; // ISO string; defaults to 2000-01-01
  signal?: AbortSignal;
}

/**
 * Build the ZKTeco detection endpoint URL.
 * Matches backend format: /edge/cgi-bin/vparcgi.cgi?oper=jsonlastresults
 */
export const buildCameraDetectionUrl = ({
  ip,
  httpPort,
  computerId = 1,
  fromDate,
}: CameraFetchOptions): string => {
  const config = zktecoConfig.getConfig();
  const cameraIp = ip || config.ip;
  const port = httpPort || config.httpPort || 80;
  const dateParam = (fromDate ? new Date(fromDate) : new Date('2000-01-01T00:00:00Z'))
    .toISOString()
    .replace('Z', '');
  const timestamp = Date.now();

  return `http://${cameraIp}:${port}/edge/cgi-bin/vparcgi.cgi?computerid=${computerId}&oper=jsonlastresults&dd=${encodeURIComponent(
    dateParam
  )}&_=${timestamp}`;
};

/**
 * Fetch detection logs directly from the camera.
 * Returns an array; errors are swallowed and surfaced as empty results with message.
 */
export const fetchCameraDetections = async (
  options: CameraFetchOptions
): Promise<{ detections: RawCameraDetection[]; error?: string }> => {
  try {
    const isBrowser = typeof window !== 'undefined';
    const isTauri =
      isBrowser &&
      (((window as any).__TAURI__ !== undefined) ||
        window.location.protocol.includes('tauri'));
    const proxyEnabled =
      isBrowser &&
      !isTauri &&
      process.env.NEXT_PUBLIC_TAURI_BUILD !== 'true' &&
      process.env.NEXT_PUBLIC_USE_CAMERA_PROXY !== 'false';

    // Try proxy first (browser/dev) to avoid CORS; fall back to direct
    if (proxyEnabled && options.ip) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const params = new URLSearchParams({
          ip: options.ip,
          port: (options.httpPort ?? '').toString(),
          computerId: (options.computerId ?? '').toString(),
          fromDate: options.fromDate ?? '',
        });
        const proxyUrl = `/api/camera-detections?${params.toString()}`;
        const resp = await fetch(proxyUrl, {
          method: 'GET',
          cache: 'no-store',
          signal: options.signal || controller.signal,
        });
        clearTimeout(timeoutId);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data)) {
            return { detections: data };
          }
          if (data?.error) {
            // fall through to direct
            console.warn('[Camera] Proxy returned error, falling back to direct:', data.error);
          }
        }
      } catch (err) {
        clearTimeout(timeoutId);
        // fall through to direct fetch on proxy failure/timeout/CORS
      }
    }

    // Add a short timeout to avoid hanging when camera is unreachable
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    const signal = options.signal || controller.signal;

    const url = buildCameraDetectionUrl(options);
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { detections: [], error: `Camera request failed (${response.status})` };
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return { detections: [], error: 'Camera returned invalid payload' };
    }

    return { detections: data };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return { detections: [], error: 'Camera request timed out' };
    }
    return {
      detections: [],
      error: error instanceof Error ? error.message : 'Unknown camera error',
    };
  }
};

/**
 * Simple per-gate deduper using localStorage.
 */
const STORAGE_PREFIX = 'camera-detection-latest-id';

const storageAvailable = (): boolean => {
  try {
    const key = '__camera_dedupe_test__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const getLatestCameraIdForGate = (gateId: number | null | undefined): number => {
  if (!gateId || typeof window === 'undefined') return 0;
  if (!storageAvailable()) return 0;
  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}:${gateId}`);
  return raw ? parseInt(raw, 10) || 0 : 0;
};

export const setLatestCameraIdForGate = (gateId: number | null | undefined, latestId: number) => {
  if (!gateId || typeof window === 'undefined') return;
  if (!storageAvailable()) return;
  window.localStorage.setItem(`${STORAGE_PREFIX}:${gateId}`, latestId.toString());
};

/**
 * Filter detections that are newer than the stored latest ID for the gate.
 */
export const filterNewDetections = (
  gateId: number | null | undefined,
  detections: RawCameraDetection[],
  commitLatest: boolean = true
): RawCameraDetection[] => {
  const latest = getLatestCameraIdForGate(gateId);
  const newOnes = detections
    .filter((d) => typeof d.id === 'number' && d.id > latest)
    .sort((a, b) => (a.id || 0) - (b.id || 0)); // oldest-first ordering
  if (commitLatest && newOnes.length > 0) {
    const maxId = newOnes[newOnes.length - 1].id!;
    setLatestCameraIdForGate(gateId, maxId);
  }
  return newOnes;
};
