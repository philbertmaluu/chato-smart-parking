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
  username?: string | null;
  password?: string | null;
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

  // Don't include credentials in URL - use Authorization header instead
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
  const isBrowser = typeof window !== 'undefined';
  // Better Tauri detection - check for Tauri API first, then protocol
  // Declare outside try block so it's available in catch block
  const isTauri =
    isBrowser &&
    ((window as any).__TAURI__ !== undefined ||
      (window as any).__TAURI_INTERNALS__ !== undefined ||
      (window.location?.protocol?.includes('tauri') === true) ||
      (window.location?.hostname === 'tauri.localhost'));
  
  try {
    // Use Next.js API proxy to fetch directly from camera (bypasses CORS)
    // This is the only method we use - no Laravel backend dependency
    if (options.ip) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      try {
        const params = new URLSearchParams({
          ip: options.ip,
          port: (options.httpPort ?? '80').toString(),
          computerId: (options.computerId ?? '1').toString(),
          fromDate: options.fromDate ?? '',
        });
        // Add auth to proxy if provided
        if (options.username) params.append('user', options.username);
        if (options.password) params.append('password', options.password);
        
        const proxyUrl = `/api/camera-detections?${params.toString()}`;
        
        if (process.env.NODE_ENV === 'development' || (window as any).__TAURI__) {
          console.log('[Camera] Fetching via Next.js proxy:', proxyUrl);
        }
        
        const resp = await fetch(proxyUrl, {
          method: 'GET',
          cache: 'no-store',
          signal: options.signal || controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        });
        
        clearTimeout(timeoutId);
        
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data)) {
            if (process.env.NODE_ENV === 'development' || (window as any).__TAURI__) {
              console.log('[Camera] ✅ Successfully fetched', data.length, 'detections from camera');
            }
            return { detections: data };
          }
          // Handle error response from proxy
          if (data?.error) {
            const errorMsg = `Proxy error: ${data.error}`;
            if (process.env.NODE_ENV === 'development' || (window as any).__TAURI__) {
              console.error('[Camera]', errorMsg);
            }
            return { detections: [], error: errorMsg };
          }
        } else {
          const errorText = await resp.text().catch(() => '');
          const errorMsg = `Proxy request failed (${resp.status}${errorText ? ': ' + errorText.substring(0, 100) : ''})`;
          if (process.env.NODE_ENV === 'development' || (window as any).__TAURI__) {
            console.error('[Camera]', errorMsg);
          }
          return { detections: [], error: errorMsg };
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        const errorMsg = err?.name === 'AbortError' 
          ? 'Camera request timed out (8s)' 
          : `Proxy request failed: ${err?.message || err}`;
        if (process.env.NODE_ENV === 'development' || (window as any).__TAURI__) {
          console.error('[Camera]', errorMsg, err);
        }
        return { detections: [], error: errorMsg };
      }
    }

    // If we get here, the proxy failed and we have no IP
    // Return empty detections with error
    return { 
      detections: [], 
      error: 'Camera IP not provided or proxy unavailable' 
    };
  } catch (error: any) {
    // This catch block should not be reached since we handle errors in the proxy try/catch
    // But keep it as a safety net
    const errorMessage = error instanceof Error ? error.message : String(error);
    const cameraUrl = `http://${options.ip || 'unknown'}:${options.httpPort || 80}`;
    
    let friendlyMessage = errorMessage;
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      friendlyMessage = `Cannot connect to camera at ${cameraUrl}. Check:\n1. Camera IP ${options.ip} is correct\n2. Desktop PC is on same network\n3. Windows Firewall allows connections\n4. Camera is powered on and accessible`;
    }
    
    if (process.env.NODE_ENV === 'development' || (window as any).__TAURI__) {
      console.error('[Camera] Unexpected error:', errorMessage, { 
        ip: options.ip, 
        port: options.httpPort,
        url: cameraUrl,
      });
    }
    
    return {
      detections: [],
      error: friendlyMessage,
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
