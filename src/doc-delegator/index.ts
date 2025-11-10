/**
 * Documentation delegation module
 * Provides delegation decision logic for documentation files
 */

// Export types
export type {
  DelegationStrategy,
  DelegationDecision as LegacyDelegationDecision,
  CacheStats,
} from './types.js';

// Export delegation decision logic
export {
  decideDelegation,
  decideDelegationBatch,
  decideDelegationWithReasoning,
  type DelegationReasoning,
} from './delegation-decision.js';
export type { DelegationDecision } from '../config/config-parser.js';
