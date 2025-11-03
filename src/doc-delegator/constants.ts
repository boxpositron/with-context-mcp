/**
 * Constants for documentation delegation features
 */

/**
 * Default name for the ignore file
 */
export const DEFAULT_IGNORE_FILE = '.opencodeignore';

/**
 * Default cache TTL in milliseconds (5 minutes)
 */
export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Default delegation strategy
 */
export const DEFAULT_DELEGATION_STRATEGY = 'local-first';

/**
 * Maximum file size for caching in bytes (10MB)
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Maximum number of entries in cache
 */
export const CACHE_MAX_ENTRIES = 1000;

/**
 * Default timeout for vault operations in milliseconds (5 seconds)
 */
export const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Documentation file extensions
 */
export const DOC_EXTENSIONS = ['.md', '.txt', '.rst', '.adoc'];

/**
 * Special documentation file patterns (case-insensitive)
 */
export const SPECIAL_DOC_PATTERNS = [
  /^readme/i,
  /^changelog/i,
  /^contributing/i,
  /^license/i,
  /^authors/i,
  /^contributors/i,
  /^history/i,
  /^news/i,
];

/**
 * Documentation directory patterns
 */
export const DOC_DIRECTORY_PATTERNS = ['/docs/', 'docs/'];
