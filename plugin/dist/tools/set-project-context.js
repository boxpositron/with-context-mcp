import { tool } from '@opencode-ai/plugin';
import { setProjectContext as mcpSetProjectContext } from 'with-context-mcp/tools';
/**
 * OpenCode tool wrapper for set_project_context
 * Sets the project folder context for the current session
 */
export const setProjectContextTool = tool({
    description: 'Set the project folder context for this session. All subsequent operations will use this folder unless overridden.',
    args: {
        project_folder: tool.schema
            .string()
            .describe('The project folder name within the vault (e.g., "my-web-app")'),
    },
    async execute(args, _ctx) {
        try {
            // Call the MCP function directly
            const result = await mcpSetProjectContext({
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
//# sourceMappingURL=set-project-context.js.map