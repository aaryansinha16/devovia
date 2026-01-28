/**
 * Performance optimization utilities
 */

/**
 * Simple in-memory cache for API responses
 */
class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number;

  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000;
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Global cache instance for API responses
 */
export const apiCache = new SimpleCache(5); // 5 minutes TTL

/**
 * Create a cache key from parameters
 */
export function createCacheKey(endpoint: string, params?: Record<string, any>): string {
  if (!params) return endpoint;
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  
  return `${endpoint}?${sortedParams}`;
}

/**
 * Wrap a fetch function with caching
 */
export function withCache<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  ttlMinutes?: number
): Promise<T> {
  const cache = ttlMinutes ? new SimpleCache<T>(ttlMinutes) : apiCache;
  
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    return Promise.resolve(cached as T);
  }

  return fetchFn().then(data => {
    cache.set(cacheKey, data);
    return data;
  });
}

/**
 * Prefetch data in the background
 */
export function prefetch<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string
): void {
  // Check if already cached
  if (apiCache.get(cacheKey)) return;

  // Fetch in background
  fetchFn()
    .then(data => apiCache.set(cacheKey, data))
    .catch(() => {
      // Silently fail for prefetch
    });
}

/**
 * Batch multiple requests
 */
export async function batchRequests<T>(
  requests: Array<() => Promise<T>>,
  batchSize: number = 5
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn => fn()));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Retry a failed request with exponential backoff
 */
export async function retryWithBackoff<T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Measure function execution time
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.log(`[Performance] ${name} (failed): ${(end - start).toFixed(2)}ms`);
    throw error;
  }
}
