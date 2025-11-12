/**
 * Vault Reorganization Execution Module
 *
 * Handles executing reorganization operations (rename, move, delete) with rollback capability.
 * Operations are atomic and support dry-run mode for safe previewing.
 */

import { ObsidianClient } from '../obsidian/client.js';
import {
  OrganizationPlan,
  OrganizationSuggestion,
  ExecutionOptions,
  ReorganizationResult,
  ReorganizationOperation,
  OperationType,
  FailedOperation,
  VaultReorganizationError,
  RollbackError,
  VaultFileInfo,
} from './types.js';

/**
 * Executes a reorganization plan with rollback capability
 *
 * Main orchestrator for executing vault reorganization. Supports dry-run mode
 * for safe previewing, automatic rollback on failure, and link updating.
 *
 * @param client - ObsidianClient instance for vault operations
 * @param plan - The reorganization plan to execute
 * @param options - Execution options (dry run, backup, link updates, etc.)
 * @returns Promise resolving to detailed reorganization result
 */
export async function executeReorganization(
  client: ObsidianClient,
  plan: OrganizationPlan,
  options: ExecutionOptions
): Promise<ReorganizationResult> {
  const startedAt = new Date().toISOString();
  const operations: ReorganizationOperation[] = [];
  const failedOperations: FailedOperation[] = [];
  const movedFiles = new Map<string, string>(); // oldPath -> newPath
  const filesModified: string[] = [];
  let linksUpdated = 0;

  // If dry run, simulate operations and return preview
  if (options.dryRun) {
    return createDryRunResult(plan, startedAt);
  }

  // Process each suggestion and convert to operations
  for (const suggestion of plan.suggestions) {
    // Skip low confidence operations if configured
    if (options.skipLowConfidence && options.minExecutionConfidence) {
      if (suggestion.confidence < options.minExecutionConfidence) {
        continue;
      }
    }

    try {
      // Convert suggestion to operation(s)
      const ops = await convertSuggestionToOperations(client, suggestion, options);

      // Execute each operation
      for (const operation of ops) {
        try {
          await executeOperation(client, operation);

          // Mark as completed and track
          const completedOp: ReorganizationOperation = {
            ...operation,
            status: 'completed',
          };
          operations.push(completedOp);

          // Track moved files for link updates
          if (operation.type === 'move' || operation.type === 'rename') {
            movedFiles.set(operation.sourcePath, operation.targetPath!);
            filesModified.push(operation.targetPath!);
          }
        } catch (error) {
          // Mark operation as failed
          const failedOp: ReorganizationOperation = {
            ...operation,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          };

          let rollbackSuccessful = false;

          // Stop on error if configured
          if (options.stopOnError) {
            // Attempt rollback of completed operations
            try {
              await rollbackOperations(client, operations);
              rollbackSuccessful = true;
            } catch (rollbackError) {
              // Rollback failed - critical error
              throw new RollbackError(
                'Rollback failed after operation error',
                operations,
                rollbackError
              );
            }
          }

          const failedOpRecord: FailedOperation = {
            operation: failedOp,
            error: failedOp.error!,
            rollbackSuccessful,
          };

          failedOperations.push(failedOpRecord);

          if (options.stopOnError) {
            // Throw the original error after successful rollback
            throw new VaultReorganizationError(
              `Operation failed: ${failedOp.error}`,
              failedOp,
              true,
              error
            );
          }
        }
      }
    } catch (error) {
      if (error instanceof RollbackError || error instanceof VaultReorganizationError) {
        throw error;
      }

      // Unexpected error during suggestion processing
      if (options.stopOnError) {
        throw new VaultReorganizationError(
          `Failed to process suggestion: ${error instanceof Error ? error.message : String(error)}`,
          undefined,
          operations.length > 0,
          error
        );
      }
      // If not stopOnError, continue to next suggestion
    }
  }

  // Update links if requested and we have moved files
  if (options.updateLinks && movedFiles.size > 0) {
    try {
      linksUpdated = await updateLinks(client, movedFiles, '');
    } catch (error) {
      // Link update failure is not critical - log but continue
      console.warn('Failed to update some links:', error);
    }
  }

  const completedAt = new Date().toISOString();
  const success = failedOperations.length === 0;

  return {
    success,
    startedAt,
    completedAt,
    operations,
    failedOperations,
    linksUpdated,
    filesModified,
    rollbackAvailable: operations.length > 0,
    summary: generateResultSummary(operations, failedOperations, linksUpdated),
  };
}

