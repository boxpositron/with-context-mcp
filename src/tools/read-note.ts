import { z } from 'zod';
import { ObsidianClient } from '../obsidian/index.js';
import { sanitizePath } from '../security/path-validator.js';
import { sessionState } from '../session-state.js';
import { config } from '../config/index.js';

export const readNoteSchema = z.object({
  path: z
    .string()
    .min(1)
    .describe(
      'Project-relative path to the note. CORRECT: "CHANGELOG.md", "docs/api.md". ' +
        'INCORRECT: "/Users/name/file.md", "Users/name/file.md", "C:/path/file.md". ' +
        'Use paths relative to project root only, NOT absolute filesystem paths.'
    ),
  project_folder: z
    .string()
    .optional()
    .describe('Optional: Override the project folder for this operation'),
});

export type ReadNoteInput = z.infer<typeof readNoteSchema>;

export async function readNote(input: ReadNoteInput): Promise<string> {
  const { path, project_folder } = input;

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

  // Read the note
  const content = await client.readNote(sanitizedPath);

  // Return success response with content
  return JSON.stringify(
    {
      success: true,
      path: sanitizedPath,
      project_folder: context.projectFolder,
      content,
      metadata: {
        length: content.length,
        lines: content.split('\n').length,
      },
    },
    null,
    2
  );
}
