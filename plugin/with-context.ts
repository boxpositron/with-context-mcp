import type { Plugin } from '@opencode-ai/plugin';
import { tool } from '@opencode-ai/plugin';
import {
  writeNote as mcpWriteNote,
  readNote as mcpReadNote,
  listNotes as mcpListNotes,
  searchNotes as mcpSearchNotes,
  setProjectContext as mcpSetProjectContext,
  getNoteMetadata as mcpGetNoteMetadata,
  deleteNote as mcpDeleteNote,
  batchWriteNotes as mcpBatchWriteNotes,
  listTemplatesHandler as mcpListTemplates,
  createFromTemplateHandler as mcpCreateFromTemplate,
  ingestNotes as mcpIngestNotes,
  syncNotes as mcpSyncNotes,
  teleportNotes as mcpTeleportNotes,
  // Session management tools
  startSession as mcpStartSession,
  pauseSession as mcpPauseSession,
  resumeSession as mcpResumeSession,
  endSession as mcpEndSession,
  getSessionStatus as mcpGetSessionStatus,
  // Changelog and todo tools
  addChangelogEntry as mcpAddChangelogEntry,
  getSessionChangelog as mcpGetSessionChangelog,
  getCommitSuggestion as mcpGetCommitSuggestion,
  addTodo as mcpAddTodo,
  updateTodo as mcpUpdateTodo,
  listTodos as mcpListTodos,
} from 'with-context-mcp/tools';

/**
 * WithContext OpenCode Plugin - Enhanced Version
 *
 * Provides project-scoped note management for OpenCode sessions
 * Integrates with Obsidian and other note-taking apps via with-context-mcp
 *
 * All tools are defined inline for easy distribution and deployment
 *
 * Note: Full auto-tracking capabilities require OpenCode plugin API enhancements.
 * Current version provides all MCP tools as native OpenCode tools.
 */
