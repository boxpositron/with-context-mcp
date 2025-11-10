/**
 * Changelog and Todo Management Tools
 *
 * MCP tools for tracking changes and todos within development sessions.
 * Provides semi-automatic changelog tracking and persistent todo management.
 */

import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { SessionManager } from '../session/index.js';
import { config } from '../config/index.js';
import { ObsidianClient } from '../obsidian/client.js';
import { sessionState } from '../session-state.js';
import { SessionPaths, VaultPersistence } from '../session/vault-persistence.js';
import {
  type ChangelogEntry,
  type ChangelogType,
  type Todo,
  type TodoStatus,
  type TodoPriority,
  type Session,
  createChangelogId,
  createTodoId,
  now,
} from '../session/types.js';

// ============================================
// Helper Functions
// ============================================

/**
 * Initialize SessionManager and load active session from vault
 *
 * This function creates a SessionManager and loads the active session from the vault
 * using the session ID stored in sessionState. Since each tool call creates a new
 * SessionManager instance, we need to explicitly load the session from persistent storage.
 *
 * @param projectFolder - Project folder name
 * @returns SessionManager instance with loaded session
 * @throws {McpError} If no active session found
 */
async function getSessionManager(
  projectFolder: string
): Promise<{ manager: SessionManager; session: Session }> {
  // Get active session ID from sessionState
  const sessionId = sessionState.getActiveSessionId(projectFolder);
  if (!sessionId) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `No active session for project "${projectFolder}". Please start a session first using start_session.`
    );
  }

  // Initialize Obsidian client
  const client = new ObsidianClient({
    apiUrl: config.obsidianApiUrl,
    apiKey: config.obsidianApiKey,
    vault: config.obsidianVault,
    allowInsecure: config.nodeEnv === 'development',
  });

  // Create session manager and persistence layer
  const manager = new SessionManager(client);
  manager.setProjectFolder(projectFolder);
  const persistence = new VaultPersistence(client);

  try {
    // Load session from vault
    const sessionPath = SessionPaths.getActivePath(projectFolder, sessionId);
    const session = await persistence.readSession(sessionPath);

    // Verify session can be used
    if (session.status !== 'active' && session.status !== 'paused') {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Session ${sessionId} is ${session.status}. Only active or paused sessions can be used.`
      );
    }

    // Load session into manager without changing status
    await manager.loadSession(sessionId);

    // Get the now-loaded session from manager
    const loadedSession = manager.getCurrentSession();
    if (!loadedSession) {
      throw new McpError(ErrorCode.InternalError, 'Failed to load session into manager');
    }

    return { manager, session: loadedSession };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to load active session for project "${projectFolder}": ${message}`
    );
  }
}

/**
 * Format changelog entries grouped by type
 *
 * @param entries - Changelog entries to format
 * @returns Formatted string
 */
function formatChangelog(entries: readonly ChangelogEntry[]): string {
  if (entries.length === 0) {
    return 'No changelog entries';
  }

  const grouped: Record<ChangelogType, ChangelogEntry[]> = {
    feature: [],
    fix: [],
    refactor: [],
    docs: [],
    test: [],
    chore: [],
  };

  // Group by type
  for (const entry of entries) {
    grouped[entry.type].push(entry);
  }

  const sections: string[] = [];

  // Format each type section
  const typeLabels: Record<ChangelogType, string> = {
    feature: 'Features',
    fix: 'Bug Fixes',
    refactor: 'Refactoring',
    docs: 'Documentation',
    test: 'Tests',
    chore: 'Chores',
  };

  for (const [type, label] of Object.entries(typeLabels) as [ChangelogType, string][]) {
    const items = grouped[type];
    if (items.length === 0) continue;

    sections.push(`\n${label}:`);
    for (const item of items) {
      const breaking = item.impact ? ` ⚠ ${item.impact}` : '';
      const fileCount = item.files.length > 0 ? ` (${item.files.length} files)` : '';
      sections.push(`  - ${item.message}${fileCount}${breaking}`);
    }
  }

  return sections.join('\n');
}

/**
 * Format todos grouped by status
 *
 * @param todos - Todos to format
 * @param statusFilter - Optional status filter
 * @param priorityFilter - Optional priority filter
 * @returns Formatted string
 */
