/**
 * Tests for VaultCache
 * Tests TTL expiration, LRU eviction, and cache statistics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VaultCache } from '../../../src/doc-delegator/vault-cache.js';

describe('VaultCache', () => {
  let cache: VaultCache;

  beforeEach(() => {
    cache = new VaultCache(5000, 10); // 5 second TTL, max 10 entries
  });

  describe('Basic operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'content1');
      const result = cache.get('key1');

      expect(result).not.toBeNull();
      expect(result?.content).toBe('content1');
      expect(result?.hits).toBe(1);
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should check if key exists with has()', () => {
      cache.set('key1', 'content1');

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete entries', () => {
      cache.set('key1', 'content1');
      expect(cache.has('key1')).toBe(true);

      const deleted = cache.delete('key1');
      expect(deleted).toBe(true);
      expect(cache.has('key1')).toBe(false);
    });

    it('should return false when deleting non-existent entry', () => {
      const deleted = cache.delete('nonexistent');
      expect(deleted).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'content1');
      cache.set('key2', 'content2');
      cache.set('key3', 'content3');

      expect(cache.size()).toBe(3);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(false);
    });

    it('should report correct size', () => {
      expect(cache.size()).toBe(0);

      cache.set('key1', 'content1');
      expect(cache.size()).toBe(1);

      cache.set('key2', 'content2');
      expect(cache.size()).toBe(2);

      cache.delete('key1');
      expect(cache.size()).toBe(1);

      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      // Create cache with 100ms TTL
      const shortCache = new VaultCache(100, 10);
      shortCache.set('key1', 'content1');

      // Should exist immediately
      expect(shortCache.has('key1')).toBe(true);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be expired
      expect(shortCache.has('key1')).toBe(false);
      expect(shortCache.get('key1')).toBeNull();
    });

    it('should not expire entries before TTL', async () => {
      cache.set('key1', 'content1');

      // Wait less than TTL
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should still exist
      expect(cache.has('key1')).toBe(true);
      const result = cache.get('key1');
      expect(result?.content).toBe('content1');
    });

    it('should handle multiple entries with different timestamps', async () => {
      const shortCache = new VaultCache(100, 10);

      shortCache.set('key1', 'content1');
      await new Promise((resolve) => setTimeout(resolve, 60));
      shortCache.set('key2', 'content2');

      // Wait for key1 to expire but not key2
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(shortCache.has('key1')).toBe(false);
      expect(shortCache.has('key2')).toBe(true);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry when max entries exceeded', () => {
      // Create cache with max 3 entries
      const smallCache = new VaultCache(5000, 3);

      smallCache.set('key1', 'content1');
      smallCache.set('key2', 'content2');
      smallCache.set('key3', 'content3');

      expect(smallCache.size()).toBe(3);

      // Add 4th entry, should evict key1 (least recently used)
      smallCache.set('key4', 'content4');

      expect(smallCache.size()).toBe(3);
      expect(smallCache.has('key1')).toBe(false);
      expect(smallCache.has('key2')).toBe(true);
      expect(smallCache.has('key3')).toBe(true);
      expect(smallCache.has('key4')).toBe(true);
    });

    it('should update LRU order on get()', () => {
      const smallCache = new VaultCache(5000, 3);

      smallCache.set('key1', 'content1');
      smallCache.set('key2', 'content2');
      smallCache.set('key3', 'content3');

      // Access key1 to make it most recently used
      smallCache.get('key1');

      // Add 4th entry, should evict key2 (now least recently used)
      smallCache.set('key4', 'content4');

      expect(smallCache.has('key1')).toBe(true);
      expect(smallCache.has('key2')).toBe(false);
      expect(smallCache.has('key3')).toBe(true);
      expect(smallCache.has('key4')).toBe(true);
    });

    it('should update existing entry when setting same key', () => {
      cache.set('key1', 'content1');
      cache.set('key1', 'content2');

      expect(cache.size()).toBe(1);
      const result = cache.get('key1');
      expect(result?.content).toBe('content2');
    });
  });

  describe('Hit tracking', () => {
    it('should track hits on get()', () => {
      cache.set('key1', 'content1');

      let result = cache.get('key1');
      expect(result?.hits).toBe(1);

      result = cache.get('key1');
      expect(result?.hits).toBe(2);

      result = cache.get('key1');
      expect(result?.hits).toBe(3);
    });

    it('should update lastAccessed on get()', () => {
      const now = Date.now();
      cache.set('key1', 'content1');

      const result = cache.get('key1');
      expect(result?.lastAccessed).toBeGreaterThanOrEqual(now);
    });

    it('should reset hits when entry is updated', () => {
      cache.set('key1', 'content1');
      cache.get('key1');
      cache.get('key1');

      cache.set('key1', 'content2'); // Update
      const result = cache.get('key1');
      expect(result?.hits).toBe(1); // Reset to 1 (from the get after set)
    });
  });

  describe('Statistics', () => {
    it('should return correct basic stats', () => {
      cache.set('key1', 'content1');
      cache.set('key2', 'content2');
      cache.get('key1');
      cache.get('key1');
      cache.get('key2');

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.validEntries).toBe(2);
      expect(stats.totalHits).toBe(3);
      expect(stats.avgHitsPerEntry).toBe(1.5);
    });

    it('should return zero stats for empty cache', () => {
      const stats = cache.getStats();

      expect(stats.size).toBe(0);
      expect(stats.validEntries).toBe(0);
      expect(stats.totalHits).toBe(0);
      expect(stats.avgHitsPerEntry).toBe(0);
    });

    it('should exclude expired entries from valid entries count', async () => {
      const shortCache = new VaultCache(100, 10);

      shortCache.set('key1', 'content1');
      shortCache.set('key2', 'content2');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      const stats = shortCache.getStats();

      expect(stats.size).toBe(2); // Still in cache (not cleaned up)
      expect(stats.validEntries).toBe(0); // But none are valid
    });

    it('should track extended stats', () => {
      cache.set('key1', 'content1');
      cache.get('key1');
      cache.get('key2'); // Miss
      cache.get('key1');
      cache.get('key3'); // Miss

      const stats = cache.getExtendedStats();

      expect(stats.totalMisses).toBe(2);
      expect(stats.hitRate).toBeCloseTo(0.5); // 2 hits, 2 misses
    });
  });

  describe('Cleanup', () => {
    it('should manually clean up expired entries', async () => {
      const shortCache = new VaultCache(100, 10);

      shortCache.set('key1', 'content1');
      shortCache.set('key2', 'content2');
      shortCache.set('key3', 'content3');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(shortCache.size()).toBe(3); // Before cleanup

      const removed = shortCache.cleanup();

      expect(removed).toBe(3);
      expect(shortCache.size()).toBe(0);
    });

    it('should not remove non-expired entries during cleanup', async () => {
      const shortCache = new VaultCache(200, 10);

      shortCache.set('key1', 'content1');
      await new Promise((resolve) => setTimeout(resolve, 50));
      shortCache.set('key2', 'content2');

      // Wait for key1 to expire but not key2
      await new Promise((resolve) => setTimeout(resolve, 170));

      const removed = shortCache.cleanup();

      expect(removed).toBe(1);
      expect(shortCache.size()).toBe(1);
      expect(shortCache.has('key2')).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should return TTL and max entries', () => {
      expect(cache.getTTL()).toBe(5000);
      expect(cache.getMaxEntries()).toBe(10);
    });

    it('should update TTL', () => {
      cache.setTTL(10000);
      expect(cache.getTTL()).toBe(10000);
    });

    it('should update max entries', () => {
      cache.set('key1', 'content1');
      cache.set('key2', 'content2');
      cache.set('key3', 'content3');

      expect(cache.size()).toBe(3);

      // Reduce max entries
      cache.setMaxEntries(2);

      expect(cache.getMaxEntries()).toBe(2);
      expect(cache.size()).toBe(2);
      expect(cache.has('key1')).toBe(false); // Evicted
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
    });

    it('should use default values', () => {
      const defaultCache = new VaultCache();
      expect(defaultCache.getTTL()).toBe(5 * 60 * 1000); // 5 minutes
      expect(defaultCache.getMaxEntries()).toBe(1000);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string content', () => {
      cache.set('key1', '');
      const result = cache.get('key1');

      expect(result).not.toBeNull();
      expect(result?.content).toBe('');
    });

    it('should handle very long content', () => {
      const longContent = 'x'.repeat(100000);
      cache.set('key1', longContent);
      const result = cache.get('key1');

      expect(result?.content).toBe(longContent);
    });

    it('should handle special characters in keys', () => {
      const specialKey = 'path/to/file.md';
      cache.set(specialKey, 'content');

      expect(cache.has(specialKey)).toBe(true);
      expect(cache.get(specialKey)?.content).toBe('content');
    });

    it('should clear stats on clear()', () => {
      cache.set('key1', 'content1');
      cache.get('key1');
      cache.get('key2'); // Miss

      cache.clear();

      const stats = cache.getExtendedStats();
      expect(stats.totalMisses).toBe(0);
      expect(stats.totalHits).toBe(0);
      expect(stats.totalEvictions).toBe(0);
    });
  });
});
