import { z } from 'zod';
import { ObsidianClient } from '../obsidian/index.js';
import { sanitizePath } from '../security/path-validator.js';
import { sessionState } from '../session-state.js';
import { config } from '../config/index.js';

export const listNotesSchema = z.object({
  path: z.string().optional().describe('Optional: Relative path to a folder within the project (defaults to project root)'),
  project_folder: z.string().optional().describe('Optional: Override the project folder for this operation'),
});

export type ListNotesInput = z.infer<typeof listNotesSchema>;

export async function listNotes(input: ListNotesInput): Promise<string> {
  const { path = '', project_folder } = input;
  
  // Get project context (use override if provided, otherwise session/detected)
  const context = await sessionState.getProjectContext(
    project_folder,
    config.projectBasePath
  );
  
  // Sanitize and validate path if provided
  const sanitizedPath = path
    ? sanitizePath(path, context.projectFolder, context.basePath)
    : context.projectFolder;
  
  // Initialize Obsidian client
  const client = new ObsidianClient({
    apiUrl: config.obsidianApiUrl,
    apiKey: config.obsidianApiKey,
    vault: config.obsidianVault,
    allowInsecure: config.nodeEnv === 'development', // Allow self-signed certs in dev
  });
  
  // List notes in the directory
  const files = await client.listNotes(sanitizedPath);
  
  // Return success response with file list
  return JSON.stringify({
    success: true,
    path: sanitizedPath,
    project_folder: context.projectFolder,
    files,
    count: files.length,
  }, null, 2);
}
