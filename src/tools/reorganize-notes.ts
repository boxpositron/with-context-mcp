import { z } from 'zod';
import { ObsidianClient } from '../obsidian/index.js';
import { sessionState } from '../session-state.js';
import { config } from '../config/index.js';
import { executeReorganization } from '../vault-organizer/vault-reorganizer.js';
import type {
  OrganizationPlan,
  OrganizationSuggestion,
  ReorganizationType,
  ExecutionOptions,
  ReorganizationResult,
  OperationImpact,
} from '../vault-organizer/types.js';

/**
 * Zod schema for a single organization suggestion
 */
const organizationSuggestionSchema = z.object({
  type: z.enum(['rename', 'move', 'both']).describe('Type of reorganization operation'),
  currentPath: z.string().describe('Current file path relative to vault root'),
  suggestedPath: z.string().optional().describe('Suggested new path (for move operations)'),
  suggestedName: z.string().optional().describe('Suggested new name (for rename operations)'),
  reason: z.string().describe('Human-readable reason for this suggestion'),
  confidence: z.number().min(0).max(1).describe('Confidence score (0-1)'),
  impact: z
    .object({
      affectedFiles: z.number().default(0),
      linksToUpdate: z.number().default(0),
      potentialBrokenLinks: z.array(z.string()).default([]),
      complexity: z.enum(['low', 'medium', 'high']).default('low'),
    })
    .optional()
    .describe('Impact assessment for this operation'),
  targetCategory: z.string().optional().describe('Target category after reorganization'),
});

/**
 * Zod schema for organization plan input
 */
