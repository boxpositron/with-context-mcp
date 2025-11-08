/**
 * Documentation delegation module
 * Provides ignore pattern matching and read interception functionality
 */

// Export types
export type {
  DelegationStrategy,
  IgnorePatternConfig,
  ReadInterceptorConfig,
  DelegationDecision as LegacyDelegationDecision,
  CacheStats,
} from './types.js';

// Export constants
export {
  DEFAULT_IGNORE_FILE,
  DEFAULT_CACHE_TTL_MS,
  DEFAULT_DELEGATION_STRATEGY,
  MAX_FILE_SIZE_BYTES,
  CACHE_MAX_ENTRIES,
  DEFAULT_TIMEOUT_MS,
  DOC_EXTENSIONS,
  SPECIAL_DOC_PATTERNS,
  DOC_DIRECTORY_PATTERNS,
} from './constants.js';

// Export classes (legacy)
export { IgnorePatternMatcher } from './ignore-pattern-matcher.js';
export { IgnoreConfig } from './ignore-config.js';

// Export new delegation decision logic
export {
  decideDelegation,
  decideDelegationBatch,
  decideDelegationWithReasoning,
  type DelegationReasoning,
} from './delegation-decision.js';
export type { DelegationDecision } from '../config/config-parser.js';
