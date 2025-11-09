/**
 * Session Configuration
 *
 * Zod schemas for runtime validation of session configuration.
 * Schemas serve as single source of truth for types and validation.
 */

import { z } from 'zod';
import type { RetentionPolicy, SessionConfig } from './types.js';

// ============================================
// Zod Schemas (Runtime Validation)
// ============================================

/**
 * Changelog type schema
 */
export const ChangelogTypeSchema = z.enum(['feature', 'fix', 'refactor', 'docs', 'test', 'chore']);

/**
 * Todo status schema
 */
export const TodoStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

/**
 * Todo priority schema
 */
export const TodoPrioritySchema = z.enum(['high', 'medium', 'low']);

/**
 * Session status schema
 */
export const SessionStatusSchema = z.enum(['active', 'paused', 'completed']);

/**
 * Retention strategy schema
 */
export const RetentionStrategySchema = z.enum(['count', 'time', 'never']);

/**
 * Retention policy schema
 */
export const RetentionPolicySchema = z.object({
  strategy: RetentionStrategySchema,
  maxSessions: z.number().int().positive().optional(),
  maxDays: z.number().int().positive().optional(),
});

/**
 * Session configuration schema
 */
export const SessionConfigSchema = z.object({
  retentionPolicy: RetentionPolicySchema,
  autoSessionTimeout: z.number().int().positive().default(30), // minutes
  changelogPromptThreshold: z.number().int().positive().default(5), // file count
});

/**
 * Changelog entry schema
 */
export const ChangelogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  type: ChangelogTypeSchema,
  message: z.string().min(1),
  files: z.array(z.string()),
  impact: z.string().optional(),
  userConfirmed: z.boolean().default(false),
});

/**
 * Todo schema
 */
export const TodoSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
  status: TodoStatusSchema,
  priority: TodoPrioritySchema,
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  sessionId: z.string(),
});

/**
 * Session context schema
 */
export const SessionContextSchema = z.object({
  filesRead: z.array(z.string()),
  filesModified: z.array(z.string()),
  workingDirectory: z.string(),
  gitBranch: z.string().optional(),
  lastCommit: z.string().optional(),
});

/**
 * Session metadata schema
 */
export const SessionMetadataSchema = z.object({
  environment: z.string().default('development'),
  toolsUsed: z.array(z.string()).default([]),
  interactionCount: z.number().int().nonnegative().default(0),
});

/**
 * Complete session schema
 */
export const SessionSchema = z.object({
  sessionId: z.string(),
  projectName: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().nullable(),
  status: SessionStatusSchema,
  changelog: z.array(ChangelogEntrySchema).default([]),
  todos: z.array(TodoSchema).default([]),
  context: SessionContextSchema,
  metadata: SessionMetadataSchema,
});

// ============================================
// Default Configurations
// ============================================

/**
 * Default retention policy: keep last 30 sessions
 */
export const DEFAULT_RETENTION_POLICY: RetentionPolicy = {
  strategy: 'count',
  maxSessions: 30,
};

/**
 * Default session configuration
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  retentionPolicy: DEFAULT_RETENTION_POLICY,
  autoSessionTimeout: 30, // 30 minutes
  changelogPromptThreshold: 5, // Prompt after 5 file changes
};

// ============================================
// Configuration Helpers
// ============================================

/**
 * Validate and parse session configuration
 *
 * @param data - Raw configuration data
 * @returns Validated session configuration
 * @throws ZodError if validation fails
 */
export function parseSessionConfig(data: unknown): SessionConfig {
  return SessionConfigSchema.parse(data);
}

/**
 * Safely parse session configuration
 *
 * @param data - Raw configuration data
 * @returns Validation result with data or error
 */
export function safeParseSessionConfig(data: unknown) {
  return SessionConfigSchema.safeParse(data);
}

/**
 * Merge custom configuration with defaults
 *
 * @param custom - Custom configuration (partial)
 * @returns Complete configuration with defaults applied
 */
export function mergeWithDefaults(custom: Partial<SessionConfig>): SessionConfig {
  return {
    retentionPolicy: custom.retentionPolicy || DEFAULT_SESSION_CONFIG.retentionPolicy,
    autoSessionTimeout: custom.autoSessionTimeout ?? DEFAULT_SESSION_CONFIG.autoSessionTimeout,
    changelogPromptThreshold:
      custom.changelogPromptThreshold ?? DEFAULT_SESSION_CONFIG.changelogPromptThreshold,
  };
}

/**
 * Validate retention policy constraints
 *
 * Ensures that the retention policy has required fields based on strategy.
 */
export function validateRetentionPolicy(policy: RetentionPolicy): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (policy.strategy === 'count' && !policy.maxSessions) {
    errors.push('count strategy requires maxSessions');
  }

  if (policy.strategy === 'time' && !policy.maxDays) {
    errors.push('time strategy requires maxDays');
  }

  if (policy.strategy === 'count' && policy.maxSessions && policy.maxSessions < 1) {
    errors.push('maxSessions must be at least 1');
  }

  if (policy.strategy === 'time' && policy.maxDays && policy.maxDays < 1) {
    errors.push('maxDays must be at least 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create retention policy for count-based strategy
 */
export function createCountRetentionPolicy(maxSessions: number): RetentionPolicy {
  if (maxSessions < 1) {
    throw new Error('maxSessions must be at least 1');
  }
  return {
    strategy: 'count',
    maxSessions,
  };
}

/**
 * Create retention policy for time-based strategy
 */
export function createTimeRetentionPolicy(maxDays: number): RetentionPolicy {
  if (maxDays < 1) {
    throw new Error('maxDays must be at least 1');
  }
  return {
    strategy: 'time',
    maxDays,
  };
}

/**
 * Create retention policy for never delete strategy
 */
export function createNeverRetentionPolicy(): RetentionPolicy {
  return {
    strategy: 'never',
  };
}
