import { tool, type ToolDefinition } from '@opencode-ai/plugin';
import { batchWriteNotes as mcpBatchWriteNotes } from 'with-context-mcp/tools';

/**
 * OpenCode tool wrapper for batch_write_notes
 * Writes multiple notes at once with independent processing
 */
export const batchWriteNotesTool: ToolDefinition = tool({
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
      // Call the MCP function directly
      const result = await mcpBatchWriteNotes({
        notes: args.notes.map((note) => ({
          path: note.path,
          content: note.content,
          mode: (note.mode || 'overwrite') as 'create' | 'overwrite' | 'append',
        })),
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
