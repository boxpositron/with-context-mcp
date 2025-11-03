import { tool } from '@opencode-ai/plugin';
import { createFromTemplateHandler as mcpCreateFromTemplate } from 'with-context-mcp/tools';
/**
 * OpenCode tool wrapper for create_from_template
 * Creates a new note from a template with variable substitution
 */
export const createFromTemplateTool = tool({
    description: 'Create a new note from a template. Templates support variable substitution and auto-fill common variables like date and time.',
    args: {
        template_name: tool.schema.string().describe('Name of the template to use'),
        filename: tool.schema
            .string()
            .describe('Filename for the new note (e.g., "CHANGELOG.md" or "docs/meeting.md")'),
        variables: tool.schema
            .record(tool.schema.string(), tool.schema.string())
            .optional()
            .describe('Variables to substitute in the template (e.g., {"version": "1.0.0", "author": "John"})'),
        project_folder: tool.schema
            .string()
            .optional()
            .describe('Optional: Override the project folder for this operation'),
    },
    async execute(args, _ctx) {
        try {
            // Call the MCP function directly
            const result = await mcpCreateFromTemplate({
                template_name: args.template_name,
                filename: args.filename,
                variables: args.variables,
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
//# sourceMappingURL=create-from-template.js.map