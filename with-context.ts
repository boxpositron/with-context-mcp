/**
 * WithContext OpenCode Plugin
 *
 * Project-scoped note management for OpenCode sessions with Obsidian integration.
 * Single-file plugin - just copy this file to ~/.config/opencode/plugin/
 *
 * @version 2.0.1
 * @see https://github.com/boxpositron/with-context-mcp
 */

import type { Plugin } from '@opencode-ai/plugin';
import { tool } from '@opencode-ai/plugin';

// Import MCP tool handlers
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
} from 'with-context-mcp/tools';

/**
 * WithContext OpenCode Plugin
 * Provides project-scoped note management integrated with Obsidian
 */
export const WithContextPlugin: Plugin = async ({ project, directory }) => {
  console.log('WithContext plugin initialized');
  console.log(`Project:`, project);
  console.log(`Directory: ${directory}`);

  // Plugin configuration from environment
  const config = {
    vaultPath: process.env.OBSIDIAN_VAULT_PATH || process.env.HOME + '/Documents/Vault',
    basePath: process.env.PROJECT_BASE_PATH || 'Projects',
    apiUrl: process.env.OBSIDIAN_API_URL,
    vault: process.env.OBSIDIAN_VAULT,
  };

  return {
    // Event hook for session lifecycle
    event: async ({ event }) => {
      if (event.type === 'session.idle') {
        console.log('Session completed - WithContext plugin cleanup');
      }
    },

    // Plugin tools
    tool: {
      /**
       * Check plugin status and configuration
       */
      with_context_status: tool({
        description: 'Check WithContext plugin status and configuration',
        args: {},
        async execute(_args, _ctx) {
          return JSON.stringify(
            {
              status: 'active',
              config,
              version: '2.0.1',
              tools: 11,
              custom_commands: 3,
            },
            null,
            2
          );
        },
      }),

      /**
       * Write or update a note
       */
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
            return await mcpWriteNote({
              path: args.path,
              content: args.content,
              mode: args.mode || 'overwrite',
              project_folder: args.project_folder,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      /**
       * Read a note's content
       */
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
            return await mcpReadNote({
              path: args.path,
              project_folder: args.project_folder,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      /**
       * List all notes in a folder
       */
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
            return await mcpListNotes({
              path: args.path,
              project_folder: args.project_folder,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      /**
       * Search notes by content
       */
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
            return await mcpSearchNotes({
              query: args.query,
              project_folder: args.project_folder,
              case_sensitive: args.case_sensitive ?? false,
              limit: args.limit ?? 10,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      /**
       * Set project context
       */
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
            return await mcpSetProjectContext({
              project_folder: args.project_folder,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      /**
       * Get note metadata
       */
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
            return await mcpGetNoteMetadata({
              path: args.path,
              project_folder: args.project_folder,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      /**
       * Delete a note
       */
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
            return await mcpDeleteNote({
              path: args.path,
              confirm: args.confirm,
              project_folder: args.project_folder,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      /**
       * Write multiple notes at once
       */
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
            return await mcpBatchWriteNotes({
              notes: args.notes.map((note) => ({
                path: note.path,
                content: note.content,
                mode: (note.mode || 'overwrite') as 'create' | 'overwrite' | 'append',
              })),
              project_folder: args.project_folder,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      /**
       * List available templates
       */
      list_templates: tool({
        description:
          'List all available note templates with their descriptions and required variables.',
        args: {},
        async execute(_args, _ctx) {
          try {
            return await mcpListTemplates({});
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({ success: false, error: message }, null, 2);
          }
        },
      }),

      /**
       * Create note from template
       */
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
            return await mcpCreateFromTemplate({
              template_name: args.template_name,
              filename: args.filename,
              variables: args.variables as Record<string, string> | undefined,
              project_folder: args.project_folder,
            });
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
