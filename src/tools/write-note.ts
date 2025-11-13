import { z } from 'zod';
import { ObsidianClient } from '../obsidian/index.js';
import { sanitizePath } from '../security/path-validator.js';
import { sessionState } from '../session-state.js';
import { config } from '../config/index.js';
import { WriteMode } from '../types/index.js';

export const writeNoteSchema = z.object({
  path: z
    .string()
    .min(1)
    .describe(
      'Project-relative path to the note. CORRECT examples: "CHANGELOG.md", "docs/api.md", "guides/tutorial.md". ' +
        'INCORRECT examples (will be REJECTED): "/Users/name/docs/api.md" (absolute), "Users/name/docs/api.md" (looks absolute), ' +
        '"C:/Users/name/file.md" (Windows absolute), "home/user/file.md" (Linux absolute). ' +
        'Always use paths relative to the project root, NOT filesystem paths.'
    ),
  content: z.string().describe('Content to write to the note'),
  mode: z
    .enum(['create', 'overwrite', 'append', 'prepend'])
    .default('overwrite')
    .describe(
      'Write mode: create (fail if exists), overwrite (replace), append (add to end), or prepend (add to beginning)'
    ),
});

export type WriteNoteInput = z.infer<typeof writeNoteSchema>;

export async function writeNote(input: WriteNoteInput): Promise<string> {
  const { path, content, mode } = input;

  // Get project context (automatically detected from session/git)
  const context = await sessionState.getProjectContext(undefined, config.projectBasePath);

  // Sanitize and validate path
  const sanitizedPath = sanitizePath(path, context.projectFolder, context.basePath);

  // Initialize Obsidian client
  const client = new ObsidianClient({
    apiUrl: config.obsidianApiUrl,
    apiKey: config.obsidianApiKey,
    vault: config.obsidianVault,
    allowInsecure: config.nodeEnv === 'development', // Allow self-signed certs in dev
  });

  // Check file existence for create mode
  if (mode === 'create') {
    try {
      await client.readNote(sanitizedPath);
      // If read succeeds, file exists - throw error
      throw new Error(`File already exists: ${sanitizedPath}`);
    } catch (error) {
      // If read fails with "not found", file doesn't exist - proceed with create
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('not found') && !message.includes('Resource not found')) {
        // Some other error occurred
        throw error;
      }
      // File doesn't exist, continue with create
    }
  }

  // Write the note
  await client.writeNote(sanitizedPath, content, mode as WriteMode);

  // Return success response
  return JSON.stringify(
    {
      success: true,
      path: sanitizedPath,
      mode,
      project_folder: context.projectFolder,
      message: `Note ${mode === 'create' ? 'created' : mode === 'append' ? 'appended to' : mode === 'prepend' ? 'prepended to' : 'updated'} successfully`,
    },
    null,
    2
  );
}
