/**
 * Types and interfaces for documentation delegation features
 * Shared between ignore patterns and read interception functionality
 */

/**
 * Delegation strategy for read operations
 * - local-first: Try local filesystem first, fallback to vault
 * - vault-first: Try vault first, fallback to local filesystem
 * - vault-only: Only read from vault, fail if not found
 */
export type DelegationStrategy = 'local-first' | 'vault-first' | 'vault-only';

/**
 * Configuration for ignore pattern matching
 */
export interface IgnorePatternConfig {
  /**
   * List of patterns to ignore (delegate to vault)
   */
  patterns: string[];

  /**
   * List of negation patterns (include patterns that start with !)
   */
  negatePatterns: string[];

  /**
   * Whether the configuration was successfully loaded
   */
  configLoaded: boolean;

  /**
   * Project root directory (for relative path resolution)
   */
  projectRoot: string;
}

/**
 * Configuration for read interception
 */
export interface ReadInterceptorConfig {
  /**
   * Project root directory
   */
  projectRoot: string;

  /**
   * Strategy for reading files
   */
  readStrategy: DelegationStrategy;

  /**
   * Whether to enable caching
   */
  enableCache: boolean;

  /**
   * Cache TTL in milliseconds
   */
  cacheTTL: number;

  /**
   * Whether to show feedback messages
   */
  showFeedback: boolean;

  /**
   * Timeout for vault operations in milliseconds
   */
  timeout: number;
}

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
