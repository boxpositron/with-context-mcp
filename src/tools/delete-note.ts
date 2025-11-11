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
      'Project-relative path to the note. CORRECT: "CHANGELOG.md", "docs/api.md". ' +
        'INCORRECT: "/Users/name/file.md", "Users/name/file.md", "C:/path/file.md". ' +
        'Use paths relative to project root only, NOT absolute filesystem paths.'
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

  // Read file metadata before deletion for safety verification
  let fileMetadata: { content: string; length: number; lines: number } | null = null;
  try {
    const content = await client.readNote(sanitizedPath);
    const lines = content.split('\n').length;
    fileMetadata = {
      content: content.slice(0, 200), // First 200 chars as preview
      length: content.length,
      lines,
    };
  } catch (error) {
    // File doesn't exist or can't be read
    const message = error instanceof Error ? error.message : String(error);
    return JSON.stringify(
      {
        success: false,
        error: `Cannot delete: File not found or inaccessible - ${message}`,
        path: sanitizedPath,
      },
      null,
      2
    );
  }

  // Delete the note
  await client.deleteNote(sanitizedPath);

  // Return success response with file metadata
  return JSON.stringify(
    {
      success: true,
      path: sanitizedPath,
      project_folder: context.projectFolder,
      message: 'Note deleted successfully',
      deleted_file: {
        size_bytes: fileMetadata.length,
        line_count: fileMetadata.lines,
        preview: fileMetadata.content,
      },
    },
    null,
    2
  );
}
