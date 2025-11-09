import { z } from 'zod';
import { ObsidianClient } from '../obsidian/index.js';
import { sanitizePath } from '../security/path-validator.js';
import { sessionState } from '../session-state.js';
import { config } from '../config/index.js';
import { WriteMode } from '../types/index.js';

export const batchWriteNotesSchema = z.object({
  notes: z
    .array(
      z.object({
        path: z.string().min(1).describe('Relative path to the note within the project folder'),
        content: z.string().describe('Content to write to the note'),
        mode: z
          .enum(['create', 'overwrite', 'append'])
          .default('overwrite')
          .describe(
            'Write mode: create (fail if exists), overwrite (replace), or append (add to end)'
          ),
      })
    )
    .min(1)
    .describe('Array of notes to write'),
  project_folder: z
    .string()
    .optional()
    .describe('Optional: Override the project folder for this operation'),
});

export type BatchWriteNotesInput = z.infer<typeof batchWriteNotesSchema>;

interface NoteResult {
  path: string;
  status: 'success' | 'failed';
  error?: string;
}

export async function batchWriteNotes(input: BatchWriteNotesInput): Promise<string> {
  const { notes, project_folder } = input;

  // Get project context (use override if provided, otherwise session/detected)
  const context = await sessionState.getProjectContext(project_folder, config.projectBasePath);

  // Initialize Obsidian client
  const client = new ObsidianClient({
    apiUrl: config.obsidianApiUrl,
    apiKey: config.obsidianApiKey,
    vault: config.obsidianVault,
    allowInsecure: config.nodeEnv === 'development',
  });

  const results: NoteResult[] = [];
  let succeeded = 0;
  let failed = 0;

  // Process each note
  for (const note of notes) {
    try {
      // Sanitize and validate path
      const sanitizedPath = sanitizePath(note.path, context.projectFolder, context.basePath);

      // Write the note
      await client.writeNote(sanitizedPath, note.content, note.mode as WriteMode);

      results.push({
        path: sanitizedPath,
        status: 'success',
      });
      succeeded++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        path: note.path,
        status: 'failed',
        error: errorMessage,
      });
      failed++;
    }
  }

  // Return summary response
  return JSON.stringify(
    {
      success: failed === 0,
      total: notes.length,
      succeeded,
      failed,
      project_folder: context.projectFolder,
      results,
    },
    null,
    2
  );
}
