import { z } from 'zod';
import { ObsidianClient } from '../obsidian/index.js';
import { renderTemplate } from '../templates/index.js';
import { sanitizePath } from '../security/path-validator.js';
import { sessionState } from '../session-state.js';
import { config } from '../config/index.js';

export const createFromTemplateSchema = z.object({
  template_name: z.string().min(1).describe('Name of the template to use'),
  filename: z.string().min(1).describe('Filename for the new note (e.g., "CHANGELOG.md" or "docs/meeting.md")'),
  variables: z.record(z.string()).optional().describe('Variables to substitute in the template'),
  project_folder: z.string().optional().describe('Optional: Override the project folder for this operation'),
});

export type CreateFromTemplateInput = z.infer<typeof createFromTemplateSchema>;

export async function createFromTemplateHandler(input: CreateFromTemplateInput): Promise<string> {
  const { template_name, filename, variables = {}, project_folder } = input;
  
  // Get project context (use override if provided, otherwise session/detected)
  const context = await sessionState.getProjectContext(
    project_folder,
    config.projectBasePath
  );
  
  // Render the template with provided variables (auto-fills date/time)
  let renderedContent: string;
  try {
    renderedContent = renderTemplate(template_name, variables);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to render template: ${message}`);
  }
  
  // Sanitize and validate filename
  const sanitizedPath = sanitizePath(
    filename,
    context.projectFolder,
    context.basePath
  );
  
  // Initialize Obsidian client
  const client = new ObsidianClient({
    apiUrl: config.obsidianApiUrl,
    apiKey: config.obsidianApiKey,
    vault: config.obsidianVault,
    allowInsecure: config.nodeEnv === 'development', // Allow self-signed certs in dev
  });
  
  // Write the note using 'create' mode (fail if exists)
  await client.writeNote(sanitizedPath, renderedContent, 'create');
  
  // Return success response
  return JSON.stringify({
    success: true,
    template_used: template_name,
    path: sanitizedPath,
    variables_used: variables,
    project_folder: context.projectFolder,
    message: `Note created successfully from template '${template_name}'`,
  }, null, 2);
}
