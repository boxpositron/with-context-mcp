/**
 * Session Management Module
 *
 * Central export point for session persistence functionality.
 * Provides types, schemas, and utilities for session state management.
 */

// Export all types
export type {
  SessionId,
  TodoId,
  ChangelogId,
  VaultPath,
  SessionStatus,
  ChangelogType,
  ChangelogEntry,
  TodoStatus,
  TodoPriority,
  Todo,
  SessionContext,
  SessionMetadata,
  Session,
  RetentionStrategy,
  RetentionPolicy,
  SessionConfig,
  FileReadInfo,
  TodoSummary,
  ChangelogSummary,
} from './types.js';

// Export factory functions
export { createSessionId, createTodoId, createChangelogId, createVaultPath } from './types.js';

// Export type guards
export {
  isActiveSession,
  isPausedSession,
  isCompletedSession,
  isPendingTodo,
  isInProgressTodo,
  isCompletedTodo,
} from './types.js';

// Export utility functions
export { now, isExpired, formatDuration, getSessionDuration } from './types.js';

// Export Zod schemas
export {
  ChangelogTypeSchema,
  TodoStatusSchema,
  TodoPrioritySchema,
  SessionStatusSchema,
  RetentionStrategySchema,
  RetentionPolicySchema,
  SessionConfigSchema,
  ChangelogEntrySchema,
  TodoSchema,
  SessionContextSchema,
  SessionMetadataSchema,
  SessionSchema,
} from './config.js';

// Export configuration helpers
export {
  DEFAULT_RETENTION_POLICY,
  DEFAULT_SESSION_CONFIG,
  parseSessionConfig,
  safeParseSessionConfig,
  mergeWithDefaults,
  validateRetentionPolicy,
  createCountRetentionPolicy,
  createTimeRetentionPolicy,
  createNeverRetentionPolicy,
} from './config.js';

// Export persistence layer
export { VaultPersistence, SessionPaths, SessionPersistenceError } from './vault-persistence.js';
export type { SessionEnvelope } from './vault-persistence.js';

// Export session manager
export { SessionManager, SessionManagerError } from './session-manager.js';
export type { SessionManagerOptions } from './session-manager.js';
