/**
 * Session State Types
 *
 * Type definitions for session persistence, changelog tracking, and todo management.
 * Follows TypeScript best practices for state management and serialization.
 */

// ============================================
// Branded Types for Type Safety
// ============================================

/**
 * Branded type for session IDs
 * Prevents accidentally mixing session IDs with other string types
 */
declare const __sessionIdBrand: unique symbol;
export type SessionId = string & { [__sessionIdBrand]: 'SessionId' };

/**
 * Branded type for todo IDs
 * Ensures todo IDs can't be confused with session IDs
 */
declare const __todoIdBrand: unique symbol;
export type TodoId = string & { [__todoIdBrand]: 'TodoId' };

/**
 * Branded type for changelog entry IDs
 */
declare const __changelogIdBrand: unique symbol;
export type ChangelogId = string & { [__changelogIdBrand]: 'ChangelogId' };

/**
 * Branded type for vault paths
 * Ensures paths are normalized and validated
 */
declare const __vaultPathBrand: unique symbol;
export type VaultPath = string & { [__vaultPathBrand]: 'VaultPath' };

// ============================================
// Session Status (Discriminated Union)
// ============================================

/**
 * Session lifecycle status
 *
 * Uses discriminated union for type-safe state management.
 * Each status carries only the data relevant to that state.
 */
export type SessionStatus = 'active' | 'paused' | 'completed';

// ============================================
// Changelog Types
// ============================================

/**
 * Changelog entry type
 * Based on conventional commits specification
 */
export type ChangelogType = 'feature' | 'fix' | 'refactor' | 'docs' | 'test' | 'chore';

/**
 * Single changelog entry
 *
 * Tracks a specific change made during the session.
 * User categorizes the change type and provides description.
 */
export interface ChangelogEntry {
  readonly id: ChangelogId;
  readonly timestamp: string; // ISO 8601
  readonly type: ChangelogType;
  readonly message: string;
  readonly files: readonly string[];
  readonly impact?: string; // e.g., "Breaking change: removed legacy support"
  readonly userConfirmed: boolean; // Semi-automatic: user must confirm
}

// ============================================
// Todo Types
// ============================================

/**
 * Todo status lifecycle
 */
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Todo priority levels
 */
export type TodoPriority = 'high' | 'medium' | 'low';

/**
 * Single todo item
 *
 * Persists across sessions, tracked per project.
 */
export interface Todo {
  readonly id: TodoId;
  readonly content: string;
  readonly status: TodoStatus;
  readonly priority: TodoPriority;
  readonly createdAt: string; // ISO 8601
  readonly completedAt: string | null; // ISO 8601 when completed
  readonly sessionId: SessionId; // Which session created this todo
}

// ============================================
// Session Context
// ============================================

/**
 * Session context information
 *
 * Tracks the working environment and git state during the session.
 */
export interface SessionContext {
  readonly filesRead: readonly VaultPath[];
  readonly filesModified: readonly string[]; // Local repo files
  readonly workingDirectory: string;
  readonly gitBranch?: string;
  readonly lastCommit?: string;
}

/**
 * Session metadata
 *
 * Tracks usage and interaction patterns.
 */
export interface SessionMetadata {
  readonly environment: string; // 'development' | 'production'
  readonly toolsUsed: readonly string[];
  readonly interactionCount: number;
}

// ============================================
// Core Session Interface
// ============================================

/**
 * Complete session state
 *
 * Represents a single work session on a project.
 * Serializable to JSON for vault persistence.
 */
export interface Session {
  readonly sessionId: SessionId;
  readonly projectName: string;
  readonly startTime: string; // ISO 8601
  readonly endTime: string | null; // ISO 8601, null if active
  readonly status: SessionStatus;

  // Core tracking
  readonly changelog: readonly ChangelogEntry[];
  readonly todos: readonly Todo[];

  // Context
  readonly context: SessionContext;

  // Metadata
  readonly metadata: SessionMetadata;
}

// ============================================
// Session Configuration
// ============================================

/**
 * Retention policy strategy
 */
