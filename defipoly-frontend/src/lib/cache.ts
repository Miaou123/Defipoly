/**
 * Simple caching layer for API responses
 * Reduces unnecessary API calls and improves performance
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTTL: number;

  constructor(defaultTTL: number = 30000) { // 30 seconds default
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T, ttl?: number): void {
    const ttlMs = ttl || this.defaultTTL;
    const now = Date.now();
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache stats
   */
  getStats(): {
    size: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    let oldest: number | null = null;
    let newest: number | null = null;

    for (const entry of this.cache.values()) {
      if (oldest === null || entry.timestamp < oldest) {
        oldest = entry.timestamp;
      }
      if (newest === null || entry.timestamp > newest) {
        newest = entry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      oldestEntry: oldest,
      newestEntry: newest,
    };
  }
}

/**
 * Cached API request wrapper
 */
export async function cachedRequest<T>(
  cache: Cache<T>,
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Cache the result
  cache.set(cacheKey, data, ttl);
  
  return data;
}

// Create cache instances for different data types
export const profileCache = new Cache<any>(60000); // 1 minute
export const propertyCache = new Cache<any>(30000); // 30 seconds
export const statsCache = new Cache<any>(10000); // 10 seconds
export const leaderboardCache = new Cache<any>(60000); // 1 minute

// Cleanup expired entries periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    profileCache.clearExpired();
    propertyCache.clearExpired();
    statsCache.clearExpired();
    leaderboardCache.clearExpired();
  }, 60000); // Every minute
}

/**
 * Local storage cache for persistent data
 */
export class PersistentCache<T> {
  private readonly prefix: string;
  private readonly defaultTTL: number;

  constructor(prefix: string, defaultTTL: number = 3600000) { // 1 hour default
    this.prefix = `defipoly_cache_${prefix}_`;
    this.defaultTTL = defaultTTL;
  }

  get(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    const fullKey = this.prefix + key;
    const item = localStorage.getItem(fullKey);
    
    if (!item) return null;
    
    try {
      const entry: CacheEntry<T> = JSON.parse(item);
      
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(fullKey);
        return null;
      }
      
      return entry.data;
    } catch {
      localStorage.removeItem(fullKey);
      return null;
    }
  }

  set(key: string, data: T, ttl?: number): void {
    if (typeof window === 'undefined') return;
    
    const ttlMs = ttl || this.defaultTTL;
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    };
    
    const fullKey = this.prefix + key;
    
    try {
      localStorage.setItem(fullKey, JSON.stringify(entry));
    } catch (e) {
      // Handle quota exceeded
      console.warn('Failed to save to persistent cache:', e);
      this.clearOldest();
      
      // Try again
      try {
        localStorage.setItem(fullKey, JSON.stringify(entry));
      } catch {
        // Give up
      }
    }
  }

  delete(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  private clearOldest(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
    let oldest: { key: string; timestamp: number } | undefined;
    
    keys.forEach(key => {
      try {
        const entry = JSON.parse(localStorage.getItem(key) || '');
        if (!oldest || entry.timestamp < oldest.timestamp) {
          oldest = { key, timestamp: entry.timestamp };
        }
      } catch {
        // Remove invalid entries
        localStorage.removeItem(key);
      }
    });
    
    if (oldest) {
      localStorage.removeItem(oldest.key);
    }
  }
}

// Create persistent cache instances
export const persistentProfileCache = new PersistentCache<any>('profile', 3600000); // 1 hour
export const persistentPropertyCache = new PersistentCache<any>('property', 1800000); // 30 minutes