function formatTodos(
  todos: readonly Todo[],
  statusFilter?: TodoStatus,
  priorityFilter?: TodoPriority
): string {
  let filtered = [...todos];

  // Apply filters
  if (statusFilter) {
    filtered = filtered.filter((t) => t.status === statusFilter);
  }
  if (priorityFilter) {
    filtered = filtered.filter((t) => t.priority === priorityFilter);
  }

  if (filtered.length === 0) {
    return 'No todos found';
  }

  // Group by status
  const grouped: Record<TodoStatus, Todo[]> = {
    pending: [],
    in_progress: [],
    completed: [],
    cancelled: [],
  };

  for (const todo of filtered) {
    grouped[todo.status].push(todo);
  }

  const sections: string[] = [];
  const prioritySymbols: Record<TodoPriority, string> = {
    high: '🔴',
    medium: '🟡',
    low: '🔵',
  };

  const statusLabels: Record<TodoStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  // Format each status section
  for (const [status, label] of Object.entries(statusLabels) as [TodoStatus, string][]) {
    const items = grouped[status];
    if (items.length === 0) continue;

    sections.push(`\n${label} (${items.length}):`);
    for (const item of items) {
      const priority = prioritySymbols[item.priority];
      const completed = item.completedAt ? ` (completed ${item.completedAt})` : '';
      sections.push(`  ${priority} [${item.id}] ${item.content}${completed}`);
    }
  }

  return sections.join('\n');
}

// ============================================
// Add Changelog Entry
// ============================================

/**
 * Input schema for adding changelog entry
 */
export const addChangelogEntrySchema = z.object({
  project_folder: z.string().min(1).describe('Project folder name in vault'),
  type: z
    .enum(['feature', 'fix', 'refactor', 'docs', 'test', 'chore'])
    .describe('Type of change (conventional commit type)'),
  message: z.string().min(1).describe('Description of the change'),
  files: z.array(z.string()).optional().describe('Optional: Files affected by this change'),
  breaking: z.boolean().optional().describe('Optional: Whether this is a breaking change'),
});

export type AddChangelogEntryInput = z.infer<typeof addChangelogEntrySchema>;

/**
 * Add a changelog entry to the current session
 *
 * Creates a new changelog entry with user-provided information.
 * Entry is immediately persisted to the session state in vault.
 *
 * @param input - Changelog entry parameters
 * @returns Confirmation with entry details
 * @throws {McpError} If no active session
 */
export async function addChangelogEntry(input: AddChangelogEntryInput): Promise<string> {
  const { project_folder, type, message, files = [], breaking = false } = input;

  try {
    // Set project context
    sessionState.setProjectContext(project_folder);

    // Get session manager
    const { manager, session } = await getSessionManager(project_folder);

    // Create changelog entry
    const entry: ChangelogEntry = {
      id: createChangelogId(),
      timestamp: now(),
      type,
      message,
      files,
      impact: breaking ? 'Breaking change' : undefined,
      userConfirmed: true,
    };

    // Update session with new entry
    await manager.updateSession((s) => ({
      ...s,
      changelog: [...s.changelog, entry],
    }));

    return JSON.stringify(
      {
        success: true,
        entry_id: entry.id,
        type,
        message,
        files_count: files.length,
        breaking,
        total_entries: session.changelog.length + 1,
        message_text: `✓ Changelog entry added successfully`,
      },
      null,
      2
    );
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Failed to add changelog entry: ${message}`);
  }
}

// ============================================
// Get Session Changelog
// ============================================

/**
 * Input schema for getting session changelog
 */
export const getSessionChangelogSchema = z.object({
  project_folder: z.string().min(1).describe('Project folder name in vault'),
});

export type GetSessionChangelogInput = z.infer<typeof getSessionChangelogSchema>;

/**
 * View changelog for current session
 *
 * Returns all changelog entries grouped by type.
 * Shows file counts and breaking changes.
 *
 * @param input - Query parameters
 * @returns Formatted changelog
 * @throws {McpError} If no active session
 */
export async function getSessionChangelog(input: GetSessionChangelogInput): Promise<string> {
  const { project_folder } = input;

  try {
    // Get session manager
    const { session } = await getSessionManager(project_folder);

    // Count by type
    const byType: Record<ChangelogType, number> = {
      feature: 0,
      fix: 0,
      refactor: 0,
      docs: 0,
      test: 0,
      chore: 0,
    };

    const allFiles = new Set<string>();
    let hasBreaking = false;

    for (const entry of session.changelog) {
      byType[entry.type]++;
      entry.files.forEach((f) => allFiles.add(f));
      if (entry.impact) {
        hasBreaking = true;
      }
    }

    const formatted = formatChangelog(session.changelog);

    return JSON.stringify(
      {
        success: true,
        project_folder,
        session_id: session.sessionId,
        total_entries: session.changelog.length,
        by_type: byType,
        files_changed: allFiles.size,
        has_breaking_changes: hasBreaking,
        changelog: formatted,
      },
      null,
      2
    );
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Failed to get changelog: ${message}`);
  }
}

