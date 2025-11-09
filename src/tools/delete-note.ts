import { z } from 'zod';
import { ObsidianClient } from '../obsidian/index.js';
import { sanitizePath } from '../security/path-validator.js';
import { sessionState } from '../session-state.js';
import { config } from '../config/index.js';

export const deleteNoteSchema = z.object({
  path: z
    .string()
    .min(1)
    .describe(
      'Relative path to the note within the project folder (e.g., "CHANGELOG.md" or "docs/api.md")'
    ),
  confirm: z.boolean().describe('Required: Must be set to true to confirm deletion'),
  project_folder: z
    .string()
    .optional()
    .describe('Optional: Override the project folder for this operation'),
});

export type DeleteNoteInput = z.infer<typeof deleteNoteSchema>;

export async function deleteNote(input: DeleteNoteInput): Promise<string> {
  const { path, confirm, project_folder } = input;

  // Require explicit confirmation
  if (!confirm) {
    return JSON.stringify(
      {
        success: false,
        error: 'Deletion requires explicit confirmation. Set confirm=true to proceed.',
        path,
      },
      null,
      2
    );
  }

  // Get project context (use override if provided, otherwise session/detected)
  const context = await sessionState.getProjectContext(project_folder, config.projectBasePath);

  // Sanitize and validate path
  const sanitizedPath = sanitizePath(path, context.projectFolder, context.basePath);

  // Initialize Obsidian client
  const client = new ObsidianClient({
    apiUrl: config.obsidianApiUrl,
    apiKey: config.obsidianApiKey,
    vault: config.obsidianVault,
    allowInsecure: config.nodeEnv === 'development', // Allow self-signed certs in dev
  });

  // Delete the note
  await client.deleteNote(sanitizedPath);

  // Return success response
  return JSON.stringify(
    {
      success: true,
      path: sanitizedPath,
      project_folder: context.projectFolder,
      message: 'Note deleted successfully',
    },
    null,
    2
  );
}
