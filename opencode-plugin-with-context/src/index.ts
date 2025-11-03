import type { Plugin } from '@opencode-ai/plugin';
import { tool } from '@opencode-ai/plugin';
import { writeNoteTool } from './tools/write-note.js';
import { readNoteTool } from './tools/read-note.js';

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
              version: '0.1.0',
            },
            null,
            2
          );
        },
      }),

      // Note management tools
      write_note: writeNoteTool,
      read_note: readNoteTool,
    },
  };
};

// Default export for plugin loading
export default WithContextPlugin;