const organizationPlanSchema = z.object({
  suggestions: z.array(organizationSuggestionSchema).describe('List of reorganization suggestions'),
  estimatedImpact: z
    .object({
      filesToMove: z.number().default(0),
      filesToRename: z.number().default(0),
      linksToUpdate: z.number().default(0),
      filesRequiringLinkUpdates: z.number().default(0),
      estimatedDuration: z.number().default(0),
      hasRiskyOperations: z.boolean().default(false),
    })
    .optional()
    .describe('Overall estimated impact of executing the plan'),
  warnings: z
    .array(
      z.object({
        severity: z.enum(['info', 'warning', 'error']),
        filePath: z.string().optional(),
        message: z.string(),
        suggestion: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  summary: z.string().optional().describe('High-level summary of the plan'),
  requiresManualReview: z.boolean().optional().default(false),
});

/**
 * Zod schema for notes reorganization input
 */
export const reorganizeNotesSchema = z
  .object({
    project_folder: z
      .string()
      .optional()
      .describe('Optional: Override the project folder for this operation'),
    plan: organizationPlanSchema.describe(
      'The reorganization plan to execute (from analyze_vault_structure)'
    ),
    dry_run: z
      .boolean()
      .default(true)
      .describe('If true, preview operations without making changes (default: true for safety)'),
    update_links: z
      .boolean()
      .default(true)
      .describe('If true, automatically update links in other files (default: true)'),
    create_backup: z
      .boolean()
      .default(true)
      .describe('If true, create backups before executing (default: true for safety)'),
    min_confidence: z
      .number()
      .min(0)
      .max(1)
      .default(0.7)
      .describe('Minimum confidence threshold for executing operations (default: 0.7)'),
  })
  .strict();

export type ReorganizeNotesInput = z.infer<typeof reorganizeNotesSchema>;

/**
 * Executes notes reorganization based on an OrganizationPlan
 *
 * This tool applies suggested reorganization operations (move, rename) to improve
 * vault organization. Supports dry-run mode for safe previewing and includes
 * automatic link updating to prevent broken references.
 *
 * SAFETY FEATURES:
 * - Defaults to dry_run=true to prevent accidental changes
 * - Requires explicit confidence threshold (default: 0.7)
 * - Creates backups before executing operations
 * - Automatic rollback on failure
 * - Link updating to prevent broken references
 *
 * @param input - Reorganization options including plan, dry_run mode, and safety settings
 * @returns Detailed execution result with operations, successes, failures, and warnings
 * @throws Error if reorganization execution fails
 */
export async function reorganizeNotesHandler(input: ReorganizeNotesInput): Promise<string> {
  const { project_folder, plan, dry_run, update_links, create_backup, min_confidence } = input;

  // Get project context
  const context = await sessionState.getProjectContext(project_folder, config.projectBasePath);

  // Initialize Obsidian client
  const client = new ObsidianClient({
    apiUrl: config.obsidianApiUrl,
    apiKey: config.obsidianApiKey,
    vault: config.obsidianVault,
    allowInsecure: config.nodeEnv === 'development',
  });

  // Build estimated impact with defaults
  const estimatedImpact = {
    filesToMove: plan.estimatedImpact?.filesToMove ?? 0,
    filesToRename: plan.estimatedImpact?.filesToRename ?? 0,
    linksToUpdate: plan.estimatedImpact?.linksToUpdate ?? 0,
    filesRequiringLinkUpdates: plan.estimatedImpact?.filesRequiringLinkUpdates ?? 0,
    estimatedDuration: plan.estimatedImpact?.estimatedDuration ?? 0,
    hasRiskyOperations: plan.estimatedImpact?.hasRiskyOperations ?? false,
  };

  // Convert input plan to OrganizationPlan type with proper impact structure
  const organizationPlan: OrganizationPlan = {
    generatedAt: new Date().toISOString(),
    suggestions: plan.suggestions.map((suggestion) => {
      const impact: OperationImpact = suggestion.impact || {
        affectedFiles: 0,
        linksToUpdate: 0,
        potentialBrokenLinks: [],
        complexity: 'low',
      };

      return {
        type: suggestion.type as ReorganizationType,
        currentPath: suggestion.currentPath,
        suggestedPath: suggestion.suggestedPath,
        suggestedName: suggestion.suggestedName,
        reason: suggestion.reason,
        confidence: suggestion.confidence,
        impact,
        targetCategory: suggestion.targetCategory,
      } as OrganizationSuggestion;
    }),
    estimatedImpact,
    warnings: plan.warnings || [],
    summary: plan.summary || `Reorganization plan with ${plan.suggestions.length} suggestions`,
    requiresManualReview: plan.requiresManualReview || false,
  };

  // Build execution options
  const executionOptions: ExecutionOptions = {
    dryRun: dry_run,
    createBackup: create_backup,
    updateLinks: update_links,
    stopOnError: true,
    skipLowConfidence: true,
    minExecutionConfidence: min_confidence,
  };

  // Execute reorganization
  const result: ReorganizationResult = await executeReorganization(
    client,
    organizationPlan,
    executionOptions
  );

  // Build response object with warnings array
  const warnings: string[] = [];

  const response = {
    success: result.success,
    mode: dry_run ? 'dry-run' : 'executed',
    project_folder: context.projectFolder,
    operations: result.operations.map((op) => ({
      type: op.type,
      source: op.sourcePath,
      target: op.targetPath || null,
      status: op.status,
      error: op.error || null,
    })),
    summary: {
      total_operations: result.operations.length,
      completed: result.operations.filter((op) => op.status === 'completed').length,
      failed: result.failedOperations.length,
      pending: result.operations.filter((op) => op.status === 'pending').length,
      links_updated: result.linksUpdated,
    },
    failed_operations: result.failedOperations.map((failed) => ({
      operation: {
        type: failed.operation.type,
        source: failed.operation.sourcePath,
        target: failed.operation.targetPath || null,
      },
      error: failed.error,
      rollback_successful: failed.rollbackSuccessful,
    })),
    files_modified: result.filesModified,
    rollback_available: result.rollbackAvailable,
    warnings,
    execution_details: {
      started_at: result.startedAt,
      completed_at: result.completedAt,
      result_summary: result.summary,
    },
  };

  // Add safety warnings if not dry run
  if (!dry_run) {
    warnings.push(
      'Reorganization has been EXECUTED. Changes are live in your vault.',
      'If any operations failed, review the failed_operations section.',
      'Backups were created before operations (if create_backup was enabled).'
    );

    if (result.rollbackAvailable && result.failedOperations.length > 0) {
      warnings.push(
        'Some operations failed. Automatic rollback was attempted.',
        'Review the rollback_successful field in failed_operations to see if rollback succeeded.'
      );
    }
  } else {
    warnings.push(
      'DRY RUN: No changes were made to your vault.',
      'To execute these operations, set dry_run=false.',
      `Operations will affect ${result.operations.length} files and update ${organizationPlan.estimatedImpact.linksToUpdate} links.`,
      'Review the operations list carefully before executing.'
    );
  }

  // Add plan warnings
  if (organizationPlan.warnings.length > 0) {
    warnings.push('', '=== Plan Warnings ===');
    organizationPlan.warnings.forEach((warning) => {
      const prefix = warning.severity.toUpperCase();
      const location = warning.filePath ? ` [${warning.filePath}]` : '';
      warnings.push(`${prefix}${location}: ${warning.message}`);
      if (warning.suggestion) {
        warnings.push(`  Suggestion: ${warning.suggestion}`);
      }
    });
  }

  // Add confidence filtering info
  if (executionOptions.skipLowConfidence) {
    const skippedCount = organizationPlan.suggestions.filter(
      (s) => s.confidence < min_confidence
    ).length;
    if (skippedCount > 0) {
      warnings.push(
        '',
        `Note: ${skippedCount} operations were skipped due to confidence below ${min_confidence}.`
      );
    }
  }

  return JSON.stringify(response, null, 2);
}
