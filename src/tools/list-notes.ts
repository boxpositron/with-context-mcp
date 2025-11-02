import { z } from 'zod';
import { ObsidianClient } from '../obsidian/index.js';
import { sessionState } from '../session-state.js';
import { config } from '../config/index.js';

export const listNotesSchema = z.object({
  path: z
    .string()
    .optional()
    .describe('Optional: Relative path to a folder within the project (defaults to project root)'),
  project_folder: z
    .string()
    .optional()
    .describe('Optional: Override the project folder for this operation'),
});

export type ListNotesInput = z.infer<typeof listNotesSchema>;

export async function listNotes(input: ListNotesInput): Promise<string> {
  const { path = '', project_folder } = input;

  // Get project context (use override if provided, otherwise session/detected)
  const context = await sessionState.getProjectContext(project_folder, config.projectBasePath);

  // Build the full directory path
  // Format: "basePath/projectFolder/optionalSubPath"
  let fullPath = `${context.basePath}/${context.projectFolder}`;

  if (path && path.trim() !== '') {
    // Validate the subpath (basic security check - no traversal)
    const cleanPath = path.trim().replace(/^\/+|\/+$/g, '');
    if (cleanPath.includes('..')) {
      throw new Error('Path traversal is not allowed');
    }
    fullPath = `${fullPath}/${cleanPath}`;
  }

  // Initialize Obsidian client
  const client = new ObsidianClient({
    apiUrl: config.obsidianApiUrl,
    apiKey: config.obsidianApiKey,
    vault: config.obsidianVault,
    allowInsecure: config.nodeEnv === 'development', // Allow self-signed certs in dev
  });

  // List notes in the directory
  const files = await client.listNotes(fullPath);

  // Return success response with file list
  return JSON.stringify(
    {
      success: true,
      path: fullPath,
      project_folder: context.projectFolder,
      files,
      count: files.length,
    },
    null,
    2
  );
}
