/**
 * Types and interfaces for documentation delegation features
 */

/**
 * Delegation strategy for read operations
 * - local-first: Try local filesystem first, fallback to vault
 * - vault-first: Try vault first, fallback to local filesystem
 * - vault-only: Only read from vault, fail if not found
 */
export type DelegationStrategy = 'local-first' | 'vault-first' | 'vault-only';

/**
 * Result of delegation decision
 */
export interface DelegationDecision {
  /**
   * Whether the file should be delegated to vault
   */
  shouldDelegate: boolean;

  /**
   * Reason for the decision
   */
  reason: string;

  /**
   * Whether the file is a documentation file
   */
  isDocFile: boolean;

  /**
   * Whether the file matches ignore patterns
   */
  matchesIgnorePattern: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /**
   * Number of entries in cache
   */
  size: number;

  /**
   * Number of valid (non-expired) entries
   */
  validEntries: number;

  /**
   * Total number of cache hits
   */
  totalHits: number;

  /**
   * Average hits per entry
   */
  avgHitsPerEntry: number;
}