export const WithContextPlugin: Plugin = async ({ project: _project, directory: _directory }) => {
  // Initialize plugin state
  const config = {
    vaultPath: process.env.OBSIDIAN_VAULT_PATH || process.env.HOME + '/Documents/Vault',
    basePath: process.env.PROJECT_BASE_PATH || 'Projects',
  };

  return {
    // Event hook for session lifecycle
    event: async ({ event }) => {
      // Silent cleanup on session idle
      if (event.type === 'session.idle') {
        // No-op: cleanup if needed
        // Note: Full session status display requires access to SessionManager
        // which needs to be initialized within tool context
      }
    },

    // Custom tools - all defined inline
    tool: {
      // ==================== Status Tool ====================
      with_context_status: tool({
        description: 'Check WithContext plugin status and configuration',
        args: {},
        async execute(_args, _ctx) {
          return JSON.stringify(
            {
              status: 'active',
              config,
              version: '3.0.0',
              tools: 25,
              custom_commands: 3,
              note: 'Full auto-tracking requires OpenCode plugin API enhancements. Use session tools manually for now.',
            },
            null,
            2
          );
        },
      }),

      // ==================== Write Note Tool ====================
      write_note: tool({
        description:
          'Write or update a markdown note in the project folder. Supports create, overwrite, and append modes.',
        args: {
          path: tool.schema
            .string()
            .describe(
              'Relative path to the note within the project folder (e.g., "CHANGELOG.md" or "docs/api.md")'
            ),
          content: tool.schema.string().describe('Content to write to the note'),
          mode: tool.schema
            .enum(['create', 'overwrite', 'append'])
            .optional()
            .describe(
              'Write mode: create (fail if exists), overwrite (replace), or append (add to end). Default: overwrite'
            ),
          project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Override the project folder for this operation'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpWriteNote({
              path: args.path,
              content: args.content,
              mode: args.mode || 'overwrite',
              project_folder: args.project_folder,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Read Note Tool ====================
      read_note: tool({
        description: 'Read the content of a markdown note from the project folder.',
        args: {
          path: tool.schema
            .string()
            .describe(
              'Relative path to the note within the project folder (e.g., "CHANGELOG.md" or "docs/api.md")'
            ),
          project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Override the project folder for this operation'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpReadNote({
              path: args.path,
              project_folder: args.project_folder,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== List Notes Tool ====================
      list_notes: tool({
        description: 'List all notes in a folder within the project.',
        args: {
          path: tool.schema
            .string()
            .optional()
            .describe('Optional: Relative path to a subfolder (defaults to project root)'),
          project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Override the project folder for this operation'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpListNotes({
              path: args.path,
              project_folder: args.project_folder,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Search Notes Tool ====================
      search_notes: tool({
        description:
          'Search for notes by content within the project folder. Returns matching files with snippets showing context around matches.',
        args: {
          query: tool.schema.string().describe('Search query text to find in note contents'),
          project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Override the project folder for this operation'),
          case_sensitive: tool.schema
            .boolean()
            .optional()
            .describe('Whether to perform case-sensitive search (default: false)'),
          limit: tool.schema
            .number()
            .optional()
            .describe('Maximum number of results to return (default: 10)'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpSearchNotes({
              query: args.query,
              project_folder: args.project_folder,
              case_sensitive: args.case_sensitive ?? false,
              limit: args.limit ?? 10,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Set Project Context Tool ====================
      set_project_context: tool({
        description:
          'Set the project folder context for this session. All subsequent operations will use this folder unless overridden.',
        args: {
          project_folder: tool.schema
            .string()
            .describe('The project folder name within the vault (e.g., "my-web-app")'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpSetProjectContext({
              project_folder: args.project_folder,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Get Note Metadata Tool ====================
      get_note_metadata: tool({
        description:
          'Get metadata about a note including word count, line count, frontmatter, tags, and headings.',
        args: {
          path: tool.schema
            .string()
            .describe('Relative path to the note within the project folder'),
          project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Override the project folder for this operation'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpGetNoteMetadata({
              path: args.path,
              project_folder: args.project_folder,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Delete Note Tool ====================
      delete_note: tool({
        description:
          'Delete a markdown note from the project folder. Requires explicit confirmation.',
        args: {
          path: tool.schema.string().describe('Relative path to the note to delete'),
          confirm: tool.schema.boolean().describe('Must be set to true to confirm deletion'),
          project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Override the project folder for this operation'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpDeleteNote({
              path: args.path,
              confirm: args.confirm,
              project_folder: args.project_folder,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Batch Write Notes Tool ====================
      batch_write_notes: tool({
        description:
          'Write multiple notes at once. Processes each note independently and returns a summary with per-note status.',
        args: {
          notes: tool.schema
            .array(
              tool.schema.object({
                path: tool.schema
                  .string()
                  .describe('Relative path to the note within the project folder'),
                content: tool.schema.string().describe('Content to write to the note'),
                mode: tool.schema
                  .enum(['create', 'overwrite', 'append'])
                  .optional()
                  .describe(
                    'Write mode: create (fail if exists), overwrite (replace), or append (add to end). Default: overwrite'
                  ),
              })
            )
            .describe('Array of notes to write'),
          project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Override the project folder for this operation'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpBatchWriteNotes({
              notes: args.notes.map((note) => ({
                path: note.path,
                content: note.content,
                mode: (note.mode || 'overwrite') as 'create' | 'overwrite' | 'append',
              })),
              project_folder: args.project_folder,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== List Templates Tool ====================
      list_templates: tool({
        description:
          'List all available note templates with their descriptions and required variables.',
        args: {},
        async execute(_args, _ctx) {
          try {
            const result = await mcpListTemplates({});
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Create From Template Tool ====================
      create_from_template: tool({
        description:
          'Create a new note from a template. Templates support variable substitution and auto-fill common variables like date and time.',
        args: {
          template_name: tool.schema.string().describe('Name of the template to use'),
          filename: tool.schema
            .string()
            .describe('Filename for the new note (e.g., "CHANGELOG.md" or "docs/meeting.md")'),
          variables: tool.schema
            .record(tool.schema.string(), tool.schema.string())
            .optional()
            .describe(
              'Variables to substitute in the template (e.g., {"version": "1.0.0", "author": "John"})'
            ),
          project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Override the project folder for this operation'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpCreateFromTemplate({
              template_name: args.template_name,
              filename: args.filename,
              variables: args.variables,
              project_folder: args.project_folder,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Ingest Notes Tool ====================
      ingest_notes: tool({
        description:
          'Ingest local documentation files to Obsidian vault. Scans the current project for documentation files that match .withcontextignore patterns and copies them to the vault.',
        args: {
          project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Override the project folder for this operation'),
          dry_run: tool.schema
            .boolean()
            .optional()
            .describe('If true, show what would be ingested without actually writing files'),
          delete_local_files: tool.schema
            .boolean()
            .optional()
            .describe(
              'If true, delete local files after successful ingestion. Requires explicit confirmation.'
            ),
          force_delete: tool.schema
            .boolean()
            .optional()
            .describe('If true, skip safety checks when deleting. Use with caution!'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpIngestNotes({
              project_folder: args.project_folder,
              dry_run: args.dry_run ?? false,
              delete_local_files: args.delete_local_files ?? false,
              force_delete: args.force_delete ?? false,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Sync Notes Tool ====================
      sync_notes: tool({
        description:
          'Bidirectionally sync documentation files between local project and Obsidian vault. Files matching .withcontextignore patterns will be moved between locations (deleted from source after successful copy).',
        args: {
          project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Override the project folder for this operation'),
          dry_run: tool.schema
            .boolean()
            .optional()
            .describe('If true, show what would be synced without actually moving files'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpSyncNotes({
              project_folder: args.project_folder,
              dry_run: args.dry_run ?? false,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Teleport Notes Tool ====================
      teleport_notes: tool({
        description:
          'Teleport documentation files from Obsidian vault to local project. Downloads files from the vault back to the local project.',
        args: {
          project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Override the project folder for this operation'),
          dry_run: tool.schema
            .boolean()
            .optional()
            .describe('If true, show what would be teleported without actually writing files'),
          delete_from_vault: tool.schema
            .boolean()
            .optional()
            .describe(
              'If true, delete files from vault after successful teleport. Use with caution!'
            ),
          force_delete: tool.schema
            .boolean()
            .optional()
            .describe('If true, skip safety checks when deleting. Use with extreme caution!'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpTeleportNotes({
              project_folder: args.project_folder,
              dry_run: args.dry_run ?? false,
              delete_from_vault: args.delete_from_vault ?? false,
              force_delete: args.force_delete ?? false,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Start Session Tool ====================
      start_session: tool({
        description:
          'Start a new development session for the project. Creates a new session and persists it to vault. Sets the project context for subsequent operations.',
        args: {
          project_folder: tool.schema
            .string()
            .describe('Project folder name in vault (e.g., "my-project")'),
          message: tool.schema
            .string()
            .optional()
            .describe('Optional message to describe session purpose'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpStartSession({
              project_folder: args.project_folder,
              message: args.message,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Pause Session Tool ====================
      pause_session: tool({
        description:
          'Pause the current active session. Saves session state to vault and clears timers. Session can be resumed later with resume_session.',
        args: {
          project_folder: tool.schema.string().describe('Project folder name in vault'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpPauseSession({
              project_folder: args.project_folder,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Resume Session Tool ====================
      resume_session: tool({
        description:
          'Resume a paused session. If session_id is provided, loads that specific session from vault. Otherwise, resumes the most recent paused session.',
        args: {
          project_folder: tool.schema.string().describe('Project folder name in vault'),
          session_id: tool.schema
            .string()
            .optional()
            .describe('Optional session ID to resume (defaults to most recent paused session)'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpResumeSession({
              project_folder: args.project_folder,
              session_id: args.session_id,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== End Session Tool ====================
      end_session: tool({
        description:
          'Complete and archive the current session. Marks session as completed, saves final state to vault archive, and clears active session. Generates comprehensive summary.',
        args: {
          project_folder: tool.schema.string().describe('Project folder name in vault'),
          message: tool.schema
            .string()
            .optional()
            .describe('Optional completion message or summary'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpEndSession({
              project_folder: args.project_folder,
              message: args.message,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Get Session Status Tool ====================
      get_session_status: tool({
        description:
          'Get current session status and comprehensive details. Returns session information including ID, status, duration, files tracked, todos, changelog entries, git context, and metadata.',
        args: {
          project_folder: tool.schema.string().describe('Project folder name in vault'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpGetSessionStatus({
              project_folder: args.project_folder,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Add Changelog Entry Tool ====================
      add_changelog_entry: tool({
        description:
          'Add a changelog entry to the current session. User provides type and message for semi-automatic tracking. Entry is immediately persisted to session state.',
        args: {
          project_folder: tool.schema.string().describe('Project folder name in vault'),
          type: tool.schema
            .enum(['feature', 'fix', 'refactor', 'docs', 'test', 'chore'])
            .describe('Type of change (conventional commit type)'),
          message: tool.schema.string().describe('Description of the change'),
          files: tool.schema
            .array(tool.schema.string())
            .optional()
            .describe('Optional: Files affected by this change'),
          breaking: tool.schema
            .boolean()
            .optional()
            .describe('Optional: Whether this is a breaking change'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpAddChangelogEntry({
              project_folder: args.project_folder,
              type: args.type as 'feature' | 'fix' | 'refactor' | 'docs' | 'test' | 'chore',
              message: args.message,
              files: args.files,
              breaking: args.breaking,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Get Session Changelog Tool ====================
      get_session_changelog: tool({
        description:
          'View changelog for the current session. Returns all entries grouped by type with file counts and breaking change indicators.',
        args: {
          project_folder: tool.schema.string().describe('Project folder name in vault'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpGetSessionChangelog({
              project_folder: args.project_folder,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Get Commit Suggestion Tool ====================
      get_commit_suggestion: tool({
        description:
          'Generate a conventional commit message from session changelog. Analyzes entries to determine primary type and formats message. Includes all changes as bullet points and detects breaking changes.',
        args: {
          project_folder: tool.schema.string().describe('Project folder name in vault'),
          conventional: tool.schema
            .boolean()
            .optional()
            .describe('Use conventional commit format (default: true)'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpGetCommitSuggestion({
              project_folder: args.project_folder,
              conventional: args.conventional ?? true,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Add Todo Tool ====================
      add_todo: tool({
        description:
          'Add a todo to the current session. Todos persist across sessions and are tracked per project. Immediately saved to session state in vault.',
        args: {
          project_folder: tool.schema.string().describe('Project folder name in vault'),
          content: tool.schema.string().describe('Todo content/description'),
          priority: tool.schema
            .enum(['high', 'medium', 'low'])
            .optional()
            .describe('Priority level (default: medium)'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpAddTodo({
              project_folder: args.project_folder,
              content: args.content,
              priority: (args.priority as 'high' | 'medium' | 'low') ?? 'medium',
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Update Todo Tool ====================
      update_todo: tool({
        description:
          'Update todo status or priority. Automatically sets completedAt timestamp when marked as completed. Changes are immediately persisted to vault.',
        args: {
          project_folder: tool.schema.string().describe('Project folder name in vault'),
          todo_id: tool.schema.string().describe('Todo ID to update'),
          status: tool.schema
            .enum(['pending', 'in_progress', 'completed', 'cancelled'])
            .optional()
            .describe('New status'),
          priority: tool.schema.enum(['high', 'medium', 'low']).optional().describe('New priority'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpUpdateTodo({
              project_folder: args.project_folder,
              todo_id: args.todo_id,
              status: args.status as
                | 'pending'
                | 'in_progress'
                | 'completed'
                | 'cancelled'
                | undefined,
              priority: args.priority as 'high' | 'medium' | 'low' | undefined,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== List Todos Tool ====================
      list_todos: tool({
        description:
          'List todos from current session with optional filters. Returns todos grouped by status with counts and priority indicators. Can filter by status and/or priority.',
        args: {
          project_folder: tool.schema.string().describe('Project folder name in vault'),
          status: tool.schema
            .enum(['pending', 'in_progress', 'completed', 'cancelled'])
            .optional()
            .describe('Filter by status'),
          priority: tool.schema
            .enum(['high', 'medium', 'low'])
            .optional()
            .describe('Filter by priority'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpListTodos({
              project_folder: args.project_folder,
              status: args.status as
                | 'pending'
                | 'in_progress'
                | 'completed'
                | 'cancelled'
                | undefined,
              priority: args.priority as 'high' | 'medium' | 'low' | undefined,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),
    },
  };
};

// Default export for plugin loading
export default WithContextPlugin;
