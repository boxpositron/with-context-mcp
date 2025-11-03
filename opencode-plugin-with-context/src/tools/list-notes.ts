import { tool, type ToolDefinition } from '@opencode-ai/plugin';
import { listNotes as mcpListNotes } from 'with-context-mcp/tools';

/**
 * OpenCode tool wrapper for list_notes
 * Lists all notes in the project folder or a specific subdirectory
 */
export const listNotesTool: ToolDefinition = tool({
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
      // Call the MCP function directly
      const result = await mcpListNotes({
        path: args.path,
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
