import { tool } from '@opencode-ai/plugin';
import { searchNotes as mcpSearchNotes } from 'with-context-mcp/tools';
/**
 * OpenCode tool wrapper for search_notes
 * Searches for notes by content within the project folder
 */
export const searchNotesTool = tool({
    description: 'Search for notes by content within the project folder. Returns matching files with snippets showing context around matches.',
    args: {
        query: tool.schema.string().describe('Search query text to find in note contents'),
        project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Override the project folder for this operation'),
        case_sensitive: tool.schema
            .boolean()
            .optional()
            .describe('Whether to perform case-sensitive search (default: false)'),
        limit: tool.schema
            .number()
            .optional()
            .describe('Maximum number of results to return (default: 10)'),
    },
    async execute(args, _ctx) {
        try {
            // Call the MCP function directly
            const result = await mcpSearchNotes({
                query: args.query,
                project_folder: args.project_folder,
                case_sensitive: args.case_sensitive ?? false,
                limit: args.limit ?? 10,
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
//# sourceMappingURL=search-notes.js.map