// ============================================
// Get Commit Suggestion
// ============================================

/**
 * Input schema for getting commit suggestion
 */
export const getCommitSuggestionSchema = z.object({
  project_folder: z.string().min(1).describe('Project folder name in vault'),
  conventional: z
    .boolean()
    .optional()
    .default(true)
    .describe('Use conventional commit format (default: true)'),
});

export type GetCommitSuggestionInput = z.infer<typeof getCommitSuggestionSchema>;

/**
 * Generate commit message from session changelog
 *
 * Analyzes changelog entries and generates a conventional commit message.
 * Determines primary type based on most common change type.
 *
 * @param input - Generation parameters
 * @returns Suggested commit message
 * @throws {McpError} If no active session or no changelog entries
 */
export async function getCommitSuggestion(input: GetCommitSuggestionInput): Promise<string> {
  const { project_folder, conventional = true } = input;

  try {
    // Get session manager
    const { session } = await getSessionManager(project_folder);

    if (session.changelog.length === 0) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Cannot generate commit message: no changelog entries. Add entries using add_changelog_entry first.'
      );
    }

    // Count by type to determine primary type
    const byType: Record<ChangelogType, number> = {
      feature: 0,
      fix: 0,
      refactor: 0,
      docs: 0,
      test: 0,
      chore: 0,
    };

    const allFiles = new Set<string>();
    let hasBreaking = false;
    const breakingChanges: string[] = [];

    for (const entry of session.changelog) {
      byType[entry.type]++;
      entry.files.forEach((f) => allFiles.add(f));
      if (entry.impact) {
        hasBreaking = true;
        breakingChanges.push(entry.message);
      }
    }

    // Determine primary type (most common)
    let primaryType: ChangelogType = 'chore';
    let maxCount = 0;
    const typePriority: ChangelogType[] = ['feature', 'fix', 'refactor', 'docs', 'test', 'chore'];

    for (const type of typePriority) {
      if (byType[type] > maxCount) {
        maxCount = byType[type];
        primaryType = type;
      }
    }

    // Generate scope (if git branch available)
    const scope = session.context.gitBranch || 'session';

    // Generate title
    let title: string;
    if (conventional) {
      const breakingMarker = hasBreaking ? '!' : '';
      title = `${primaryType}(${scope})${breakingMarker}: ${session.projectName}`;
    } else {
      title = session.projectName;
    }

    // Generate body from changelog entries
    const bodyLines: string[] = [];

    // Group by type for body
    const grouped: Record<ChangelogType, ChangelogEntry[]> = {
      feature: [],
      fix: [],
      refactor: [],
      docs: [],
      test: [],
      chore: [],
    };

    for (const entry of session.changelog) {
      grouped[entry.type].push(entry);
    }

    // Add each type section
    for (const type of typePriority) {
      const items = grouped[type];
      if (items.length === 0) continue;

      for (const item of items) {
        bodyLines.push(`- ${item.message}`);
      }
    }

    const body = bodyLines.join('\n');

    // Generate footer for breaking changes
    let footer = '';
    if (hasBreaking) {
      footer = '\n\nBREAKING CHANGE:\n' + breakingChanges.map((c) => `- ${c}`).join('\n');
    }

    // Combine into full message
    const fullMessage = `${title}\n\n${body}${footer}`;

    return JSON.stringify(
      {
        success: true,
        project_folder,
        session_id: session.sessionId,
        commit_message: {
          title,
          body,
          footer: footer || undefined,
          full: fullMessage,
        },
        metadata: {
          primary_type: primaryType,
          total_entries: session.changelog.length,
          files_changed: allFiles.size,
          breaking_changes: hasBreaking,
        },
      },
      null,
      2
    );
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Failed to generate commit suggestion: ${message}`);
  }
}

// ============================================
// Add Todo
// ============================================

/**
 * Input schema for adding todo
 */
export const addTodoSchema = z.object({
  project_folder: z.string().min(1).describe('Project folder name in vault'),
  content: z.string().min(1).describe('Todo content/description'),
  priority: z
    .enum(['high', 'medium', 'low'])
    .optional()
    .default('medium')
    .describe('Priority level (default: medium)'),
});

export type AddTodoInput = z.infer<typeof addTodoSchema>;

/**
 * Add a todo to the current session
 *
 * Creates a new todo item that persists across sessions.
 * Todo is immediately saved to session state in vault.
 *
 * @param input - Todo parameters
 * @returns Todo confirmation with ID
 * @throws {McpError} If no active session
 */
export async function addTodo(input: AddTodoInput): Promise<string> {
  const { project_folder, content, priority = 'medium' } = input;

  try {
    // Set project context
    sessionState.setProjectContext(project_folder);

    // Get session manager
    const { manager, session } = await getSessionManager(project_folder);

    // Create todo
    const todo: Todo = {
      id: createTodoId(),
      content,
      status: 'pending',
      priority,
      createdAt: now(),
      completedAt: null,
      sessionId: session.sessionId,
    };

    // Update session with new todo
    await manager.updateSession((s) => ({
      ...s,
      todos: [...s.todos, todo],
    }));

    const prioritySymbols: Record<TodoPriority, string> = {
      high: '🔴',
      medium: '🟡',
      low: '🔵',
    };

    return JSON.stringify(
      {
        success: true,
        todo_id: todo.id,
        content,
        priority,
        status: 'pending',
        total_todos: session.todos.length + 1,
        message: `✓ Todo added successfully ${prioritySymbols[priority]}`,
      },
      null,
      2
    );
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Failed to add todo: ${message}`);
  }
}

