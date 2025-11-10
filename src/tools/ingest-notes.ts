import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ObsidianClient } from '../obsidian/index.js';
import { sessionState } from '../session-state.js';
import { config, loadDelegationConfigOrDefault } from '../config/index.js';
import { decideDelegation } from '../doc-delegator/delegation-decision.js';

const DOC_EXTENSIONS = ['.md', '.txt', '.rst', '.adoc'];

export const ingestNotesSchema = z.object({
  project_folder: z
    .string()
    .optional()
    .describe('Optional: Override the project folder for this operation'),
  dry_run: z
    .boolean()
    .default(false)
    .describe('If true, show what would be ingested without actually writing files'),
  delete_local_files: z
    .boolean()
    .default(false)
    .describe(
      'If true, delete local files after successful ingestion. Requires explicit confirmation.'
    ),
  force_delete: z
    .boolean()
    .default(false)
    .describe('If true, skip safety checks when deleting. Use with caution!'),
});

export type IngestNotesInput = z.infer<typeof ingestNotesSchema>;

interface IngestResult {
  path: string;
  status: 'success' | 'skipped' | 'failed';
  reason?: string;
  error?: string;
  deleted?: boolean;
  delete_error?: string;
}

/**
 * Recursively find all documentation files in a directory
 */
async function findDocFiles(
  dirPath: string,
  maxDepth: number = 10,
  currentDepth: number = 0
): Promise<string[]> {
  if (currentDepth >= maxDepth) {
    return [];
  }

  const results: string[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Skip common directories
        const skipDirs = [
          'node_modules',
          '.git',
          '.next',
          '.docusaurus',
          'dist',
          'build',
          'out',
          'coverage',
          '.turbo',
          '.opencode',
        ];

        if (skipDirs.includes(entry.name)) {
          continue;
        }

        // Recursively search subdirectories
        const subResults = await findDocFiles(fullPath, maxDepth, currentDepth + 1);
        results.push(...subResults);
      } else if (entry.isFile()) {
        // Check if it's a doc file
        const ext = path.extname(entry.name);
        if (DOC_EXTENSIONS.includes(ext.toLowerCase())) {
          results.push(fullPath);
        }
      }
    }
  } catch {
    // Ignore permission errors and continue
  }

  return results;
}

/**
 * Ingest documentation files from local project to Obsidian vault
 */
export async function ingestNotes(input: IngestNotesInput): Promise<string> {
  const { project_folder, dry_run, delete_local_files, force_delete: _force_delete } = input;

  // Get project context
  const context = await sessionState.getProjectContext(project_folder, config.projectBasePath);

  // Get project root (cwd or detected git root)
  const projectRoot = context.cwd || process.cwd();

  // Load delegation config (.withcontextconfig.jsonc)
  const delegationConfig = await loadDelegationConfigOrDefault(projectRoot);

  // Find all documentation files in project
  const allDocFiles = await findDocFiles(projectRoot);

  // Filter files that should be delegated to vault
  const filesToIngest: Array<{ localPath: string; relativePath: string }> = [];
  const skippedFiles: Array<{ localPath: string; relativePath: string; reason: string }> = [];

  for (const filePath of allDocFiles) {
    // Get relative path from project root
    const relativePath = path.relative(projectRoot, filePath);

    // Check delegation decision
    const decision = decideDelegation(relativePath, delegationConfig);

    if (decision === 'vault') {
      filesToIngest.push({
        localPath: filePath,
        relativePath,
      });
    } else {
      skippedFiles.push({
        localPath: filePath,
        relativePath,
        reason: 'Delegation decision: local (not delegated to vault)',
      });
    }
  }

  // If dry run, return preview without writing
  if (dry_run) {
    return JSON.stringify(
      {
        success: true,
        dry_run: true,
        total_found: allDocFiles.length,
        to_ingest: filesToIngest.length,
        to_skip: skippedFiles.length,
        project_folder: context.projectFolder,
        files_to_ingest: filesToIngest.map((f) => f.relativePath),
        files_to_skip: skippedFiles.map((f) => f.relativePath),
      },
      null,
      2
    );
  }

  // Initialize Obsidian client
  const client = new ObsidianClient({
    apiUrl: config.obsidianApiUrl,
    apiKey: config.obsidianApiKey,
    vault: config.obsidianVault,
    allowInsecure: config.nodeEnv === 'development',
  });

  // Ingest files to vault
  const results: IngestResult[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const file of filesToIngest) {
    try {
      // Read local file content
      const content = await fs.readFile(file.localPath, 'utf-8');

      // Build vault path: basePath/projectFolder/relativePath
      const vaultPath = path.join(context.basePath, context.projectFolder, file.relativePath);

      // Check if file exists in vault and read it first (required by read-before-write enforcement)
      let fileExists = false;
      try {
        await client.readNote(vaultPath);
        fileExists = true;
      } catch {
        // File doesn't exist, will create new
        fileExists = false;
      }

      // Write to vault (create for new files, overwrite for existing)
      await client.writeNote(vaultPath, content, fileExists ? 'overwrite' : 'create');

      const result: IngestResult = {
        path: file.relativePath,
        status: 'success',
      };

      // Delete local file if requested
      if (delete_local_files) {
        try {
          await fs.unlink(file.localPath);
          result.deleted = true;
        } catch (deleteError) {
          const deleteMessage =
            deleteError instanceof Error ? deleteError.message : String(deleteError);
          result.deleted = false;
          result.delete_error = deleteMessage;
        }
      }

      results.push(result);
      succeeded++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        path: file.relativePath,
        status: 'failed',
        error: errorMessage,
      });
      failed++;
    }
  }

  // Count deletions
  const deletedCount = results.filter((r) => r.deleted === true).length;
  const deleteFailedCount = results.filter((r) => r.deleted === false).length;

  // Return summary
  return JSON.stringify(
    {
      success: failed === 0,
      total_found: allDocFiles.length,
      ingested: succeeded,
      failed,
      skipped: skippedFiles.length,
      deleted: deletedCount,
      delete_failed: deleteFailedCount,
      project_folder: context.projectFolder,
      delete_local_files,
      results,
      skipped_files: skippedFiles.map((f) => f.relativePath),
    },
    null,
    2
  );
}
