/**
 * Local storage for pending camera detections
 * Stores detections captured from camera before they're sent to backend
 */

export interface LocalPendingDetection {
  id: string; // Local unique ID
  gateId: number;
  detection: any; // RawCameraDetection
  timestamp: number; // When it was captured
  status: 'pending' | 'processing' | 'processed' | 'failed';
}

const STORAGE_KEY = 'local-pending-detections';
const MAX_STORAGE_SIZE = 100;

/**
 * Check if localStorage is available
 */
const isStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const key = '__storage_test__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

/**
 * Generate unique local ID for a detection
 */
const generateLocalId = (gateId: number, detectionId: number | string, timestamp: number): string => {
  return `local-${gateId}-${detectionId}-${timestamp}`;
};

/**
 * Get all pending detections from local storage
 */
export const getLocalPendingDetections = (): LocalPendingDetection[] => {
  if (!isStorageAvailable() || typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    // Filter out old detections (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recent = parsed.filter((d: LocalPendingDetection) => 
      d.timestamp > oneHourAgo && d.status === 'pending'
    );
    
    // Save back if we removed any
    if (recent.length !== parsed.length) {
      saveLocalPendingDetections(recent);
    }
    
    return recent;
  } catch (error) {
    console.error('Error reading local pending detections:', error);
    return [];
  }
};

/**
 * Save pending detections to local storage
 */
const saveLocalPendingDetections = (detections: LocalPendingDetection[]): void => {
  if (!isStorageAvailable() || typeof window === 'undefined') {
    return;
  }

  try {
    // Limit storage size to prevent overflow
    const limited = detections.slice(0, MAX_STORAGE_SIZE);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error('Error saving local pending detections:', error);
  }
};

/**
 * Add a new detection to local storage
 */
export const addLocalPendingDetection = (
  gateId: number,
  detection: any
): LocalPendingDetection => {
  const timestamp = Date.now();
  const detectionId = detection.id || timestamp;
  const localId = generateLocalId(gateId, detectionId, timestamp);

  const localDetection: LocalPendingDetection = {
    id: localId,
    gateId,
    detection,
    timestamp,
    status: 'pending',
  };

  const existing = getLocalPendingDetections();
  
  // Simple duplicate check: only by camera ID (if available)
  const duplicate = detection.id 
    ? existing.find(
        d => d.gateId === gateId && 
             d.status === 'pending' &&
             d.detection.id === detection.id
      )
    : null;

  if (duplicate) {
    // Don't add duplicate - just return the existing one
    return duplicate;
  }

  // Add new detection at the beginning (most recent first)
  const updated = [localDetection, ...existing];
  saveLocalPendingDetections(updated);
  
  return localDetection;
};

/**
 * Get pending detections for a specific gate
 */
export const getLocalPendingDetectionsByGate = (gateId: number): LocalPendingDetection[] => {
  return getLocalPendingDetections().filter(d => d.gateId === gateId && d.status === 'pending');
};

/**
 * Get the oldest pending detection for a gate (FIFO)
 */
export const getOldestLocalPendingDetection = (gateId?: number): LocalPendingDetection | null => {
  const all = gateId 
    ? getLocalPendingDetectionsByGate(gateId)
    : getLocalPendingDetections();
  
  if (all.length === 0) return null;
  
  // Return oldest (lowest timestamp)
  return all.reduce((oldest, current) => 
    current.timestamp < oldest.timestamp ? current : oldest
  );
};

/**
 * Mark a local detection as processed (remove from storage)
 */
export const markLocalDetectionProcessed = (localId: string): void => {
  const existing = getLocalPendingDetections();
  const updated = existing.filter(d => d.id !== localId);
  saveLocalPendingDetections(updated);
};

/**
 * Mark a local detection as processing
 */
export const markLocalDetectionProcessing = (localId: string): void => {
  const existing = getLocalPendingDetections();
  const updated = existing.map(d => 
    d.id === localId ? { ...d, status: 'processing' as const } : d
  );
  saveLocalPendingDetections(updated);
};

/**
 * Mark a local detection as failed
 */
export const markLocalDetectionFailed = (localId: string): void => {
  const existing = getLocalPendingDetections();
  const updated = existing.map(d => 
    d.id === localId ? { ...d, status: 'failed' as const } : d
  );
  saveLocalPendingDetections(updated);
};

