import type { Plugin } from '@opencode-ai/plugin';
import { tool } from '@opencode-ai/plugin';
import {
  writeNote as mcpWriteNote,
  readNote as mcpReadNote,
  listNotes as mcpListNotes,
  searchNotes as mcpSearchNotes,
  healthCheck as mcpHealthCheck,
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
  // Configuration tools
  setupNotes as mcpSetupNotes,
  validateConfigTool as mcpValidateConfig,
  previewDelegationTool as mcpPreviewDelegation,
  // Vault organization tools
  analyzeVaultStructureHandler as mcpAnalyzeVaultStructure,
  reorganizeNotesHandler as mcpReorganizeNotes,
  generateOrganizationPlanHandler as mcpGenerateOrganizationPlan,
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
              version: '3.0.6',
              tools: 30,
              custom_commands: 3,
              features: {
                filename_slugification: true,
                path_resolution: 'auto-detect-from-git',
                ascii_only_output: true,
                type_safety: 'zero-warnings',
                project_folder_optional: '26 tools auto-detect project',
              },
              note: 'Most tools auto-detect project from git context. Session lifecycle tools still require explicit project_folder.',
            },
            null,
            2
          );
        },
      }),

      // ==================== Write Note Tool ====================
      write_note: tool({
        description:
          'Write or update a markdown note in the project folder. Supports create, overwrite, and append modes. Filenames are automatically slugified (lowercase, spaces/special chars become hyphens). Well-known files like README, CHANGELOG, LICENSE preserve their case.',
        args: {
          path: tool.schema
            .string()
            .describe(
              'Relative path to the note within the project folder (e.g., "CHANGELOG.md" or "docs/api.md"). Filenames are auto-slugified: "My Notes" becomes "my-notes.md"'
            ),
          content: tool.schema.string().describe('Content to write to the note'),
          mode: tool.schema
            .enum(['create', 'overwrite', 'append'])
            .optional()
            .describe(
              'Write mode: create (fail if exists), overwrite (replace), or append (add to end). Default: overwrite'
            ),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpWriteNote({
              path: args.path,
              content: args.content,
              mode: args.mode || 'overwrite',
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
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpReadNote({
              path: args.path,
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
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpListNotes({
              path: args.path,
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

      // ==================== Health Check Tool ====================
      health_check: tool({
        description:
          'Perform a comprehensive health check of the with-context-mcp environment. ' +
          'Validates environment variables, Obsidian API connection, and configuration. ' +
          'Returns detailed status and recommendations for fixing any issues. Fast (< 2 seconds).',
        args: {
          project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Project folder to check for .withcontextconfig.jsonc'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpHealthCheck({
              project_folder: args.project_folder,
            });
            return JSON.stringify(result, null, 2);
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
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpGetNoteMetadata({
              path: args.path,
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
          'Delete a markdown note from the project folder. Requires explicit confirmation. Lists file metadata (size, line count, preview) before deletion for safety verification.',
        args: {
          path: tool.schema.string().describe('Relative path to the note to delete'),
          confirm: tool.schema.boolean().describe('Must be set to true to confirm deletion'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpDeleteNote({
              path: args.path,
              confirm: args.confirm,
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
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpBatchWriteNotes({
              notes: args.notes.map((note) => ({
                path: note.path,
                content: note.content,
                mode: (note.mode || 'overwrite') as 'create' | 'overwrite' | 'append',
              })),
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
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpCreateFromTemplate({
              template_name: args.template_name,
              filename: args.filename,
              variables: args.variables,
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
          'Ingest local documentation files to Obsidian vault. Scans the current project for documentation files based on .withcontextconfig.jsonc delegation rules and copies them to the vault.',
        args: {
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
          'Bidirectionally sync documentation files between local project and Obsidian vault. Files are synced based on .withcontextconfig.jsonc delegation rules and moved between locations (deleted from source after successful copy).',
        args: {
          dry_run: tool.schema
            .boolean()
            .optional()
            .describe('If true, show what would be synced without actually moving files'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpSyncNotes({
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

      // ==================== Setup Notes Tool ====================
      setup_notes: tool({
        description:
          'Intelligent documentation setup for the project. Scans repository structure, analyzes documentation files, and generates smart delegation rules in .withcontextconfig.jsonc. Provides recommendations for vault vs local placement.',
        args: {
          project_root: tool.schema
            .string()
            .optional()
            .describe('Project root directory (defaults to current working directory)'),
          force: tool.schema.boolean().optional().describe('If true, overwrite existing config'),
          create_structure: tool.schema
            .boolean()
            .optional()
            .describe('If true, create recommended folder structure in vault (default: true)'),
          project_folder: tool.schema
            .string()
            .optional()
            .describe('Project folder name in vault (required if create_structure is true)'),
          auto_apply: tool.schema
            .boolean()
            .optional()
            .describe('If true, skip confirmation prompts'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpSetupNotes({
              project_root: args.project_root,
              force: args.force ?? false,
              create_structure: args.create_structure ?? true,
              project_folder: args.project_folder,
              auto_apply: args.auto_apply ?? false,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Validate Config Tool ====================
      validate_config: tool({
        description:
          'Validate .withcontextconfig.jsonc for errors and warnings. Provides detailed feedback on configuration issues including schema validation, pattern conflicts, and best practice recommendations.',
        args: {
          project_root: tool.schema.string().describe('Project root directory'),
          config_path: tool.schema
            .string()
            .optional()
            .describe('Path to config file (defaults to .withcontextconfig.jsonc)'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpValidateConfig({
              project_root: args.project_root,
              config_path: args.config_path,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Preview Delegation Tool ====================
      preview_delegation: tool({
        description:
          'Preview which files will be delegated to vault vs kept local based on configuration patterns. Useful for testing patterns before syncing. Shows reasoning for decisions and allows filtering.',
        args: {
          project_root: tool.schema.string().describe('Project root directory'),
          config_path: tool.schema
            .string()
            .optional()
            .describe('Path to config file (defaults to .withcontextconfig.jsonc)'),
          file_patterns: tool.schema
            .array(tool.schema.string())
            .optional()
            .describe('Glob patterns for files to preview (default: ["**/*.md"])'),
          limit: tool.schema
            .number()
            .optional()
            .describe('Maximum number of files to show per category (default: 100)'),
          show_reasoning: tool.schema
            .boolean()
            .optional()
            .describe('Show reasoning for each delegation decision (default: false)'),
          vault_only: tool.schema.boolean().optional().describe('Show only files going to vault'),
          local_only: tool.schema.boolean().optional().describe('Show only files staying local'),
          specific_files: tool.schema
            .array(tool.schema.string())
            .optional()
            .describe('Preview delegation for specific files only'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpPreviewDelegation({
              project_root: args.project_root,
              config_path: args.config_path,
              file_patterns: args.file_patterns,
              limit: args.limit ?? 100,
              show_reasoning: args.show_reasoning ?? false,
              vault_only: args.vault_only ?? false,
              local_only: args.local_only ?? false,
              specific_files: args.specific_files,
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
          project_folder: tool.schema
            .string()
            .optional()
            .describe(
              'Optional: Project folder name in vault (auto-detects from current context if omitted)'
            ),
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
          project_folder: tool.schema
            .string()
            .optional()
            .describe(
              'Optional: Project folder name in vault (auto-detects from current context if omitted)'
            ),
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
          project_folder: tool.schema
            .string()
            .optional()
            .describe(
              'Optional: Project folder name in vault (auto-detects from current context if omitted)'
            ),
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
          project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Project folder name in vault (auto-detects if omitted)'),
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
          project_folder: tool.schema
            .string()
            .optional()
            .describe(
              'Optional: Project folder name in vault (auto-detects from current context if omitted)'
            ),
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
          project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Project folder name in vault (auto-detects if omitted)'),
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
          project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Project folder name in vault (auto-detects if omitted)'),
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
          project_folder: tool.schema
            .string()
            .optional()
            .describe(
              'Optional: Project folder name in vault (auto-detects from current context if omitted)'
            ),
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
          project_folder: tool.schema
            .string()
            .optional()
            .describe(
              'Optional: Project folder name in vault (auto-detects from current context if omitted)'
            ),
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
          project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Project folder name in vault (auto-detects if omitted)'),
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

      // ==================== Analyze Vault Structure Tool ====================
      analyze_vault_structure: tool({
        description:
          'Analyze vault structure and content. Scans all markdown files, extracts metadata (headings, frontmatter, links, tags), categorizes files, identifies orphans, and builds comprehensive statistics.',
        args: {
          exclude_patterns: tool.schema
            .array(tool.schema.string())
            .optional()
            .describe(
              'Optional: Glob patterns to exclude from analysis (e.g., ["*.tmp", "drafts/*"])'
            ),
          include_categories: tool.schema
            .boolean()
            .optional()
            .describe(
              'Optional: Whether to include category statistics in results (default: true)'
            ),
          include_orphans: tool.schema
            .boolean()
            .optional()
            .describe(
              'Optional: Whether to identify orphan files (no incoming/outgoing links, default: true)'
            ),
          max_file_size_mb: tool.schema
            .number()
            .optional()
            .describe('Optional: Maximum file size in MB to analyze (default: 10)'),
          max_files: tool.schema
            .number()
            .optional()
            .describe('Optional: Maximum number of files to analyze (for limiting large vaults)'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpAnalyzeVaultStructure({
              exclude_patterns: args.exclude_patterns,
              include_categories: args.include_categories ?? true,
              include_orphans: args.include_orphans ?? true,
              max_file_size_mb: args.max_file_size_mb ?? 10,
              max_files: args.max_files,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      // ==================== Reorganize Vault Tool ====================
      reorganize_vault: tool({
        description:
          'Execute vault reorganization based on an organization plan. Supports move and rename operations with dry-run mode (enabled by default), automatic link updates, rollback on failure, and confidence-based filtering.',
        args: {
          plan: tool.schema
            .object({
              suggestions: tool.schema
                .array(
                  tool.schema.object({
                    type: tool.schema
                      .enum(['rename', 'move', 'both'])
                      .describe('Type of reorganization operation'),
                    currentPath: tool.schema
                      .string()
                      .describe('Current file path relative to vault root'),
                    suggestedPath: tool.schema
                      .string()
                      .optional()
                      .describe('Suggested new path (for move operations)'),
                    suggestedName: tool.schema
                      .string()
                      .optional()
                      .describe('Suggested new name (for rename operations)'),
                    reason: tool.schema
                      .string()
                      .describe('Human-readable reason for this suggestion'),
                    confidence: tool.schema.number().describe('Confidence score (0-1)'),
                    impact: tool.schema
                      .object({
                        affectedFiles: tool.schema.number().optional(),
                        linksToUpdate: tool.schema.number().optional(),
                        potentialBrokenLinks: tool.schema.array(tool.schema.string()).optional(),
                        complexity: tool.schema.enum(['low', 'medium', 'high']).optional(),
                      })
                      .optional()
                      .describe('Impact assessment for this operation'),
                    targetCategory: tool.schema
                      .string()
                      .optional()
                      .describe('Target category after reorganization'),
                  })
                )
                .describe('List of reorganization suggestions'),
              estimatedImpact: tool.schema
                .object({
                  filesToMove: tool.schema.number().optional(),
                  filesToRename: tool.schema.number().optional(),
                  linksToUpdate: tool.schema.number().optional(),
                  filesRequiringLinkUpdates: tool.schema.number().optional(),
                  estimatedDuration: tool.schema.number().optional(),
                  hasRiskyOperations: tool.schema.boolean().optional(),
                })
                .optional()
                .describe('Overall estimated impact of executing the plan'),
              warnings: tool.schema
                .array(
                  tool.schema.object({
                    severity: tool.schema.enum(['info', 'warning', 'error']),
                    filePath: tool.schema.string().optional(),
                    message: tool.schema.string(),
                    suggestion: tool.schema.string().optional(),
                  })
                )
                .optional()
                .describe('List of warnings about the plan'),
              summary: tool.schema.string().optional().describe('High-level summary of the plan'),
              requiresManualReview: tool.schema.boolean().optional(),
            })
            .describe('The reorganization plan to execute (from analyze_vault_structure)'),
          dry_run: tool.schema
            .boolean()
            .optional()
            .describe(
              'If true, preview operations without making changes (default: true for safety)'
            ),
          update_links: tool.schema
            .boolean()
            .optional()
            .describe('If true, automatically update links in other files (default: true)'),
          create_backup: tool.schema
            .boolean()
            .optional()
            .describe('If true, create backups before executing (default: true for safety)'),
          min_confidence: tool.schema
            .number()
            .optional()
            .describe('Minimum confidence threshold for executing operations (default: 0.7)'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpReorganizeNotes({
              plan: args.plan as unknown as Parameters<typeof mcpReorganizeNotes>[0]['plan'],
              dry_run: args.dry_run ?? true,
              update_links: args.update_links ?? true,
              create_backup: args.create_backup ?? true,
              min_confidence: args.min_confidence ?? 0.7,
            });
            return result;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),
      generate_organization_plan: tool({
        description:
          'Generate an organization plan using a preset strategy. Analyzes vault structure and applies preset rules to create comprehensive reorganization suggestions. Use this BEFORE reorganize_notes.',
        args: {
          preset_id: tool.schema
            .string()
            .describe(
              'Preset to apply: "clean", "minimal", "docs-as-code", or "research". Use list_presets for details.'
            ),
          min_confidence: tool.schema
            .number()
            .optional()
            .describe('Minimum confidence threshold for including suggestions (default: 0.7)'),
          exclude_files: tool.schema
            .array(tool.schema.string())
            .optional()
            .describe('File patterns to exclude from analysis (glob patterns)'),
          custom_rules: tool.schema
            .array(
              tool.schema.object({
                name: tool.schema.string(),
                priority: tool.schema.number(),
                pattern: tool.schema.string(),
                targetPath: tool.schema.string(),
                confidence: tool.schema.number(),
                reason: tool.schema.string(),
              })
            )
            .optional()
            .describe('Additional custom rules to apply after preset rules'),
          max_file_size_mb: tool.schema
            .number()
            .optional()
            .describe('Maximum file size to analyze in MB (default: 10)'),
        },
        async execute(args, _ctx) {
          try {
            const result = await mcpGenerateOrganizationPlan({
              preset_id: args.preset_id,
              min_confidence: args.min_confidence ?? 0.7,
              exclude_files: args.exclude_files,
              custom_rules: args.custom_rules as
                | Array<{
                    name: string;
                    priority: number;
                    pattern: string;
                    targetPath: string;
                    confidence: number;
                    reason: string;
                  }>
                | undefined,
              max_file_size_mb: args.max_file_size_mb ?? 10,
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
