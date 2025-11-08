/**
 * Delegation Decision Logic
 * Determines whether files should be delegated to vault or kept local
 * Uses the new .withcontextconfig.jsonc format
 */

import micromatch from 'micromatch';
import {
  WithContextConfig,
  DelegationDecision,
  ConflictResolution,
} from '../config/config-parser.js';
import { ConfigurationError } from '../types/index.js';

/**
 * Pattern match result with specificity information
 */
interface PatternMatch {
  matched: boolean;
  pattern?: string;
  specificity: number;
}

/**
 * Calculate pattern specificity (higher = more specific)
 * More specific patterns should win in "most-specific-wins" conflict resolution
 */
function calculateSpecificity(pattern: string): number {
  let score = 0;

  // Exact matches (no wildcards) are most specific
  if (!pattern.includes('*') && !pattern.includes('?')) {
    score += 1000;
  }

  // Count path segments (more segments = more specific)
  const segments = pattern.split('/').filter((s) => s.length > 0);
  score += segments.length * 10;

  // Penalize wildcards
  const wildcardCount = (pattern.match(/\*/g) || []).length;
  score -= wildcardCount * 5;

  // Double wildcards (**) are less specific than single (*)
  const doubleWildcardCount = (pattern.match(/\*\*/g) || []).length;
  score -= doubleWildcardCount * 10;

  // Leading / or exact prefix makes it more specific
  if (pattern.startsWith('/')) {
    score += 50;
  }

  // File extension match is more specific
  if (pattern.includes('.')) {
    score += 20;
  }

  return Math.max(0, score);
}

/**
 * Normalize path for matching (same logic as IgnorePatternMatcher)
 */
function normalizePath(filePath: string): string {
  // Convert Windows paths to Unix-style
  let normalized = filePath.replace(/\\/g, '/');

  // Remove leading ./ if present
  if (normalized.startsWith('./')) {
    normalized = normalized.slice(2);
  }

  // Remove leading / for relative matching
  if (normalized.startsWith('/')) {
    normalized = normalized.slice(1);
  }

  return normalized;
}

/**
 * Check if path matches any patterns and return match info
 */
function matchPatterns(normalizedPath: string, patterns: string[]): PatternMatch {
  if (patterns.length === 0) {
    return { matched: false, specificity: 0 };
  }

  const matchedPatterns = patterns.filter((pattern) =>
    micromatch.isMatch(normalizedPath, pattern, {
      dot: true,
      matchBase: false,
      nocase: false,
    })
  );

  if (matchedPatterns.length === 0) {
    return { matched: false, specificity: 0 };
  }

  // Find most specific matched pattern
  let mostSpecific = matchedPatterns[0];
  let maxSpecificity = calculateSpecificity(mostSpecific);

  for (let i = 1; i < matchedPatterns.length; i++) {
    const specificity = calculateSpecificity(matchedPatterns[i]);
    if (specificity > maxSpecificity) {
      maxSpecificity = specificity;
      mostSpecific = matchedPatterns[i];
    }
  }

  return {
    matched: true,
    pattern: mostSpecific,
    specificity: maxSpecificity,
  };
}

/**
 * Resolve conflict when file matches both vault and local patterns
 */
function resolveConflict(
  vaultMatch: PatternMatch,
  localMatch: PatternMatch,
  strategy: ConflictResolution
): DelegationDecision {
  switch (strategy) {
    case 'local-wins':
      return 'local';

    case 'vault-wins':
      return 'vault';

    case 'most-specific-wins':
      // Compare specificity scores
      if (localMatch.specificity > vaultMatch.specificity) {
        return 'local';
      } else if (vaultMatch.specificity > localMatch.specificity) {
        return 'vault';
      } else {
        // Equal specificity - default to local (safer)
        return 'local';
      }

    case 'error':
      throw new ConfigurationError(
        `Conflict detected: file matches both vault pattern "${vaultMatch.pattern}" and local pattern "${localMatch.pattern}". ` +
          `Configure conflictResolution to resolve this automatically.`
      );

    default:
      throw new ConfigurationError(`Unknown conflict resolution strategy: ${strategy}`);
  }
}

