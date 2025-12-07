/**
 * Request throttling and debouncing utilities
 */

interface QueuedRequest {
  id: string;
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

class RequestThrottler {
  private queue: QueuedRequest[] = [];
  private activeRequests = 0;
  private maxConcurrent: number;
  private processing = false;

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  async enqueue<T>(fn: () => Promise<T>, id?: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = id || `req_${Date.now()}_${Math.random()}`;
      
      this.queue.push({
        id: requestId,
        fn,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const request = this.queue.shift();
      if (!request) break;

      this.activeRequests++;
      
      request.fn()
        .then(request.resolve)
        .catch(request.reject)
        .finally(() => {
          this.activeRequests--;
          this.processQueue();
        });
    }

    this.processing = false;
  }

  clear() {
    this.queue.forEach(req => {
      req.reject(new Error('Request queue cleared'));
    });
    this.queue = [];
  }

  getQueueSize() {
    return this.queue.length;
  }

  getActiveRequests() {
    return this.activeRequests;
  }
}

// Global throttler instance - increased concurrency for better performance
// Higher concurrency for better button responsiveness
const globalThrottler = new RequestThrottler(10);

/**
 * Throttle a function call - ensures max N concurrent requests
 */
export function throttleRequest<T>(
  fn: () => Promise<T>,
  id?: string
): Promise<T> {
  return globalThrottler.enqueue(fn, id);
}

/**
 * Debounce a function - delays execution until after wait time has passed
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Debounce async function - returns a debounced version that returns a promise
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;
  let pendingResolve: ((value: ReturnType<T>) => void) | null = null;
  let pendingReject: ((error: any) => void) | null = null;
  let isCancelled = false;

  const debouncedFunc = function executedFunction(...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      // Cancel previous pending call
      if (timeout) {
        clearTimeout(timeout);
        isCancelled = true;
        // Don't reject previous promise, just silently cancel
        if (pendingResolve) {
          // Resolve with undefined to avoid unhandled rejection
          pendingResolve(undefined as any);
        }
      }

      isCancelled = false;
      pendingResolve = resolve;
      pendingReject = reject;

      timeout = setTimeout(async () => {
        timeout = null;
        if (isCancelled) {
          // Was cancelled, resolve silently
          if (pendingResolve) {
            pendingResolve(undefined as any);
          }
          return;
        }

        try {
          const result = await func(...args);
          if (!isCancelled && pendingResolve) {
            pendingResolve(result);
          }
        } catch (error) {
          if (!isCancelled && pendingReject) {
            pendingReject(error);
          }
        } finally {
          pendingResolve = null;
          pendingReject = null;
        }
      }, wait);
    });
  };

  // Add cleanup method
  (debouncedFunc as any).cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    isCancelled = true;
    if (pendingResolve) {
      pendingResolve(undefined as any);
      pendingResolve = null;
      pendingReject = null;
    }
  };

  return debouncedFunc;
}

/**
 * Get throttler statistics
 */
export function getThrottlerStats() {
  return {
    queueSize: globalThrottler.getQueueSize(),
    activeRequests: globalThrottler.getActiveRequests(),
  };
}

/**
 * Clear all queued requests
 */
export function clearThrottler() {
  globalThrottler.clear();
}

