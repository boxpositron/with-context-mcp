import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ObsidianClient } from '../obsidian/index.js';
import { sessionState } from '../session-state.js';
import { config, loadDelegationConfigOrDefault } from '../config/index.js';
import { decideDelegation } from '../doc-delegator/delegation-decision.js';

export const teleportNotesSchema = z.object({
  project_folder: z
    .string()
    .optional()
    .describe('Optional: Override the project folder for this operation'),
  dry_run: z
    .boolean()
    .default(false)
    .describe('If true, show what would be teleported without actually writing files'),
  delete_from_vault: z
    .boolean()
    .default(false)
    .describe('If true, delete files from vault after successful teleport. Use with caution!'),
  force_delete: z
    .boolean()
    .default(false)
    .describe('If true, skip safety checks when deleting. Use with extreme caution!'),
});

export type TeleportNotesInput = z.infer<typeof teleportNotesSchema>;

interface TeleportResult {
  path: string;
  status: 'success' | 'skipped' | 'failed';
  reason?: string;
  error?: string;
  deleted?: boolean;
  delete_error?: string;
}

/**
 * Teleport documentation files from Obsidian vault to local project
 */
export async function teleportNotes(input: TeleportNotesInput): Promise<string> {
  const { project_folder, dry_run, delete_from_vault, force_delete: _force_delete } = input;

  // Get project context
  const context = await sessionState.getProjectContext(project_folder, config.projectBasePath);

  // Get project root (cwd or detected git root)
  const projectRoot = context.cwd || process.cwd();

  // Check if .withcontextconfig.jsonc exists
  const configPath = path.join(projectRoot, '.withcontextconfig.jsonc');
  let configExists = false;
  try {
    await fs.access(configPath);
    configExists = true;
  } catch {
    // Config doesn't exist
  }

  if (!configExists) {
    return JSON.stringify(
      {
        success: false,
        error: 'Configuration file not found',
        message:
          'The .withcontextconfig.jsonc file does not exist in your project root.\n\n' +
          'Please run setup_notes first to create the configuration file with intelligent delegation rules.\n\n' +
          'Example: setup_notes({ project_folder: "your-project-name" })',
        config_path: configPath,
        project_root: projectRoot,
      },
      null,
      2
    );
  }

  // Load delegation config
  const delegationConfig = await loadDelegationConfigOrDefault(projectRoot);

  // Initialize Obsidian client
  const client = new ObsidianClient({
    apiUrl: config.obsidianApiUrl,
    apiKey: config.obsidianApiKey,
    vault: config.obsidianVault,
    allowInsecure: config.nodeEnv === 'development',
  });

  // Build vault path for project: basePath/projectFolder
  const vaultProjectPath = path.join(context.basePath, context.projectFolder);

  // List all notes in vault for this project
  let vaultFiles: string[];
  try {
    vaultFiles = await client.listNotes(vaultProjectPath);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return JSON.stringify(
      {
        success: false,
        error: `Failed to list vault files: ${errorMessage}`,
      },
      null,
      2
    );
  }

  // Filter files that should be delegated (match ignore patterns)
  const filesToTeleport: Array<{ vaultPath: string; relativePath: string }> = [];
  const skippedFiles: Array<{ vaultPath: string; relativePath: string; reason: string }> = [];

  for (const vaultFile of vaultFiles) {
    // vaultFile is relative to vaultProjectPath
    // Check if delegation decision is 'vault' (should be teleported to local)
    const decision = decideDelegation(vaultFile, delegationConfig);
    const shouldTeleport = decision === 'vault';

    if (shouldTeleport) {
      filesToTeleport.push({
        vaultPath: path.join(vaultProjectPath, vaultFile),
        relativePath: vaultFile,
      });
    } else {
      skippedFiles.push({
        vaultPath: path.join(vaultProjectPath, vaultFile),
        relativePath: vaultFile,
        reason: 'Delegation decision is not vault',
      });
    }
  }

  // If dry run, return preview without writing
  if (dry_run) {
    return JSON.stringify(
      {
        success: true,
        dry_run: true,
        total_in_vault: vaultFiles.length,
        to_teleport: filesToTeleport.length,
        to_skip: skippedFiles.length,
        project_folder: context.projectFolder,
        files_to_teleport: filesToTeleport.map((f) => f.relativePath),
        files_to_skip: skippedFiles.map((f) => f.relativePath),
      },
      null,
      2
    );
  }

  // Teleport files from vault to local
  const results: TeleportResult[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const file of filesToTeleport) {
    try {
      // Read from vault
      const content = await client.readNote(file.vaultPath);

      // Build local file path
      const localPath = path.join(projectRoot, file.relativePath);

      // Ensure directory exists
      const localDir = path.dirname(localPath);
      await fs.mkdir(localDir, { recursive: true });

      // Write to local filesystem (overwrite)
      await fs.writeFile(localPath, content, 'utf-8');

      const result: TeleportResult = {
        path: file.relativePath,
        status: 'success',
      };

      // Delete from vault if requested
      if (delete_from_vault) {
        try {
          await client.deleteNote(file.vaultPath);
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
      total_in_vault: vaultFiles.length,
      teleported: succeeded,
      failed,
      skipped: skippedFiles.length,
      deleted: deletedCount,
      delete_failed: deleteFailedCount,
      project_folder: context.projectFolder,
      delete_from_vault,
      results,
      skipped_files: skippedFiles.map((f) => f.relativePath),
    },
    null,
    2
  );
}
