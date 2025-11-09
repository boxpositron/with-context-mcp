/**
 * Session Manager
 *
 * Manages session lifecycle and state with hybrid persistence strategy.
 * Provides smart persistence (immediate for lifecycle, debounced for updates).
 */

import { ObsidianClient } from '../obsidian/client.js';
import { VaultPersistence, SessionPaths, SessionPersistenceError } from './vault-persistence.js';
import { Session, SessionId, SessionStatus, VaultPath, createSessionId, now } from './types.js';

// ============================================
// Custom Errors
// ============================================

/**
 * Session manager error
 */
export class SessionManagerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionManagerError';
  }
}

// ============================================
// Session Manager Options
// ============================================

/**
 * Options for session manager initialization
 */
export interface SessionManagerOptions {
  /** Debounce delay in milliseconds (default: 2000ms) */
  readonly debounceMs?: number;
  /** Inactivity timeout in milliseconds (default: 30 minutes) */
  readonly inactivityTimeoutMs?: number;
}

// ============================================
// Session Manager
// ============================================

/**
 * Manages session lifecycle and state
 *
 * Implements hybrid persistence strategy:
 * - Immediate persistence: start, pause, resume, complete, high-value changes
 * - Debounced persistence: regular updates (2s delay)
 *
 * Features:
 * - Session lifecycle management (start, pause, resume, complete)
 * - Smart persistence with backup
 * - Session archiving when completed
 * - Auto-pause after inactivity
 * - Context tracking (files, git info)
 *
 * @example
 * ```typescript
 * const manager = new SessionManager(client);
 * const session = await manager.startSession('my-project', 'My Project');
 * await manager.trackFileRead('notes/readme.md' as VaultPath);
 * await manager.completeSession();
 * ```
 */
export class SessionManager {
  private currentSession: Session | null = null;
  private persistence: VaultPersistence;
  private currentProjectFolder: string | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private readonly debounceMs: number;
  private readonly inactivityTimeoutMs: number;

  /**
   * Create a new session manager
   *
   * @param client - Obsidian client for vault operations
   * @param options - Manager options
   */
  constructor(client: ObsidianClient, options: SessionManagerOptions = {}) {
    this.persistence = new VaultPersistence(client);
    this.debounceMs = options.debounceMs ?? 2000;
    this.inactivityTimeoutMs = options.inactivityTimeoutMs ?? 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Set the project folder context
   *
   * Required before calling lifecycle methods if not set via startSession.
   *
   * @param projectFolder - Project folder name
   */
  setProjectFolder(projectFolder: string): void {
    this.currentProjectFolder = projectFolder;
  }

  /**
   * Get the current project folder
   *
   * @returns Current project folder or null if not set
   */
  getProjectFolder(): string | null {
    return this.currentProjectFolder;
  }

  // ============================================
  // Lifecycle Methods
  // ============================================

  /**
   * Start a new session
   *
   * Creates a new session and persists it immediately.
   * Throws if a session is already active.
   *
   * @param projectFolder - Project folder name
   * @param projectName - Human-readable project name
   * @returns Newly created session
   * @throws {SessionManagerError} If session already active
   */
  async startSession(projectFolder: string, projectName: string): Promise<Session> {
    if (this.currentSession) {
      throw new SessionManagerError(
        'Cannot start new session: session already active. Pause or complete current session first.'
      );
    }

    // Create new session
    const sessionId = createSessionId();
    const startTime = now();

    // Get git context if available
    const gitContext = await this.getGitContext();

    const session: Session = {
      sessionId,
      projectName,
      startTime,
      endTime: null,
      status: 'active',
      changelog: [],
      todos: [],
      context: {
        filesRead: [],
        filesModified: [],
        workingDirectory: process.cwd(),
        gitBranch: gitContext?.branch,
        lastCommit: gitContext?.lastCommit,
      },
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        toolsUsed: [],
        interactionCount: 0,
      },
    };

    this.currentSession = session;
    this.currentProjectFolder = projectFolder;

    // Persist immediately (lifecycle event)
    await this.persistImmediately();

    // Start inactivity timer
    this.resetInactivityTimer();

    return session;
  }

