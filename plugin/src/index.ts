import type { Plugin } from '@opencode-ai/plugin';
import { tool } from '@opencode-ai/plugin';
import { writeNoteTool } from './tools/write-note.js';
import { readNoteTool } from './tools/read-note.js';
import { listNotesTool } from './tools/list-notes.js';
import { searchNotesTool } from './tools/search-notes.js';
import { setProjectContextTool } from './tools/set-project-context.js';
import { getNoteMetadataTool } from './tools/get-note-metadata.js';
import { deleteNoteTool } from './tools/delete-note.js';
import { batchWriteNotesTool } from './tools/batch-write-notes.js';
import { listTemplatesTool } from './tools/list-templates.js';
import { createFromTemplateTool } from './tools/create-from-template.js';

/**
 * WithContext OpenCode Plugin
 *
 * Provides project-scoped note management for OpenCode sessions
 * Integrates with Obsidian and other note-taking apps via with-context-mcp
 */
export const WithContextPlugin: Plugin = async ({ project, directory }) => {
  console.log('WithContext plugin initialized');
  console.log(`Project:`, project);
  console.log(`Directory: ${directory}`);

  // Initialize plugin state
  const config = {
    vaultPath: process.env.OBSIDIAN_VAULT_PATH || process.env.HOME + '/Documents/Vault',
    basePath: process.env.PROJECT_BASE_PATH || 'Projects',
  };

  return {
    // Event hook for session lifecycle
    event: async ({ event }) => {
      if (event.type === 'session.idle') {
        console.log('Session completed - WithContext plugin cleanup');
      }
    },

    // Custom tools
    tool: {
      // Status check tool
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

      // Core note management tools
      write_note: writeNoteTool,
      read_note: readNoteTool,
      list_notes: listNotesTool,
      search_notes: searchNotesTool,

      // Context management
      set_project_context: setProjectContextTool,

      // Metadata and operations
      get_note_metadata: getNoteMetadataTool,
      delete_note: deleteNoteTool,
      batch_write_notes: batchWriteNotesTool,

      // Template management
      list_templates: listTemplatesTool,
      create_from_template: createFromTemplateTool,
    },
  };
};

// Default export for plugin loading
export default WithContextPlugin;
