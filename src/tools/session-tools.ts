/**
 * Session Management Tools
 *
 * MCP tools for managing development sessions with Obsidian vault persistence.
 * Implements session lifecycle (start, pause, resume, complete) and status queries.
 */

import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { SessionManager } from '../session/index.js';
import { config } from '../config/index.js';
import { ObsidianClient } from '../obsidian/client.js';
import { sessionState } from '../session-state.js';
import { formatDuration, getSessionDuration, type SessionId } from '../session/types.js';
import { VaultPersistence, SessionPaths } from '../session/vault-persistence.js';

// ============================================
// Start Session
// ============================================

/**
 * Input schema for starting a new session
 */
export const startSessionSchema = z.object({
  project_folder: z.string().min(1).describe('Project folder name in vault (e.g., "my-project")'),
  message: z.string().optional().describe('Optional message to describe session purpose'),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;

/**
 * Start a new development session
 *
 * Creates a new session and persists it to vault immediately.
 * Sets the project context for subsequent operations.
 *
 * @param input - Session start parameters
 * @returns Session confirmation with ID and details
 * @throws {McpError} If session already active or vault connection fails
 */
export async function startSession(input: StartSessionInput): Promise<string> {
  const { project_folder, message } = input;

  try {
    // Set project context
    sessionState.setProjectContext(project_folder);

    // Initialize Obsidian client
    const client = new ObsidianClient({
      apiUrl: config.obsidianApiUrl,
      apiKey: config.obsidianApiKey,
      vault: config.obsidianVault,
      allowInsecure: config.nodeEnv === 'development',
    });

    // Create session manager
    const manager = new SessionManager(client);

    // Start session with project name
    const projectName = message || project_folder;
    const session = await manager.startSession(project_folder, projectName);

    // Store session ID in sessionState for subsequent tool calls
    sessionState.setActiveSession(project_folder, session.sessionId);

    // Calculate paths for reference
    // Calculate paths for reference
    const sessionPath = SessionPaths.getActivePath(project_folder, session.sessionId);

    return JSON.stringify(
      {
        success: true,
        session_id: session.sessionId,
        project_folder,
        project_name: projectName,
        status: session.status,
        started_at: session.startTime,
        vault_path: sessionPath,
        message: `Session started successfully${message ? `: ${message}` : ''}`,
      },
      null,
      2
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Failed to start session: ${message}`);
  }
}

// ============================================
// Pause Session
// ============================================

/**
 * Input schema for pausing a session
 */
export const pauseSessionSchema = z.object({
  project_folder: z
    .string()
    .optional()
    .describe(
      'Optional: Project folder name in vault (auto-detects from current context if omitted)'
    ),
});

export type PauseSessionInput = z.infer<typeof pauseSessionSchema>;

/**
 * Pause the current active session
 *
 * Pauses the session and persists state immediately.
 * Clears inactivity and debounce timers.
 *
 * @param input - Session pause parameters
 * @returns Confirmation with session details
 * @throws {McpError} If no active session or invalid state
 */
export async function pauseSession(input: PauseSessionInput): Promise<string> {
  let { project_folder } = input;

  try {
    // Auto-detect project folder if not provided
    if (!project_folder) {
      const context = await sessionState.getProjectContext(undefined, config.projectBasePath);
      project_folder = context.projectFolder;
    }

    // Get active session ID from sessionState
    const sessionId = sessionState.getActiveSessionId(project_folder);
    if (!sessionId) {
      throw new McpError(ErrorCode.InvalidRequest, 'No active session for this project');
    }

    // Initialize Obsidian client
    const client = new ObsidianClient({
      apiUrl: config.obsidianApiUrl,
      apiKey: config.obsidianApiKey,
      vault: config.obsidianVault,
      allowInsecure: config.nodeEnv === 'development',
    });

    // Load session from vault
    const persistence = new VaultPersistence(client);
    const sessionPath = SessionPaths.getActivePath(project_folder, sessionId);
    const session = await persistence.readSession(sessionPath);

    // Verify session can be paused
    if (session.status !== 'active') {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Cannot pause session in ${session.status} state`
      );
    }

    const duration = getSessionDuration(session);

    // Create session manager and load the session
    const manager = new SessionManager(client);
    manager.setProjectFolder(project_folder);
    // Load the session into manager, then pause it
    await manager.loadSession(sessionId);
    await manager.pauseSession();

    return JSON.stringify(
      {
        success: true,
        session_id: sessionId,
        project_folder,
        status: 'paused',
        duration: formatDuration(duration),
        files_read: session.context.filesRead.length,
        files_modified: session.context.filesModified.length,
        message: 'Session paused successfully',
      },
      null,
      2
    );
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Failed to pause session: ${message}`);
  }
}

// ============================================
// Resume Session
// ============================================

/**
 * Input schema for resuming a session
 */
export const resumeSessionSchema = z.object({
  project_folder: z
    .string()
    .optional()
    .describe(
      'Optional: Project folder name in vault (auto-detects from current context if omitted)'
    ),
  session_id: z
    .string()
    .optional()
    .describe('Optional session ID to resume (defaults to most recent paused session)'),
});

export type ResumeSessionInput = z.infer<typeof resumeSessionSchema>;

/**
 * Resume a paused session
 *
 * Resumes a previously paused session. If session_id is provided,
 * loads that specific session from vault. Otherwise, resumes the
 * current paused session.
 *
 * @param input - Session resume parameters
 * @returns Session details
 * @throws {McpError} If session cannot be resumed or not found
 */
export async function resumeSession(input: ResumeSessionInput): Promise<string> {
  let { project_folder } = input;
  const { session_id } = input;

  try {
    // Auto-detect project folder if not provided
    if (!project_folder) {
      const context = await sessionState.getProjectContext(undefined, config.projectBasePath);
      project_folder = context.projectFolder;
    }

    // Set project context
    sessionState.setProjectContext(project_folder);

    // Get session ID (from input or sessionState)
    const sessionIdToResume = session_id || sessionState.getActiveSessionId(project_folder);
    if (!sessionIdToResume) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'No session ID provided and no active session found'
      );
    }

    // Initialize Obsidian client
    const client = new ObsidianClient({
      apiUrl: config.obsidianApiUrl,
      apiKey: config.obsidianApiKey,
      vault: config.obsidianVault,
      allowInsecure: config.nodeEnv === 'development',
    });

    // Create session manager
    const manager = new SessionManager(client);
    manager.setProjectFolder(project_folder);

    // Resume session (cast string to SessionId)
    const session = await manager.resumeSession(sessionIdToResume as SessionId);

    // Update sessionState with resumed session
    sessionState.setActiveSession(project_folder, session.sessionId);

    const duration = getSessionDuration(session);

    return JSON.stringify(
      {
        success: true,
        session_id: session.sessionId,
        project_folder,
        project_name: session.projectName,
        status: session.status,
        started_at: session.startTime,
        duration: formatDuration(duration),
        files_read: session.context.filesRead.length,
        files_modified: session.context.filesModified.length,
        todos: session.todos.length,
        changelog_entries: session.changelog.length,
        message: 'Session resumed successfully',
      },
      null,
      2
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Failed to resume session: ${message}`);
  }
}

