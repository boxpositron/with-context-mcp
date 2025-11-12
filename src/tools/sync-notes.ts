import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ObsidianClient } from '../obsidian/index.js';
import { sessionState } from '../session-state.js';
import { config, loadDelegationConfigOrDefault } from '../config/index.js';
import { decideDelegation } from '../doc-delegator/delegation-decision.js';

const DOC_EXTENSIONS = ['.md', '.txt', '.rst', '.adoc'];

export const syncNotesSchema = z.object({
  dry_run: z
    .boolean()
    .default(false)
    .describe('If true, show what would be synced without actually moving files'),
});

export type SyncNotesInput = z.infer<typeof syncNotesSchema>;

interface SyncResult {
  path: string;
  direction: 'to_vault' | 'to_local';
  status: 'success' | 'failed';
  error?: string;
  deleted_from_source?: boolean;
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
 * Bidirectionally sync documentation files between local project and Obsidian vault.
 * - Files with delegation decision 'vault' in local project → moved to vault (deleted from local)
 * - Files with delegation decision 'local' in vault → moved to local (deleted from vault)
 */
export async function syncNotes(input: SyncNotesInput): Promise<string> {
  const { dry_run } = input;

  // Get project context
  const context = await sessionState.getProjectContext(undefined, config.projectBasePath);

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

  // Load delegation config from .withcontextconfig.jsonc
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

  // === PHASE 1: Find files in LOCAL project to move to VAULT ===
  const allLocalDocFiles = await findDocFiles(projectRoot);
  const localToVault: Array<{ localPath: string; relativePath: string }> = [];

  for (const filePath of allLocalDocFiles) {
    const relativePath = path.relative(projectRoot, filePath);
    const decision = decideDelegation(relativePath, delegationConfig);

    if (decision === 'vault') {
      localToVault.push({
        localPath: filePath,
        relativePath,
      });
    }
  }

  // === PHASE 2: Find files in VAULT to move to LOCAL ===
  let vaultFiles: string[] = [];
  try {
    vaultFiles = await client.listNotes(vaultProjectPath);
  } catch {
    // Vault folder might not exist yet, that's okay
    vaultFiles = [];
  }

  const vaultToLocal: Array<{ vaultPath: string; relativePath: string }> = [];

  for (const vaultFile of vaultFiles) {
    const decision = decideDelegation(vaultFile, delegationConfig);

    // If file should NOT be delegated to vault (decision is 'local'), move it back to local
    if (decision === 'local') {
      vaultToLocal.push({
        vaultPath: path.join(vaultProjectPath, vaultFile),
        relativePath: vaultFile,
      });
    }
  }

  // If dry run, return preview without writing
  if (dry_run) {
    return JSON.stringify(
      {
        success: true,
        dry_run: true,
        local_to_vault: {
          count: localToVault.length,
          files: localToVault.map((f) => f.relativePath),
        },
        vault_to_local: {
          count: vaultToLocal.length,
          files: vaultToLocal.map((f) => f.relativePath),
        },
        project_folder: context.projectFolder,
        note: 'Files will be moved (deleted from source after successful copy)',
      },
      null,
      2
    );
  }

  // === EXECUTE SYNC ===
  const results: SyncResult[] = [];
  let succeeded = 0;
  let failed = 0;

  // Move files from LOCAL to VAULT
  for (const file of localToVault) {
    try {
      // Read local file content
      const content = await fs.readFile(file.localPath, 'utf-8');

      // Build vault path
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

      const result: SyncResult = {
        path: file.relativePath,
        direction: 'to_vault',
        status: 'success',
      };

      // Delete from local after successful write
      try {
        await fs.unlink(file.localPath);
        result.deleted_from_source = true;
      } catch (deleteError) {
        const deleteMessage =
          deleteError instanceof Error ? deleteError.message : String(deleteError);
        result.deleted_from_source = false;
        result.delete_error = deleteMessage;
      }

      results.push(result);
      succeeded++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        path: file.relativePath,
        direction: 'to_vault',
        status: 'failed',
        error: errorMessage,
      });
      failed++;
    }
  }

  // Move files from VAULT to LOCAL
  for (const file of vaultToLocal) {
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

      const result: SyncResult = {
        path: file.relativePath,
        direction: 'to_local',
        status: 'success',
      };

      // Delete from vault after successful write
      try {
        await client.deleteNote(file.vaultPath);
        result.deleted_from_source = true;
      } catch (deleteError) {
        const deleteMessage =
          deleteError instanceof Error ? deleteError.message : String(deleteError);
        result.deleted_from_source = false;
        result.delete_error = deleteMessage;
      }

      results.push(result);
      succeeded++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        path: file.relativePath,
        direction: 'to_local',
        status: 'failed',
        error: errorMessage,
      });
      failed++;
    }
  }

  // Count by direction
  const toVaultCount = results.filter(
    (r) => r.direction === 'to_vault' && r.status === 'success'
  ).length;
  const toLocalCount = results.filter(
    (r) => r.direction === 'to_local' && r.status === 'success'
  ).length;
  const deletedCount = results.filter((r) => r.deleted_from_source === true).length;
  const deleteFailedCount = results.filter((r) => r.deleted_from_source === false).length;

  // Return summary
  return JSON.stringify(
    {
      success: failed === 0,
      total_synced: succeeded,
      failed,
      to_vault: toVaultCount,
      to_local: toLocalCount,
      deleted_from_source: deletedCount,
      delete_failed: deleteFailedCount,
      project_folder: context.projectFolder,
      results,
    },
    null,
    2
  );
}