// ============================================
// Update Todo
// ============================================

/**
 * Input schema for updating todo
 */
export const updateTodoSchema = z.object({
  project_folder: z.string().min(1).describe('Project folder name in vault'),
  todo_id: z.string().min(1).describe('Todo ID to update'),
  status: z
    .enum(['pending', 'in_progress', 'completed', 'cancelled'])
    .optional()
    .describe('New status'),
  priority: z.enum(['high', 'medium', 'low']).optional().describe('New priority'),
});

export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

/**
 * Update todo status or priority
 *
 * Updates an existing todo's status and/or priority.
 * Automatically sets completedAt when status changes to completed.
 *
 * @param input - Update parameters
 * @returns Updated todo details
 * @throws {McpError} If no active session or todo not found
 */
export async function updateTodo(input: UpdateTodoInput): Promise<string> {
  const { project_folder, todo_id, status, priority } = input;

  try {
    // Get session manager
    const { manager, session } = await getSessionManager(project_folder);

    // Find todo
    const todoIndex = session.todos.findIndex((t) => t.id === todo_id);
    if (todoIndex === -1) {
      throw new McpError(ErrorCode.InvalidRequest, `Todo not found: ${todo_id}`);
    }

    const currentTodo = session.todos[todoIndex];

    // Update todo
    const updatedTodo: Todo = {
      ...currentTodo,
      status: status ?? currentTodo.status,
      priority: priority ?? currentTodo.priority,
      completedAt:
        status === 'completed' && !currentTodo.completedAt
          ? now()
          : status && status !== 'completed'
            ? null
            : currentTodo.completedAt,
    };

    // Update session with modified todo
    await manager.updateSession((s) => ({
      ...s,
      todos: [...s.todos.slice(0, todoIndex), updatedTodo, ...s.todos.slice(todoIndex + 1)],
    }));

    return JSON.stringify(
      {
        success: true,
        todo_id,
        content: updatedTodo.content,
        status: updatedTodo.status,
        priority: updatedTodo.priority,
        completed_at: updatedTodo.completedAt,
        message: `✓ Todo updated successfully`,
      },
      null,
      2
    );
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Failed to update todo: ${message}`);
  }
}

// ============================================
// List Todos
// ============================================

/**
 * Input schema for listing todos
 */
export const listTodosSchema = z.object({
  project_folder: z.string().min(1).describe('Project folder name in vault'),
  status: z
    .enum(['pending', 'in_progress', 'completed', 'cancelled'])
    .optional()
    .describe('Filter by status'),
  priority: z.enum(['high', 'medium', 'low']).optional().describe('Filter by priority'),
});

export type ListTodosInput = z.infer<typeof listTodosSchema>;

/**
 * List todos from current session
 *
 * Returns all todos, optionally filtered by status and/or priority.
 * Todos are grouped by status with counts and priority indicators.
 *
 * @param input - List parameters with optional filters
 * @returns Formatted todo list
 * @throws {McpError} If no active session
 */
export async function listTodos(input: ListTodosInput): Promise<string> {
  const { project_folder, status, priority } = input;

  try {
    // Get session manager
    const { session } = await getSessionManager(project_folder);

    // Count by status and priority
    const byStatus: Record<TodoStatus, number> = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    const byPriority: Record<TodoPriority, number> = {
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const todo of session.todos) {
      byStatus[todo.status]++;
      byPriority[todo.priority]++;
    }

    const formatted = formatTodos(session.todos, status, priority);

    return JSON.stringify(
      {
        success: true,
        project_folder,
        session_id: session.sessionId,
        total_todos: session.todos.length,
        by_status: byStatus,
        by_priority: byPriority,
        filters: {
          status: status ?? 'none',
          priority: priority ?? 'none',
        },
        todos: formatted,
      },
      null,
      2
    );
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Failed to list todos: ${message}`);
  }
}

