import { tool, type ToolDefinition } from '@opencode-ai/plugin';
import { writeNote as mcpWriteNote } from 'with-context-mcp/tools';

/**
 * OpenCode tool wrapper for write_note
 * Writes or updates a markdown note in the project folder
 */
export const writeNoteTool: ToolDefinition = tool({
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
      // Call the MCP function directly
      const result = await mcpWriteNote({
        path: args.path,
        content: args.content,
        mode: args.mode || 'overwrite',
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