export type RetentionStrategy = 'count' | 'time' | 'never';

/**
 * Session retention policy
 *
 * Controls when old sessions are archived or deleted.
 */
export interface RetentionPolicy {
  readonly strategy: RetentionStrategy;
  readonly maxSessions?: number; // For 'count' strategy
  readonly maxDays?: number; // For 'time' strategy
}

/**
 * Session configuration per project
 *
 * Stored in .sessions/config.json in vault.
 */
export interface SessionConfig {
  readonly retentionPolicy: RetentionPolicy;
  readonly autoSessionTimeout: number; // Minutes of inactivity before pause
  readonly changelogPromptThreshold: number; // Min file changes before prompting
}

// ============================================
// File Tracking
// ============================================

/**
 * File read tracking information
 *
 * Enhanced tracking beyond simple existence check.
 */
export interface FileReadInfo {
  readonly path: VaultPath;
  readonly firstReadAt: string; // ISO 8601
  readonly lastReadAt: string; // ISO 8601
  readonly readCount: number;
}

// ============================================
// Aggregated Views
// ============================================

/**
 * Aggregated todo summary across all sessions
 */
export interface TodoSummary {
  readonly total: number;
  readonly byStatus: Readonly<Record<TodoStatus, number>>;
  readonly byPriority: Readonly<Record<TodoPriority, number>>;
  readonly todos: readonly Todo[];
}

/**
 * Changelog summary for generating commit messages
 */
export interface ChangelogSummary {
  readonly entries: readonly ChangelogEntry[];
  readonly byType: Readonly<Record<ChangelogType, number>>;
  readonly filesChanged: readonly string[];
  readonly hasBreakingChanges: boolean;
}

// ============================================
// Factory Functions for Branded Types
// ============================================

/**
 * Create a new session ID
 *
 * Format: sess_{timestamp}_{random}
 */
export function createSessionId(): SessionId {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `sess_${timestamp}_${random}` as SessionId;
}

/**
 * Create a new todo ID
 *
 * Format: todo_{timestamp}_{random}
 */
export function createTodoId(): TodoId {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `todo_${timestamp}_${random}` as TodoId;
}

/**
 * Create a new changelog entry ID
 *
 * Format: chlog_{timestamp}_{random}
 */
export function createChangelogId(): ChangelogId {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `chlog_${timestamp}_${random}` as ChangelogId;
}

/**
 * Create and validate a vault path
 *
 * Normalizes path format and ensures .md extension.
 */
export function createVaultPath(raw: string): VaultPath {
  let normalized = raw.startsWith('/') ? raw.slice(1) : raw;
  if (!normalized.endsWith('.md')) {
    normalized += '.md';
  }
  return normalized.toLowerCase() as VaultPath;
}

// ============================================
// Type Guards
// ============================================

/**
 * Check if session is active
 */
export function isActiveSession(status: SessionStatus): boolean {
  return status === 'active';
}

/**
 * Check if session is paused
 */
export function isPausedSession(status: SessionStatus): boolean {
  return status === 'paused';
}

/**
 * Check if session is completed
 */
export function isCompletedSession(status: SessionStatus): boolean {
  return status === 'completed';
}

/**
 * Check if todo is pending
 */
export function isPendingTodo(todo: Todo): boolean {
  return todo.status === 'pending';
}

/**
 * Check if todo is in progress
 */
export function isInProgressTodo(todo: Todo): boolean {
  return todo.status === 'in_progress';
}

/**
 * Check if todo is completed
 */
export function isCompletedTodo(todo: Todo): boolean {
  return todo.status === 'completed';
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get current timestamp in ISO 8601 format
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Check if timestamp is expired based on TTL
 */
export function isExpired(timestamp: string, ttlMs: number): boolean {
  return Date.now() - new Date(timestamp).getTime() > ttlMs;
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Calculate session duration
 */
export function getSessionDuration(session: Session): number {
  const start = new Date(session.startTime).getTime();
  const end = session.endTime ? new Date(session.endTime).getTime() : Date.now();
  return end - start;
}
