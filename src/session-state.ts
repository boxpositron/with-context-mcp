/**
 * Session state management for project context
 * 
 * Maintains the current project folder context for the session.
 * Supports setting context once and using it across multiple tool calls.
 */

import { ProjectContext } from './types/index.js';
import { detectProjectFolder } from './security/folder-detector.js';

export class SessionState {
  private currentContext: ProjectContext | null = null;

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
}

// Export singleton instance
export const sessionState = new SessionState();
