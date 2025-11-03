/**
 * WithContext MCP Plugin for OpenCode
 *
 * Enhances the with-context MCP experience with:
 * - Welcome messages on session start
 * - Success notifications for note operations
 * - Error feedback
 * - Template discovery
 * - Read interception for documentation delegation
 */

// Import required modules (available in OpenCode environment)
import path from 'path';

// Global state for read interceptor components
let readInterceptorState = null;

export const WithContextPlugin = async ({ client }) => {
  /**
   * Initialize read interceptor (lazy initialization)
   */
  async function initializeReadInterceptor(projectRoot) {
    if (readInterceptorState && readInterceptorState.projectRoot === projectRoot) {
      return readInterceptorState;
    }

    try {
      // Dynamically import modules
      const { ReadInterceptor } = await import('../../src/doc-delegator/read-interceptor.js');
      const { IgnoreConfig } = await import('../../src/doc-delegator/ignore-config.js');
      const { VaultCache } = await import('../../src/doc-delegator/vault-cache.js');
      const { ObsidianClient } = await import('../../src/obsidian/client.js');

      // Load environment variables
      const apiKey = process.env.OBSIDIAN_API_KEY;
      const apiUrl = process.env.OBSIDIAN_API_URL || 'https://127.0.0.1:27124';
      const vault = process.env.OBSIDIAN_VAULT;
      const projectBasePath = process.env.PROJECT_BASE_PATH || 'Projects';

      if (!apiKey || !vault) {
        console.log('Read interception disabled: Missing OBSIDIAN_API_KEY or OBSIDIAN_VAULT');
        return null;
      }

      // Create Obsidian client
      const obsidianClient = new ObsidianClient({
        apiUrl,
        apiKey,
        vault,
        allowInsecure: true,
      });

      // Create ignore config
      const ignoreConfig = IgnoreConfig.getInstance(projectRoot);
      await ignoreConfig.loadIgnoreFile();

      // Create vault cache
      const vaultCache = new VaultCache();

      // Create read interceptor with local-first strategy
      const interceptor = new ReadInterceptor({
        client: obsidianClient,
        ignoreConfig,
        vaultCache,
        strategy: 'local-first',
        projectBasePath,
      });

      readInterceptorState = {
        interceptor,
        projectRoot,
        ignoreConfig,
        vaultCache,
      };

      const hasIgnoreFile = ignoreConfig.hasIgnoreFile();
      if (hasIgnoreFile) {
        console.log(`[WithContext] Read interception enabled (strategy: local-first)`);
      }

      return readInterceptorState;
    } catch (error) {
      console.error('[WithContext] Failed to initialize read interceptor:', error.message);
      return null;
    }
  }

  /**
   * Get project root from current working directory
   */
  function getProjectRoot() {
    return process.cwd();
  }

  return {
    // Handle session start
    event: async ({ event }) => {
      if (event.type === 'session.started') {
        try {
          // List available templates using the MCP tool
          const result = await client.callTool('with-context', 'list_templates', {});

          let message = 'WithContext MCP is ready!\n\n';
          message += 'Available commands:\n';
          message += '- set_project_context - Set your project folder\n';
          message += '- write_note - Create/update notes\n';
          message += '- create_from_template - Use templates\n\n';

          if (result && Array.isArray(result)) {
            message += `${result.length} templates available:\n`;
            result.forEach((template) => {
              message += `- ${template.name}: ${template.description}\n`;
            });
          }

          console.log(message);

          // Initialize read interceptor
          const projectRoot = getProjectRoot();
          await initializeReadInterceptor(projectRoot);
        } catch (error) {
          // Silently handle errors - don't interrupt session start
          console.error('WithContext plugin: Failed to load templates', error.message);
        }
      }
    },

    // Intercept read operations BEFORE they execute
    'tool.execute.before': async (input) => {
      // Only intercept the 'read' tool
      if (input.tool !== 'read') return;

      try {
        const projectRoot = getProjectRoot();
        const state = await initializeReadInterceptor(projectRoot);

        if (!state) return; // Read interception not available

        const { interceptor } = state;
        const filePath = input.args?.filePath;

        if (!filePath) return;

        // Try to intercept read
        const content = await interceptor.interceptRead(filePath, projectRoot);

        if (content) {
          // Return formatted content (blocks original read)
          console.log(`[WithContext] Delegated read: ${path.relative(projectRoot, filePath)}`);
          return {
            blocked: true,
            result: [
              {
                type: 'text',
                text: content,
              },
            ],
          };
        }

        // Return undefined to allow normal read to proceed
      } catch (error) {
        // Log error but don't block read
        console.error('[WithContext] Read interception error:', error.message);
      }
    },

    // Handle successful tool executions
    'tool.execute.after': async (input) => {
      // Only handle with-context MCP tools
      if (!input.tool.startsWith('with-context/')) return;

      const toolName = input.tool.replace('with-context/', '');

      try {
        switch (toolName) {
          case 'write_note': {
            const mode = input.args?.mode || 'overwrite';
            const notePath = input.args?.path || 'note';
            console.log(`[OK] Note ${mode === 'append' ? 'updated' : 'saved'}: ${notePath}`);
            break;
          }

          case 'set_project_context': {
            const projectFolder = input.args?.project_folder || 'unknown';
            console.log(`[FOLDER] Project context set to: ${projectFolder}`);
            break;
          }

          case 'delete_note': {
            const deletedPath = input.args?.path || 'note';
            console.log(`[DELETE] Note deleted: ${deletedPath}`);
            break;
          }

          case 'batch_write_notes': {
            const notesCount = input.args?.notes?.length || 0;
            console.log(`[OK] ${notesCount} notes saved successfully`);
            break;
          }

          case 'create_from_template': {
            const templateName = input.args?.template_name || 'template';
            const filename = input.args?.filename || 'file';
            console.log(`[NOTE] Created ${filename} from template: ${templateName}`);
            break;
          }
        }
      } catch (error) {
        console.error('WithContext plugin error:', error.message);
      }
    },

    // Handle tool execution errors
    'tool.execute.error': async (input, error) => {
      // Only handle with-context MCP tools
      if (!input.tool.startsWith('with-context/')) return;

      const toolName = input.tool.replace('with-context/', '');
      const errorMessage = error?.message || String(error);

      console.error(`[ERROR] ${toolName} failed: ${errorMessage}`);
    },
  };
};