  /**
   * Pause the current session
   *
   * Pauses the active session and persists immediately.
   * Throws if no active session.
   *
   * @throws {SessionManagerError} If no active session
   */
  async pauseSession(): Promise<void> {
    if (!this.currentSession) {
      throw new SessionManagerError('Cannot pause: no active session');
    }

    if (this.currentSession.status !== 'active') {
      throw new SessionManagerError(`Cannot pause session in ${this.currentSession.status} state`);
    }

    // Update session status
    this.currentSession = {
      ...this.currentSession,
      status: 'paused',
    };

    // Clear timers
    this.clearTimers();

    // Persist immediately (lifecycle event)
    await this.persistImmediately();
  }

  /**
   * Resume a paused session
   *
   * Resumes a previously paused session.
   * If sessionId is provided, loads that session from vault.
   * Otherwise, resumes the current session.
   *
   * @param sessionId - Optional session ID to resume
   * @returns Resumed session
   * @throws {SessionManagerError} If session cannot be resumed
   */
  async resumeSession(sessionId?: SessionId): Promise<Session> {
    // If sessionId provided, load from vault
    if (sessionId) {
      if (!this.currentProjectFolder) {
        throw new SessionManagerError('Cannot resume: no project context');
      }

      const path = SessionPaths.getActivePath(this.currentProjectFolder, sessionId);
      const session = await this.persistence.readSession(path);

      if (session.status !== 'paused') {
        throw new SessionManagerError(`Cannot resume session in ${session.status} state`);
      }

      this.currentSession = session;
    }

    if (!this.currentSession) {
      throw new SessionManagerError('Cannot resume: no session to resume');
    }

    if (this.currentSession.status !== 'paused') {
      throw new SessionManagerError(`Cannot resume session in ${this.currentSession.status} state`);
    }

    // Update session status
    this.currentSession = {
      ...this.currentSession,
      status: 'active',
    };

    // Persist immediately (lifecycle event)
    await this.persistImmediately();

    // Restart inactivity timer
    this.resetInactivityTimer();

    return this.currentSession;
  }

  /**
   * Complete the current session
   *
   * Marks session as completed, archives it, and clears active state.
   * Throws if no active session.
   *
   * @throws {SessionManagerError} If no active session
   */
  async completeSession(): Promise<void> {
    if (!this.currentSession) {
      throw new SessionManagerError('Cannot complete: no active session');
    }

    if (!this.currentProjectFolder) {
      throw new SessionManagerError('Cannot complete: no project context');
    }

    const endTime = now();

    // Update session with completion data
    this.currentSession = {
      ...this.currentSession,
      status: 'completed',
      endTime,
    };

    // Clear timers
    this.clearTimers();

    // Archive the session
    await this.archiveSession();

    // Clear current session
    this.currentSession = null;
    this.currentProjectFolder = null;
  }

  // ============================================
  // State Update Methods
  // ============================================

  /**
   * Update session with custom updater function
   *
   * Applies the updater function to current session and triggers debounced persistence.
   * Use this for non-critical updates that can be batched.
   *
   * @param updater - Function to update session state
   * @throws {SessionManagerError} If no active session
   */
  async updateSession(updater: (session: Session) => Session): Promise<void> {
    if (!this.currentSession) {
      throw new SessionManagerError('Cannot update: no active session');
    }

    this.currentSession = updater(this.currentSession);
    this.resetInactivityTimer();

    // Check if this is a high-value change
    const isHighValue = this.isHighValueChange(this.currentSession);

    if (isHighValue) {
      // Persist immediately for important changes
      await this.persistImmediately();
    } else {
      // Debounced persistence for regular updates
      this.scheduleDebounced();
    }
  }

  // ============================================
  // Context Tracking Methods
  // ============================================

  /**
   * Track a file read operation
   *
   * Adds the file to the session's filesRead array if not already tracked.
   *
   * @param path - Vault path that was read
   */
  async trackFileRead(path: VaultPath): Promise<void> {
    await this.updateSession((session) => {
      const filesRead = session.context.filesRead;
      if (filesRead.includes(path)) {
        return session; // Already tracked
      }

      return {
        ...session,
        context: {
          ...session.context,
          filesRead: [...filesRead, path],
        },
        metadata: {
          ...session.metadata,
          interactionCount: session.metadata.interactionCount + 1,
        },
      };
    });
  }

