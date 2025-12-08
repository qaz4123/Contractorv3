/**
 * In-Memory Cache Service
 * Caches expensive API calls (search, AI) to reduce costs and latency
 */

import NodeCache from 'node-cache';

export interface CacheEntry<T> {
  data: T;
  cachedAt: Date;
  hitCount: number;
}

export class CacheService {
  private cache: NodeCache;
  private hits = 0;
  private misses = 0;
  private maxSize: number;

  constructor(ttlMinutes: number = 60, maxSize: number = 1000) {
    this.cache = new NodeCache({
      stdTTL: ttlMinutes * 60, // Convert to seconds
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: true, // Return clones to prevent mutation
      maxKeys: maxSize, // Limit number of keys to prevent memory exhaustion
    });
    
    this.maxSize = maxSize;

    // Log cache events
    this.cache.on('expired', (key) => {
      console.log(`🗑️ Cache expired: ${key}`);
    });
  }

  /**
   * Get an item from cache
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get<CacheEntry<T>>(key);
    
    if (entry) {
      this.hits++;
      entry.hitCount++;
      this.cache.set(key, entry); // Update hit count
      console.log(`📦 Cache hit: ${key} (hits: ${entry.hitCount})`);
      return entry.data;
    }
    
    this.misses++;
    return undefined;
  }

  /**
   * Set an item in cache
   * Implements simple eviction when cache is full
   * Note: True LRU requires tracking access patterns, this is a simplified version
   */
  set<T>(key: string, data: T, ttlSeconds?: number): boolean {
    // If cache is at max size and key doesn't exist, evict oldest entry
    if (!this.cache.has(key)) {
      const keys = this.cache.keys(); // Call only once for efficiency
      if (keys.length >= this.maxSize && keys.length > 0) {
        // Evict first key (oldest entry)
        this.cache.del(keys[0]);
        console.log(`⚠️ Cache full, evicted: ${keys[0]}`);
      }
    }
    
    const entry: CacheEntry<T> = {
      data,
      cachedAt: new Date(),
      hitCount: 0,
    };

    if (ttlSeconds) {
      return this.cache.set(key, entry, ttlSeconds);
    }
    
    return this.cache.set(key, entry);
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a key
   */
  delete(key: string): boolean {
    const deleted = this.cache.del(key);
    return deleted > 0;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.flushAll();
    this.hits = 0;
    this.misses = 0;
    console.log('🧹 Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): { hits: number; misses: number; size: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.keys().length,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
    };
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return this.cache.keys();
  }

  /**
   * Get TTL for a key (in seconds)
   */
  getTtl(key: string): number | undefined {
    return this.cache.getTtl(key);
  }

  /**
   * Extend TTL for a key
   */
  touch(key: string, ttlSeconds: number): boolean {
    return this.cache.ttl(key, ttlSeconds);
  }
}

// Export singleton instance with configurable TTL and size
import { config } from '../../config';

export const cacheService = new CacheService(
  config.cache.ttlMinutes,
  config.cache.maxSize
);