// ============================================
// End Session
// ============================================

/**
 * Input schema for ending a session
 */
export const endSessionSchema = z.object({
  project_folder: z
    .string()
    .optional()
    .describe(
      'Optional: Project folder name in vault (auto-detects from current context if omitted)'
    ),
  message: z.string().optional().describe('Optional completion message or summary'),
});

export type EndSessionInput = z.infer<typeof endSessionSchema>;

/**
 * Complete and archive the current session
 *
 * Marks session as completed, archives it to vault, and clears active state.
 * Generates a summary with duration, files tracked, and activity metrics.
 *
 * @param input - Session completion parameters
 * @returns Session summary
 * @throws {McpError} If no active session
 */
export async function endSession(input: EndSessionInput): Promise<string> {
  let { project_folder } = input;
  const { message } = input;

  try {
    // Auto-detect project folder if not provided
    if (!project_folder) {
      const context = await sessionState.getProjectContext(undefined, config.projectBasePath);
      project_folder = context.projectFolder;
    }

    // Get active session ID from sessionState
    const sessionId = sessionState.getActiveSessionId(project_folder);
    if (!sessionId) {
      throw new McpError(ErrorCode.InvalidRequest, 'No active session for this project');
    }

    // Initialize Obsidian client
    const client = new ObsidianClient({
      apiUrl: config.obsidianApiUrl,
      apiKey: config.obsidianApiKey,
      vault: config.obsidianVault,
      allowInsecure: config.nodeEnv === 'development',
    });

    // Load session from vault
    const persistence = new VaultPersistence(client);
    const sessionPath = SessionPaths.getActivePath(project_folder, sessionId);
    const session = await persistence.readSession(sessionPath);

    const duration = getSessionDuration(session);
    const filesRead = session.context.filesRead.length;
    const filesModified = session.context.filesModified.length;
    const todos = session.todos.length;
    const changelogEntries = session.changelog.length;
    const interactions = session.metadata.interactionCount;

    // Create session manager and load the session
    const manager = new SessionManager(client);
    manager.setProjectFolder(project_folder);
    // Load the session into manager (works for both active and paused)
    await manager.loadSession(sessionId);
    // Complete session (archives and clears state)
    await manager.completeSession();

    // Clear session ID from sessionState
    sessionState.clearActiveSession(project_folder);

    // Calculate archive path for reference
    const date = new Date(session.startTime);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const archivePath = `${config.projectBasePath}/${project_folder}/.sessions/archived/${yearMonth}/${sessionId}.json`;

    return JSON.stringify(
      {
        success: true,
        session_id: sessionId,
        project_folder,
        project_name: session.projectName,
        duration: formatDuration(duration),
        started_at: session.startTime,
        completed_at: new Date().toISOString(),
        summary: {
          files_read: filesRead,
          files_modified: filesModified,
          todos: todos,
          changelog_entries: changelogEntries,
          interactions: interactions,
          git_branch: session.context.gitBranch,
          last_commit: session.context.lastCommit,
        },
        archived_at: archivePath,
        message: message || 'Session completed successfully',
      },
      null,
      2
    );
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Failed to complete session: ${message}`);
  }
}

// ============================================
// Get Session Status
// ============================================

/**
 * Input schema for getting session status
 */
export const getSessionStatusSchema = z.object({
  project_folder: z
    .string()
    .optional()
    .describe(
      'Optional: Project folder name in vault (auto-detects from current context if omitted)'
    ),
});

export type GetSessionStatusInput = z.infer<typeof getSessionStatusSchema>;

/**
 * Get current session status and details
 *
 * Returns comprehensive session information including:
 * - Session ID and status
 * - Duration (for active/paused sessions)
 * - Files tracked (read/modified)
 * - Todos and changelog entries
 * - Git context
 * - Metadata (interactions, tools used)
 *
 * @param input - Status query parameters
 * @returns Session status or "no active session" message
 */
export async function getSessionStatus(input: GetSessionStatusInput): Promise<string> {
  let { project_folder } = input;

  try {
    // Auto-detect project folder if not provided
    if (!project_folder) {
      const context = await sessionState.getProjectContext(undefined, config.projectBasePath);
      project_folder = context.projectFolder;
    }

    // Get active session ID from sessionState
    const sessionId = sessionState.getActiveSessionId(project_folder);
    if (!sessionId) {
      return JSON.stringify(
        {
          success: true,
          project_folder,
          has_active_session: false,
          message: 'No active session',
        },
        null,
        2
      );
    }

    // Initialize Obsidian client
    const client = new ObsidianClient({
      apiUrl: config.obsidianApiUrl,
      apiKey: config.obsidianApiKey,
      vault: config.obsidianVault,
      allowInsecure: config.nodeEnv === 'development',
    });

    // Load session from vault
    const persistence = new VaultPersistence(client);
    const sessionPath = SessionPaths.getActivePath(project_folder, sessionId);
    const session = await persistence.readSession(sessionPath);

    const duration = getSessionDuration(session);

    // Group todos by status
    const todosByStatus = {
      pending: session.todos.filter((t) => t.status === 'pending').length,
      in_progress: session.todos.filter((t) => t.status === 'in_progress').length,
      completed: session.todos.filter((t) => t.status === 'completed').length,
      cancelled: session.todos.filter((t) => t.status === 'cancelled').length,
    };

    // Group changelog by type
    const changelogByType = {
      feature: session.changelog.filter((c) => c.type === 'feature').length,
      fix: session.changelog.filter((c) => c.type === 'fix').length,
      refactor: session.changelog.filter((c) => c.type === 'refactor').length,
      docs: session.changelog.filter((c) => c.type === 'docs').length,
      test: session.changelog.filter((c) => c.type === 'test').length,
      chore: session.changelog.filter((c) => c.type === 'chore').length,
    };

    return JSON.stringify(
      {
        success: true,
        project_folder,
        has_active_session: true,
        session: {
          session_id: session.sessionId,
          project_name: session.projectName,
          status: session.status,
          started_at: session.startTime,
          duration: formatDuration(duration),
          context: {
            files_read: session.context.filesRead.length,
            files_modified: session.context.filesModified.length,
            working_directory: session.context.workingDirectory,
            git_branch: session.context.gitBranch,
            last_commit: session.context.lastCommit,
          },
          todos: {
            total: session.todos.length,
            by_status: todosByStatus,
          },
          changelog: {
            total: session.changelog.length,
            by_type: changelogByType,
          },
          metadata: {
            environment: session.metadata.environment,
            interaction_count: session.metadata.interactionCount,
            tools_used: session.metadata.toolsUsed,
          },
        },
      },
      null,
      2
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Failed to get session status: ${message}`);
  }
}

