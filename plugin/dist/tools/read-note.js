import { tool } from '@opencode-ai/plugin';
import { readNote as mcpReadNote } from 'with-context-mcp/tools';
/**
 * OpenCode tool wrapper for read_note
 * Reads a markdown note from the project folder
 */
export const readNoteTool = tool({
    description: 'Read the content of a markdown note from the project folder.',
    args: {
        path: tool.schema
            .string()
            .describe('Relative path to the note within the project folder (e.g., "CHANGELOG.md" or "docs/api.md")'),
        project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Override the project folder for this operation'),
    },
    async execute(args, _ctx) {
        try {
            // Call the MCP function directly
            const result = await mcpReadNote({
                path: args.path,
                project_folder: args.project_folder,
            });
            return result;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return JSON.stringify({
                success: false,
                error: message,
            }, null, 2);
        }
    },
});
//# sourceMappingURL=read-note.js.map