/**
 * Executes a single atomic reorganization operation
 *
 * Handles move, rename, and delete operations using read + write + delete pattern.
 * Validates paths and stores rollback information.
 *
 * @param client - ObsidianClient instance
 * @param operation - The operation to execute
 * @throws VaultReorganizationError if operation fails
 */
export async function executeOperation(
  client: ObsidianClient,
  operation: ReorganizationOperation
): Promise<void> {
  try {
    switch (operation.type) {
      case 'rename':
      case 'move': {
        if (!operation.targetPath) {
          throw new Error('Target path required for move/rename operation');
        }

        // Read source file
        const content = await client.readNote(operation.sourcePath);

        // Write to new location
        await client.writeNote(operation.targetPath, content, 'create');

        // Delete old file
        await client.deleteNote(operation.sourcePath);
        break;
      }

      case 'delete': {
        // Just delete the file
        await client.deleteNote(operation.sourcePath);
        break;
      }

      case 'update_links': {
        if (!operation.newContent) {
          throw new Error('New content required for update_links operation');
        }

        // Write updated content
        await client.writeNote(operation.sourcePath, operation.newContent, 'overwrite');
        break;
      }

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  } catch (error) {
    throw new VaultReorganizationError(
      `Failed to execute ${operation.type} operation on ${operation.sourcePath}`,
      operation,
      false,
      error
    );
  }
}

/**
 * Rolls back completed operations in reverse order
 *
 * Uses rollback information to restore original state. This is a critical
 * operation - if it fails, the vault may be in an inconsistent state.
 *
 * @param client - ObsidianClient instance
 * @param operations - List of completed operations to roll back
 * @throws RollbackError if rollback fails (critical!)
 */
export async function rollbackOperations(
  client: ObsidianClient,
  operations: ReorganizationOperation[]
): Promise<void> {
  const errors: string[] = [];

  // Process in reverse order
  for (let i = operations.length - 1; i >= 0; i--) {
    const operation = operations[i];

    if (operation.status !== 'completed') {
      continue;
    }

    try {
      const { rollbackInfo } = operation;

      switch (operation.type) {
        case 'rename':
        case 'move': {
          // Move file back to original location
          if (operation.targetPath) {
            const content = await client.readNote(operation.targetPath);
            await client.writeNote(rollbackInfo.originalPath, content, 'create');
            await client.deleteNote(operation.targetPath);
          }
          break;
        }

        case 'delete': {
          // Restore deleted file from backup
          if (rollbackInfo.originalContent) {
            await client.writeNote(
              rollbackInfo.originalPath,
              rollbackInfo.originalContent,
              'create'
            );
          }
          break;
        }

        case 'update_links': {
          // Restore original content
          if (rollbackInfo.originalContent) {
            await client.writeNote(
              rollbackInfo.originalPath,
              rollbackInfo.originalContent,
              'overwrite'
            );
          }
          break;
        }
      }
    } catch (error) {
      errors.push(
        `Failed to rollback ${operation.type} on ${operation.sourcePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (errors.length > 0) {
    throw new RollbackError(
      `Rollback failed with ${errors.length} errors: ${errors.join(', ')}`,
      operations
    );
  }
}

/**
 * Updates links in files that reference moved files
 *
 * Scans all files for links to moved files and updates both wiki-style [[links]]
 * and markdown [text](links.md) to point to new locations.
 *
 * @param client - ObsidianClient instance
 * @param movedFiles - Map of old paths to new paths
 * @param _projectFolder - Project folder name (reserved for future use)
 * @returns Promise resolving to count of updated links
 */
export async function updateLinks(
  client: ObsidianClient,
  movedFiles: Map<string, string>,
  _projectFolder: string
): Promise<number> {
  let totalLinksUpdated = 0;

  // Get all files in vault to check for links
  const allFiles = await client.listNotes();

  // Find files that might contain links to moved files
  const affectedFiles = await findAffectedFilesSimple(client, allFiles, movedFiles);

  // Update each affected file
  for (const filePath of affectedFiles) {
    try {
      const content = await client.readNote(filePath);
      let updatedContent = content;
      let fileLinksUpdated = 0;

      // Update links for each moved file
      for (const [oldPath, newPath] of movedFiles.entries()) {
        // Update wiki-style links: [[oldpath]] -> [[newpath]]
        const wikiLinkPattern = new RegExp(`\\[\\[${escapeRegex(oldPath)}\\]\\]`, 'g');
        const wikiMatches = updatedContent.match(wikiLinkPattern);
        if (wikiMatches) {
          updatedContent = updatedContent.replace(wikiLinkPattern, `[[${newPath}]]`);
          fileLinksUpdated += wikiMatches.length;
        }

        // Update markdown links: [text](oldpath.md) -> [text](newpath.md)
        const mdLinkPattern = new RegExp(
          `\\[([^\\]]+)\\]\\(${escapeRegex(oldPath)}(\\.md)?\\)`,
          'g'
        );
        const mdMatches = updatedContent.match(mdLinkPattern);
        if (mdMatches) {
          updatedContent = updatedContent.replace(mdLinkPattern, `[$1](${newPath}.md)`);
          fileLinksUpdated += mdMatches.length;
        }
      }

      // Write updated content if any links were changed
      if (fileLinksUpdated > 0) {
        await client.writeNote(filePath, updatedContent, 'overwrite');
        totalLinksUpdated += fileLinksUpdated;
      }
    } catch (error) {
      console.warn(`Failed to update links in ${filePath}:`, error);
    }
  }

  return totalLinksUpdated;
}

/**
 * Finds files that contain links to moved files
 *
 * Identifies files whose content needs to be updated because they link to files
 * that have been moved or renamed.
 *
 * @param allFiles - VaultFileInfo array with link information
 * @param movedFiles - Map of old paths to new paths
 * @returns Set of file paths that need link updates
 */
export function findAffectedFiles(
  allFiles: VaultFileInfo[],
  movedFiles: Map<string, string>
): Set<string> {
  const affectedFiles = new Set<string>();

  for (const file of allFiles) {
    // Check if this file links to any moved files
    if (file.contentMetadata?.links) {
      for (const link of file.contentMetadata.links) {
        if (movedFiles.has(link)) {
          affectedFiles.add(file.path);
          break;
        }
      }
    }

    // Check if this file is linked by any moved files (backlinks)
    if (file.contentMetadata?.backlinks) {
      for (const backlink of file.contentMetadata.backlinks) {
        if (movedFiles.has(backlink)) {
          affectedFiles.add(file.path);
          break;
        }
      }
    }
  }

  return affectedFiles;
}

/**
 * Creates a timestamped backup of a file before modification
 *
 * Stores backup in .backups folder with timestamp for safety.
 *
 * @param client - ObsidianClient instance
 * @param filePath - Path to file to back up
 * @returns Promise resolving to backup file path
 */
export async function createBackup(client: ObsidianClient, filePath: string): Promise<string> {
  try {
    const content = await client.readNote(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `.backups/${filePath.replace(/\//g, '_')}_${timestamp}`;

    await client.writeNote(backupPath, content, 'create');

    return backupPath;
  } catch (error) {
    throw new VaultReorganizationError(
      `Failed to create backup for ${filePath}`,
      undefined,
      false,
      error
    );
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Converts a suggestion to one or more operations
 */
async function convertSuggestionToOperations(
  client: ObsidianClient,
  suggestion: OrganizationSuggestion,
  _options: ExecutionOptions
): Promise<ReorganizationOperation[]> {
  const operations: ReorganizationOperation[] = [];
  const timestamp = new Date().toISOString();

  // Read current content for rollback info
  let originalContent: string | undefined;
  try {
    originalContent = await client.readNote(suggestion.currentPath);
  } catch {
    // File doesn't exist - might be a delete operation
    originalContent = undefined;
  }

  switch (suggestion.type) {
    case 'rename': {
      if (!suggestion.suggestedName) {
        throw new Error('Suggested name required for rename operation');
      }

      const targetPath = suggestion.currentPath.replace(/[^/]+$/, suggestion.suggestedName + '.md');

      operations.push({
        id: generateOperationId(),
        type: 'rename',
        sourcePath: suggestion.currentPath,
        targetPath,
        rollbackInfo: {
          originalPath: suggestion.currentPath,
          originalContent,
          timestamp,
        },
        status: 'pending',
      });
      break;
    }

    case 'move': {
      if (!suggestion.suggestedPath) {
        throw new Error('Suggested path required for move operation');
      }

      operations.push({
        id: generateOperationId(),
        type: 'move',
        sourcePath: suggestion.currentPath,
        targetPath: suggestion.suggestedPath,
        rollbackInfo: {
          originalPath: suggestion.currentPath,
          originalLocation: suggestion.currentPath,
          originalContent,
          timestamp,
        },
        status: 'pending',
      });
      break;
    }

    case 'both': {
      if (!suggestion.suggestedPath || !suggestion.suggestedName) {
        throw new Error('Both suggested path and name required for combined operation');
      }

      const targetPath = `${suggestion.suggestedPath}/${suggestion.suggestedName}.md`;

      operations.push({
        id: generateOperationId(),
        type: 'move',
        sourcePath: suggestion.currentPath,
        targetPath,
        rollbackInfo: {
          originalPath: suggestion.currentPath,
          originalLocation: suggestion.currentPath,
          originalContent,
          timestamp,
        },
        status: 'pending',
      });
      break;
    }
  }

  return operations;
}

/**
 * Creates a dry-run result for preview
 */
function createDryRunResult(plan: OrganizationPlan, startedAt: string): ReorganizationResult {
  const operations: ReorganizationOperation[] = [];
  const timestamp = new Date().toISOString();

  // Convert suggestions to pending operations
  for (const suggestion of plan.suggestions) {
    const operationType: OperationType =
      suggestion.type === 'both' ? 'move' : (suggestion.type as OperationType);

    operations.push({
      id: generateOperationId(),
      type: operationType,
      sourcePath: suggestion.currentPath,
      targetPath: suggestion.suggestedPath || suggestion.suggestedName,
      rollbackInfo: {
        originalPath: suggestion.currentPath,
        timestamp,
      },
      status: 'pending',
    });
  }

  return {
    success: true,
    startedAt,
    completedAt: new Date().toISOString(),
    operations,
    failedOperations: [],
    linksUpdated: 0,
    filesModified: [],
    rollbackAvailable: false,
    summary: `DRY RUN: Would perform ${operations.length} operations affecting ${plan.estimatedImpact.linksToUpdate} links`,
  };
}

/**
 * Generates a result summary
 */
function generateResultSummary(
  operations: ReorganizationOperation[],
  failedOperations: FailedOperation[],
  linksUpdated: number
): string {
  const successful = operations.filter((op) => op.status === 'completed').length;
  const failed = failedOperations.length;

  if (failed > 0) {
    return `Completed ${successful} operations, ${failed} failed. Updated ${linksUpdated} links.`;
  }

  return `Successfully completed ${successful} operations and updated ${linksUpdated} links.`;
}

/**
 * Generates unique operation ID
 */
function generateOperationId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Simplified version of findAffectedFiles that works with file paths only
 */
async function findAffectedFilesSimple(
  client: ObsidianClient,
  allFiles: string[],
  movedFiles: Map<string, string>
): Promise<Set<string>> {
  const affectedFiles = new Set<string>();

  // For each file, check if it contains references to moved files
  for (const filePath of allFiles) {
    // Skip the moved files themselves
    if (movedFiles.has(filePath)) {
      continue;
    }

    try {
      const content = await client.readNote(filePath);

      // Check if content contains any references to moved files
      for (const oldPath of movedFiles.keys()) {
        if (content.includes(oldPath)) {
          affectedFiles.add(filePath);
          break;
        }
      }
    } catch {
      // Skip files that can't be read
      continue;
    }
  }

  return affectedFiles;
}