// ============================================
// MCP Tool Schema Exports
// ============================================

/**
 * MCP tool schema for add_changelog_entry
 */
export const addChangelogEntryToolSchema = {
  name: 'add_changelog_entry',
  description:
    'Add a changelog entry to the current session. User provides type and message for semi-automatic tracking. ' +
    'Entry is immediately persisted to session state. Requires an active session.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      project_folder: {
        type: 'string',
        description: 'Project folder name in vault',
      },
      type: {
        type: 'string',
        enum: ['feature', 'fix', 'refactor', 'docs', 'test', 'chore'],
        description: 'Type of change (conventional commit type)',
      },
      message: {
        type: 'string',
        description: 'Description of the change',
      },
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional: Files affected by this change',
      },
      breaking: {
        type: 'boolean',
        description: 'Optional: Whether this is a breaking change',
      },
    },
    required: ['project_folder', 'type', 'message'],
  },
};

/**
 * MCP tool schema for get_session_changelog
 */
export const getSessionChangelogToolSchema = {
  name: 'get_session_changelog',
  description:
    'View changelog for the current session. Returns all entries grouped by type with file counts and breaking change indicators. ' +
    'Requires an active session.',
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
 * MCP tool schema for get_commit_suggestion
 */
export const getCommitSuggestionToolSchema = {
  name: 'get_commit_suggestion',
  description:
    'Generate a commit message from session changelog. Analyzes entries to determine primary type and formats as conventional commit. ' +
    'Includes all changes as bullet points and detects breaking changes. Requires an active session with changelog entries.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      project_folder: {
        type: 'string',
        description: 'Project folder name in vault',
      },
      conventional: {
        type: 'boolean',
        description: 'Use conventional commit format (default: true)',
      },
    },
    required: ['project_folder'],
  },
};

/**
 * MCP tool schema for add_todo
 */
export const addTodoToolSchema = {
  name: 'add_todo',
  description:
    'Add a todo to the current session. Todos persist across sessions and are tracked per project. ' +
    'Immediately saved to session state in vault. Requires an active session.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      project_folder: {
        type: 'string',
        description: 'Project folder name in vault',
      },
      content: {
        type: 'string',
        description: 'Todo content/description',
      },
      priority: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        description: 'Priority level (default: medium)',
      },
    },
    required: ['project_folder', 'content'],
  },
};

/**
 * MCP tool schema for update_todo
 */
export const updateTodoToolSchema = {
  name: 'update_todo',
  description:
    'Update todo status or priority. Automatically sets completedAt timestamp when marked as completed. ' +
    'Changes are immediately persisted to vault. Requires an active session.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      project_folder: {
        type: 'string',
        description: 'Project folder name in vault',
      },
      todo_id: {
        type: 'string',
        description: 'Todo ID to update',
      },
      status: {
        type: 'string',
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        description: 'New status',
      },
      priority: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        description: 'New priority',
      },
    },
    required: ['project_folder', 'todo_id'],
  },
};

/**
 * MCP tool schema for list_todos
 */
export const listTodosToolSchema = {
  name: 'list_todos',
  description:
    'List todos from current session with optional filters. Returns todos grouped by status with counts and priority indicators. ' +
    'Can filter by status and/or priority. Requires an active session.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      project_folder: {
        type: 'string',
        description: 'Project folder name in vault',
      },
      status: {
        type: 'string',
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        description: 'Filter by status',
      },
      priority: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        description: 'Filter by priority',
      },
    },
    required: ['project_folder'],
  },
};
