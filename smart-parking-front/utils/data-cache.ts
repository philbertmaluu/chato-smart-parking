/**
 * Simple in-memory cache for API responses with TTL
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      // Entry expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttl: number = 5000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Check if key exists and is valid (not expired)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' 
      ? new RegExp(pattern.replace(/\*/g, '.*'))
      : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
    };
  }
}

// Global cache instance
const globalCache = new DataCache();

// Cleanup expired entries every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    globalCache.cleanup();
  }, 30000);
}

/**
 * Generate cache key from endpoint and params
 */
export function generateCacheKey(endpoint: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }

  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');

  return `${endpoint}?${sortedParams}`;
}

/**
 * Get cached data
 */
export function getCached<T>(key: string): T | null {
  return globalCache.get<T>(key);
}

/**
 * Set cached data
 */
export function setCached<T>(key: string, data: T, ttl: number = 5000): void {
  globalCache.set(key, data, ttl);
}

/**
 * Check if data is cached
 */
export function isCached(key: string): boolean {
  return globalCache.has(key);
}

/**
 * Invalidate cache entry
 */
export function invalidateCache(key: string): void {
  globalCache.invalidate(key);
}

/**
 * Invalidate cache entries matching pattern
 */
export function invalidateCachePattern(pattern: string | RegExp): void {
  globalCache.invalidatePattern(pattern);
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  globalCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return globalCache.getStats();
}

export default globalCache;





