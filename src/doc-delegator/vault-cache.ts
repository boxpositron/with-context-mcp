/**
 * VaultCache - TTL-based cache with LRU eviction
 * Provides performance optimization for vault read operations
 */

import { CacheStats } from './types.js';
import { DEFAULT_CACHE_TTL_MS, CACHE_MAX_ENTRIES } from './constants.js';

/**
 * Interface for cached content with metadata
 */
export interface CachedContent {
  /**
   * The cached content string
   */
  content: string;

  /**
   * Timestamp when the entry was created (ms since epoch)
   */
  timestamp: number;

  /**
   * Number of times this entry has been accessed
   */
  hits: number;

  /**
   * Timestamp of last access (ms since epoch)
   */
  lastAccessed: number;
}

/**
 * VaultCache class with TTL and LRU eviction
 * Thread-safe operations for caching vault file contents
 */
export class VaultCache {
  private cache: Map<string, CachedContent>;
  private ttlMs: number;
  private maxEntries: number;
  private totalHits: number = 0;
  private totalMisses: number = 0;
  private totalEvictions: number = 0;

  /**
   * Create a new VaultCache
   * @param ttlMs - Time-to-live in milliseconds (default: 5 minutes)
   * @param maxEntries - Maximum number of entries before LRU eviction (default: 1000)
   */
  constructor(ttlMs: number = DEFAULT_CACHE_TTL_MS, maxEntries: number = CACHE_MAX_ENTRIES) {
    this.cache = new Map();
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  /**
   * Get cached content by key
   * Returns null if not found or expired
   * @param key - Cache key (typically file path)
   * @returns Cached content or null
   */
  get(key: string): CachedContent | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.totalMisses++;
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > this.ttlMs) {
      // Entry expired, remove it
      this.cache.delete(key);
      this.totalMisses++;
      return null;
    }

    // Update access metadata
    entry.hits++;
    entry.lastAccessed = now;
    this.totalHits++;

    // Move to end (most recently used) by deleting and re-adding
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry;
  }

  /**
   * Set cached content for a key
   * Handles LRU eviction if max entries exceeded
   * @param key - Cache key
   * @param content - Content to cache
   */
  set(key: string, content: string): void {
    const now = Date.now();

    // If key already exists, delete it (will be re-added at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Check if we need to evict (LRU)
    if (this.cache.size >= this.maxEntries) {
      // Evict least recently used (first entry in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
        this.totalEvictions++;
      }
    }

    // Add new entry
    this.cache.set(key, {
      content,
      timestamp: now,
      hits: 0,
      lastAccessed: now,
    });
  }

  /**
   * Check if key exists and is not expired
   * @param key - Cache key
   * @returns true if valid entry exists
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a cache entry
   * @param key - Cache key
   * @returns true if entry was found and deleted
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.totalHits = 0;
    this.totalMisses = 0;
    this.totalEvictions = 0;
  }

  /**
   * Get current cache size
   * @returns Number of entries in cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   * @returns CacheStats object with metrics
   */
  getStats(): CacheStats {
    const now = Date.now();
    let validEntries = 0;
    let totalHitsInCache = 0;

    // Count valid (non-expired) entries and total hits
    for (const entry of this.cache.values()) {
      if (now - entry.timestamp <= this.ttlMs) {
        validEntries++;
        totalHitsInCache += entry.hits;
      }
    }

    return {
      size: this.cache.size,
      validEntries,
      totalHits: totalHitsInCache,
      avgHitsPerEntry: validEntries > 0 ? totalHitsInCache / validEntries : 0,
    };
  }

  /**
   * Get extended statistics including misses and evictions
   * @returns Extended stats object
   */
  getExtendedStats(): CacheStats & {
    totalMisses: number;
    totalEvictions: number;
    hitRate: number;
  } {
    const basicStats = this.getStats();
    const totalRequests = this.totalHits + this.totalMisses;
    const hitRate = totalRequests > 0 ? this.totalHits / totalRequests : 0;

    return {
      ...basicStats,
      totalMisses: this.totalMisses,
      totalEvictions: this.totalEvictions,
      hitRate,
    };
  }

  /**
   * Manually clean up expired entries
   * Called automatically during get/has operations, but can be called manually
   * @returns Number of entries removed
   */
  cleanup(): number {
    const now = Date.now();
    const keysToDelete: string[] = [];

    // Identify expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        keysToDelete.push(key);
      }
    }

    // Delete expired entries
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    return keysToDelete.length;
  }

  /**
   * Get TTL in milliseconds
   * @returns TTL value
   */
  getTTL(): number {
    return this.ttlMs;
  }

  /**
   * Get max entries limit
   * @returns Max entries value
   */
  getMaxEntries(): number {
    return this.maxEntries;
  }

  /**
   * Update TTL for future entries
   * Does not affect existing entries
   * @param ttlMs - New TTL in milliseconds
   */
  setTTL(ttlMs: number): void {
    this.ttlMs = ttlMs;
  }

  /**
   * Update max entries limit
   * @param maxEntries - New max entries value
   */
  setMaxEntries(maxEntries: number): void {
    this.maxEntries = maxEntries;

    // If current size exceeds new limit, evict oldest entries
    while (this.cache.size > this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
        this.totalEvictions++;
      }
    }
  }
}
