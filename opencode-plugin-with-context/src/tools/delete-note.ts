import { tool, type ToolDefinition } from '@opencode-ai/plugin';
import { deleteNote as mcpDeleteNote } from 'with-context-mcp/tools';

/**
 * OpenCode tool wrapper for delete_note
 * Deletes a note from the project folder (requires explicit confirmation)
 */
export const deleteNoteTool: ToolDefinition = tool({
  description: 'Delete a markdown note from the project folder. Requires explicit confirmation.',
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
      // Call the MCP function directly
      const result = await mcpDeleteNote({
        path: args.path,
        confirm: args.confirm,
        project_folder: args.project_folder,
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return JSON.stringify(
        {
          success: false,
          error: message,
        },
        null,
        2
      );
    }
  },
});
