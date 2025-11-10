/**
 * Session state management for project context
 *
 * Maintains the current project folder context for the session.
 * Supports setting context once and using it across multiple tool calls.
 */

import { ProjectContext } from './types/index.js';
import { detectProjectFolder } from './security/folder-detector.js';
import type { SessionId } from './session/types.js';

export class SessionState {
  private currentContext: ProjectContext | null = null;
  private readFiles: Set<string> = new Set();
  private activeSessionIds: Map<string, SessionId> = new Map(); // projectFolder -> SessionId

  /**
   * Set the project context for this session
   */
  setProjectContext(projectFolder: string, basePath: string = 'Projects'): void {
    this.currentContext = {
      projectFolder,
      basePath,
    };
  }

  /**
   * Get the current project context, or detect/use default if not set
   */
  async getProjectContext(
    overrideFolder?: string,
    basePath: string = 'Projects'
  ): Promise<ProjectContext> {
    // If override provided, use it temporarily
    if (overrideFolder) {
      return {
        projectFolder: overrideFolder,
        basePath,
      };
    }

    // If context already set, use it
    if (this.currentContext) {
      return this.currentContext;
    }

    // Try to detect from git repo
    const detected = await detectProjectFolder();
    if (detected) {
      this.setProjectContext(detected, basePath);
      return this.currentContext!;
    }

    // No context available
    throw new Error(
      'No project context set. Please provide project_folder parameter or use set_project_context tool first.'
    );
  }

  /**
   * Clear the current context
   */
  clearContext(): void {
    this.currentContext = null;
  }

  /**
   * Get the current context if set (null otherwise)
   */
  getCurrentContext(): ProjectContext | null {
    return this.currentContext;
  }

  /**
   * Mark a file as read in this session
   * @param vaultPath - Path to the file (will be normalized)
   */
  markFileAsRead(vaultPath: string): void {
    this.readFiles.add(this.normalizePath(vaultPath));
  }

  /**
   * Check if a file has been read in this session
   * @param vaultPath - Path to check (will be normalized)
   * @returns true if file was read in this session
   */
  hasFileBeenRead(vaultPath: string): boolean {
    return this.readFiles.has(this.normalizePath(vaultPath));
  }

  /**
   * Clear read tracking (useful for testing or session reset)
   */
  clearReadTracking(): void {
    this.readFiles.clear();
  }

  /**
   * Set the active session ID for a project
   * @param projectFolder - Absolute path to project folder
   * @param sessionId - Session ID to track
   */
  setActiveSession(projectFolder: string, sessionId: SessionId): void {
    this.activeSessionIds.set(projectFolder, sessionId);
  }

  /**
   * Get the active session ID for a project
   * @param projectFolder - Absolute path to project folder
   * @returns Session ID if active session exists, null otherwise
   */
  getActiveSessionId(projectFolder: string): SessionId | null {
    return this.activeSessionIds.get(projectFolder) ?? null;
  }

  /**
   * Clear the active session for a project
   * @param projectFolder - Absolute path to project folder
   */
  clearActiveSession(projectFolder: string): void {
    this.activeSessionIds.delete(projectFolder);
  }

  /**
   * Clear all active sessions (useful for testing)
   */
  clearAllSessions(): void {
    this.activeSessionIds.clear();
  }

  /**
   * Normalize path for consistent tracking
   * Removes leading slashes, ensures .md extension, converts to lowercase
   */
  private normalizePath(path: string): string {
    let normalized = path.startsWith('/') ? path.slice(1) : path;
    if (!normalized.endsWith('.md')) {
      normalized += '.md';
    }
    return normalized.toLowerCase();
  }
}

// Export singleton instance
export const sessionState = new SessionState();
