/**
 * WithContext MCP Plugin for OpenCode
 *
 * Enhances the with-context MCP experience with:
 * - Welcome messages on session start
 * - Success notifications for note operations
 * - Error feedback
 * - Template discovery
 */

export const WithContextPlugin = async ({ client }) => {
  return {
    // Handle session start
    event: async ({ event }) => {
      if (event.type === 'session.started') {
        try {
          // List available templates using the MCP tool
          const result = await client.callTool('with-context', 'list_templates', {});

          let message = '📝 WithContext MCP is ready!\n\n';
          message += 'Available commands:\n';
          message += '• set_project_context - Set your project folder\n';
          message += '• write_note - Create/update notes\n';
          message += '• create_from_template - Use templates\n\n';

          if (result && Array.isArray(result)) {
            message += `${result.length} templates available:\n`;
            result.forEach((template) => {
              message += `• ${template.name}: ${template.description}\n`;
            });
          }

          console.log(message);
        } catch (error) {
          // Silently handle errors - don't interrupt session start
          console.error('WithContext plugin: Failed to load templates', error.message);
        }
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
            console.log(`✅ Note ${mode === 'append' ? 'updated' : 'saved'}: ${notePath}`);
            break;
          }

          case 'set_project_context': {
            const projectFolder = input.args?.project_folder || 'unknown';
            console.log(`📁 Project context set to: ${projectFolder}`);
            break;
          }

          case 'delete_note': {
            const deletedPath = input.args?.path || 'note';
            console.log(`🗑️ Note deleted: ${deletedPath}`);
            break;
          }

          case 'batch_write_notes': {
            const notesCount = input.args?.notes?.length || 0;
            console.log(`✅ ${notesCount} notes saved successfully`);
            break;
          }

          case 'create_from_template': {
            const templateName = input.args?.template_name || 'template';
            const filename = input.args?.filename || 'file';
            console.log(`📄 Created ${filename} from template: ${templateName}`);
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

      console.error(`❌ ${toolName} failed: ${errorMessage}`);
    },
  };
};
