import { tool, type ToolDefinition } from '@opencode-ai/plugin';
import { getNoteMetadata as mcpGetNoteMetadata } from 'with-context-mcp/tools';

/**
 * OpenCode tool wrapper for get_note_metadata
 * Gets metadata about a note including word count, line count, frontmatter, tags, and headings
 */
export const getNoteMetadataTool: ToolDefinition = tool({
  description:
    'Get metadata about a note including word count, line count, frontmatter, tags, and headings.',
  args: {
    path: tool.schema.string().describe('Relative path to the note within the project folder'),
    project_folder: tool.schema
      .string()
      .optional()
      .describe('Optional: Override the project folder for this operation'),
  },
  async execute(args, _ctx) {
    try {
      // Call the MCP function directly
      const result = await mcpGetNoteMetadata({
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