  /**
   * Track a file modification
   *
   * Adds the file to the session's filesModified array if not already tracked.
   *
   * @param path - Local file path that was modified
   */
  async trackFileModified(path: string): Promise<void> {
    await this.updateSession((session) => {
      const filesModified = session.context.filesModified;
      if (filesModified.includes(path)) {
        return session; // Already tracked
      }

      return {
        ...session,
        context: {
          ...session.context,
          filesModified: [...filesModified, path],
        },
        metadata: {
          ...session.metadata,
          interactionCount: session.metadata.interactionCount + 1,
        },
      };
    });
  }

  // ============================================
  // Query Methods
  // ============================================

  /**
   * Get the current active session
   *
   * @returns Current session or null if none active
   */
  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Get the current session status
   *
   * @returns Session status or null if no session
   */
  getSessionStatus(): SessionStatus | null {
    return this.currentSession?.status ?? null;
  }

  // ============================================
  // Cleanup Methods
  // ============================================

  /**
   * Flush any pending changes
   *
   * Forces immediate persistence of pending changes.
   * Call this before process exit or when you need to ensure data is saved.
   */
  async flush(): Promise<void> {
    // Cancel debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Persist if we have a session
    if (this.currentSession && this.currentProjectFolder) {
      await this.persistImmediately();
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Persist session immediately with backup
   */
  private async persistImmediately(): Promise<void> {
    if (!this.currentSession || !this.currentProjectFolder) {
      return;
    }

    const path = SessionPaths.getActivePath(
      this.currentProjectFolder,
      this.currentSession.sessionId
    );

    try {
      await this.persistence.writeSession(path, this.currentSession, { backup: true });
    } catch (error) {
      throw new SessionPersistenceError(
        'Failed to persist session',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Schedule debounced persistence
   */
  private scheduleDebounced(): void {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Schedule new persistence
    this.debounceTimer = setTimeout(async () => {
      await this.persistImmediately();
      this.debounceTimer = null;
    }, this.debounceMs);
  }

  /**
   * Archive the current session
   */
  private async archiveSession(): Promise<void> {
    if (!this.currentSession || !this.currentProjectFolder) {
      return;
    }

    const activePath = SessionPaths.getActivePath(
      this.currentProjectFolder,
      this.currentSession.sessionId
    );
    const archivedPath = SessionPaths.getArchivedPath(
      this.currentProjectFolder,
      this.currentSession.sessionId,
      this.currentSession.startTime
    );

    try {
      // Write to archive location
      await this.persistence.writeSession(archivedPath, this.currentSession);

      // Delete from active location
      await this.persistence.deleteSession(activePath);
    } catch (error) {
      throw new SessionPersistenceError(
        'Failed to archive session',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if change is high-value (requires immediate persistence)
   *
   * High-value changes:
   * - Changelog entries added/modified
   * - Todos added/modified
   * - Status changes
   */
  private isHighValueChange(session: Session): boolean {
    // For now, we'll persist high-value changes immediately in updateSession
    // This is a placeholder for future logic that analyzes the change
    // Currently, lifecycle changes are already handled separately
    return session.changelog.length > 0 || session.todos.length > 0;
  }

  /**
   * Reset inactivity timer
   */
  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = setTimeout(async () => {
      // Auto-pause on inactivity
      if (this.currentSession?.status === 'active') {
        await this.pauseSession();
      }
    }, this.inactivityTimeoutMs);
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  /**
   * Get git context information
   *
   * Attempts to get current branch and last commit from git.
   * Returns null if git is not available or fails.
   */
  private async getGitContext(): Promise<{ branch?: string; lastCommit?: string } | null> {
    try {
      const { execSync } = await import('child_process');

      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();

      const lastCommit = execSync('git rev-parse --short HEAD', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();

      return { branch, lastCommit };
    } catch {
      return null;
    }
  }
}
