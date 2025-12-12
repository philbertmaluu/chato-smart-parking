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
        // Add auth to proxy if provided
        if (options.username) params.append('user', options.username);
        if (options.password) params.append('password', options.password);
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

    // Add a timeout to avoid hanging when camera is unreachable
    // Use shorter timeout in Tauri (5s) vs browser (10s) since Tauri can bypass CORS
    const timeoutMs = isTauri ? 5000 : 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const signal = options.signal || controller.signal;

    const url = buildCameraDetectionUrl(options);
    
    // Log for debugging (only in dev/desktop) - don't log credentials
    if (process.env.NODE_ENV === 'development' || (window as any).__TAURI__) {
      console.log('[Camera] Fetching from:', url.replace(/\/\/.*@/, '//***:***@'));
    }
    
    // Build headers with authentication if provided
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    if (options.username && options.password) {
      // Use Basic authentication header
      const authString = btoa(`${options.username}:${options.password}`);
      headers['Authorization'] = `Basic ${authString}`;
      if (process.env.NODE_ENV === 'development' || (window as any).__TAURI__) {
        console.log('[Camera] Using Basic auth with username:', options.username);
      }
    }
    
    if (process.env.NODE_ENV === 'development' || (window as any).__TAURI__) {
      console.log('[Camera] Fetch options:', {
        url: url.substring(0, 100) + '...',
        hasAuth: !!(options.username && options.password),
        method: 'GET',
      });
    }
    
    // Try fetch - in Tauri this should work, but if it fails we'll get a clear error
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        signal,
        headers,
        credentials: 'omit',
        // Don't set mode explicitly - let browser/Tauri decide
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      // Log full error details for debugging
      if (process.env.NODE_ENV === 'development' || (window as any).__TAURI__) {
        console.error('[Camera] Fetch exception details:', {
          name: fetchError?.name,
          message: fetchError?.message,
          stack: fetchError?.stack,
          cause: fetchError?.cause,
          url: url.substring(0, 150),
        });
      }
      throw fetchError; // Re-throw to be caught by outer catch
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return { 
        detections: [], 
        error: `Camera request failed (${response.status}${errorText ? ': ' + errorText.substring(0, 100) : ''})` 
      };
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return { detections: [], error: 'Camera returned invalid payload (not an array)' };
    }

    return { detections: data };
  } catch (error: any) {
    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      return { detections: [], error: 'Camera request timed out (5s)' };
    }
    
    // Provide more detailed error messages
    const errorMessage = error instanceof Error ? error.message : String(error);
    let friendlyMessage = errorMessage;
    const cameraUrl = `http://${options.ip || 'unknown'}:${options.httpPort || 80}`;
    
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('ERR_') || errorMessage.includes('Network request failed')) {
      const testUrl = `${cameraUrl}/edge/cgi-bin/vparcgi.cgi?computerid=${options.computerId || 1}&oper=jsonlastresults`;
      friendlyMessage = `Cannot connect to camera at ${cameraUrl}. Check:\n1. Camera IP ${options.ip} is correct\n2. Desktop PC is on same network\n3. Windows Firewall allows connections\n4. Camera is powered on and accessible\n\nTest URL: ${testUrl}`;
    } else if (errorMessage.includes('CORS')) {
      friendlyMessage = `CORS error - camera at ${cameraUrl} blocked the request. This shouldn't happen in desktop app.`;
    } else if (errorMessage.includes('timeout') || errorMessage.includes('time') || errorMessage.includes('aborted')) {
      const timeoutSeconds = isTauri ? 5 : 10;
      friendlyMessage = `Camera request timed out after ${timeoutSeconds}s. Camera may be offline, unreachable, or firewall is blocking. IP: ${options.ip}`;
    } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      friendlyMessage = `Authentication failed for camera at ${cameraUrl}. Check username and password in camera device settings.`;
    } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      friendlyMessage = `Access forbidden to camera at ${cameraUrl}. Check user permissions and camera API access settings.`;
    } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      friendlyMessage = `Camera endpoint not found at ${cameraUrl}. Camera may not support /edge/cgi-bin/vparcgi.cgi endpoint.`;
    }
    
    console.error('[Camera] Fetch error:', errorMessage, { 
      ip: options.ip, 
      port: options.httpPort,
      url: cameraUrl,
      hasAuth: !!(options.username && options.password),
      errorType: error?.name || 'Unknown'
    });
    
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