// ============================================
// MCP Tool Schema Exports
// ============================================

/**
 * MCP tool schema for start_session
 */
export const startSessionToolSchema = {
  name: 'start_session',
  description:
    'Start a new development session. Creates a new session and persists it to vault. ' +
    'Sets the project context for subsequent operations. ' +
    'Throws error if a session is already active.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      project_folder: {
        type: 'string',
        description: 'Project folder name in vault (e.g., "my-project")',
      },
      message: {
        type: 'string',
        description: 'Optional message to describe session purpose',
      },
    },
    required: ['project_folder'],
  },
};

/**
 * MCP tool schema for pause_session
 */
export const pauseSessionToolSchema = {
  name: 'pause_session',
  description:
    'Pause the current active session. Saves session state to vault and clears timers. ' +
    'Session can be resumed later with resume_session. ' +
    'Throws error if no active session or session is already paused.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      project_folder: {
        type: 'string',
        description: 'Project folder name in vault',
      },
    },
    required: ['project_folder'],
  },
};

/**
 * MCP tool schema for resume_session
 */
export const resumeSessionToolSchema = {
  name: 'resume_session',
  description:
    'Resume a paused session. If session_id is provided, loads that specific session from vault. ' +
    'Otherwise, resumes the current paused session. ' +
    'Throws error if session cannot be resumed or not found.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      project_folder: {
        type: 'string',
        description: 'Project folder name in vault',
      },
      session_id: {
        type: 'string',
        description: 'Optional session ID to resume (defaults to most recent paused session)',
      },
    },
    required: ['project_folder'],
  },
};

/**
 * MCP tool schema for end_session
 */
export const endSessionToolSchema = {
  name: 'end_session',
  description:
    'Complete and archive the current session. Marks session as completed, saves final state to vault archive, ' +
    'and clears active session. Generates comprehensive summary with duration, files tracked, and activity metrics. ' +
    'Throws error if no active session.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      project_folder: {
        type: 'string',
        description: 'Project folder name in vault',
      },
      message: {
        type: 'string',
        description: 'Optional completion message or summary',
      },
    },
    required: ['project_folder'],
  },
};

/**
 * MCP tool schema for get_session_status
 */
export const getSessionStatusToolSchema = {
  name: 'get_session_status',
  description:
    'Get current session status and comprehensive details. Returns session information including ' +
    'ID, status, duration, files tracked, todos, changelog entries, git context, and metadata. ' +
    'Returns "no active session" message if no session is active.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      project_folder: {
        type: 'string',
        description: 'Project folder name in vault',
      },
    },
    required: ['project_folder'],
  },
};
