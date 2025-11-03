import { tool } from '@opencode-ai/plugin';
import { listTemplatesHandler as mcpListTemplates } from 'with-context-mcp/tools';
/**
 * OpenCode tool wrapper for list_templates
 * Lists all available note templates with their descriptions
 */
export const listTemplatesTool = tool({
    description: 'List all available note templates with their descriptions and required variables.',
    args: {},
    async execute(_args, _ctx) {
        try {
            // Call the MCP function directly (takes empty object)
            const result = await mcpListTemplates({});
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
//# sourceMappingURL=list-templates.js.map