/**
 * Decide whether a file should be delegated to vault or kept local
 */
export function decideDelegation(filePath: string, config: WithContextConfig): DelegationDecision {
  const normalizedPath = normalizePath(filePath);

  // Check vault patterns
  const vaultMatch = matchPatterns(normalizedPath, config.vault);

  // Check local patterns
  const localMatch = matchPatterns(normalizedPath, config.local);

  // Case 1: Matches both vault and local - resolve conflict
  if (vaultMatch.matched && localMatch.matched) {
    return resolveConflict(vaultMatch, localMatch, config.conflictResolution);
  }

  // Case 2: Matches only vault patterns
  if (vaultMatch.matched) {
    return 'vault';
  }

  // Case 3: Matches only local patterns
  if (localMatch.matched) {
    return 'local';
  }

  // Case 4: Matches neither - use default behavior
  return config.defaultBehavior;
}

/**
 * Decide delegation for multiple files (batch operation)
 */
export function decideDelegationBatch(
  filePaths: string[],
  config: WithContextConfig
): Map<string, DelegationDecision> {
  const results = new Map<string, DelegationDecision>();

  for (const filePath of filePaths) {
    results.set(filePath, decideDelegation(filePath, config));
  }

  return results;
}

/**
 * Get delegation decision with reasoning (for debugging/preview)
 */
export interface DelegationReasoning {
  decision: DelegationDecision;
  reason: string;
  matchedVaultPattern?: string;
  matchedLocalPattern?: string;
  vaultSpecificity?: number;
  localSpecificity?: number;
}

export function decideDelegationWithReasoning(
  filePath: string,
  config: WithContextConfig
): DelegationReasoning {
  const normalizedPath = normalizePath(filePath);

  const vaultMatch = matchPatterns(normalizedPath, config.vault);
  const localMatch = matchPatterns(normalizedPath, config.local);

  // Build reasoning
  const reasoning: DelegationReasoning = {
    decision: 'local', // Default
    reason: '',
  };

  if (vaultMatch.matched && localMatch.matched) {
    // Conflict case
    reasoning.matchedVaultPattern = vaultMatch.pattern;
    reasoning.matchedLocalPattern = localMatch.pattern;
    reasoning.vaultSpecificity = vaultMatch.specificity;
    reasoning.localSpecificity = localMatch.specificity;

    const decision = resolveConflict(vaultMatch, localMatch, config.conflictResolution);
    reasoning.decision = decision;

    if (config.conflictResolution === 'most-specific-wins') {
      reasoning.reason = `Matched both vault ("${vaultMatch.pattern}", specificity: ${vaultMatch.specificity}) and local ("${localMatch.pattern}", specificity: ${localMatch.specificity}). Using most specific: ${decision}`;
    } else {
      reasoning.reason = `Matched both vault ("${vaultMatch.pattern}") and local ("${localMatch.pattern}"). Conflict resolution: ${config.conflictResolution} → ${decision}`;
    }
  } else if (vaultMatch.matched) {
    reasoning.decision = 'vault';
    reasoning.matchedVaultPattern = vaultMatch.pattern;
    reasoning.vaultSpecificity = vaultMatch.specificity;
    reasoning.reason = `Matched vault pattern: "${vaultMatch.pattern}"`;
  } else if (localMatch.matched) {
    reasoning.decision = 'local';
    reasoning.matchedLocalPattern = localMatch.pattern;
    reasoning.localSpecificity = localMatch.specificity;
    reasoning.reason = `Matched local pattern: "${localMatch.pattern}"`;
  } else {
    reasoning.decision = config.defaultBehavior;
    reasoning.reason = `No patterns matched. Using default behavior: ${config.defaultBehavior}`;
  }

  return reasoning;
}
