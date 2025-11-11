import { z } from 'zod';
import { sessionState } from '../session-state.js';
import { config } from '../config/index.js';
import { analyzeVaultStructure } from '../vault-organizer/vault-analyzer.js';
import type { AnalysisOptions } from '../vault-organizer/types.js';

/**
 * Zod schema for vault structure analysis input
 */
export const analyzeVaultStructureSchema = z
  .object({
    exclude_patterns: z
      .array(z.string())
      .optional()
      .describe('Optional: Glob patterns to exclude from analysis (e.g., ["*.tmp", "drafts/*"])'),
    include_categories: z
      .boolean()
      .optional()
      .describe('Optional: Whether to include category statistics in results'),
    include_orphans: z
      .boolean()
      .optional()
      .describe('Optional: Whether to identify orphan files (no incoming/outgoing links)'),
    max_file_size_mb: z
      .number()
      .optional()
      .describe('Optional: Maximum file size in MB to analyze (default: 10)'),
    max_files: z
      .number()
      .optional()
      .describe('Optional: Maximum number of files to analyze (for limiting large vaults)'),
  })
  .strict();

export type AnalyzeVaultStructureInput = z.infer<typeof analyzeVaultStructureSchema>;

/**
 * Analyzes the complete structure of a vault for the current project
 *
 * Scans all markdown files in the vault, extracts metadata and content,
 * builds folder and category statistics, and identifies orphan files.
 * Useful for understanding vault organization and identifying areas for improvement.
 *
 * @param input - Analysis options including project folder and filtering preferences
 * @returns Structured analysis result with summary, folders, categories, and orphans
 * @throws Error if vault analysis fails
 */
export async function analyzeVaultStructureHandler(
  input: AnalyzeVaultStructureInput
): Promise<string> {
  const {
    exclude_patterns = [],
    include_categories = true,
    include_orphans = true,
    max_file_size_mb = 10,
    max_files,
  } = input;

  // Get project context (automatically detected from session/git)
  const context = await sessionState.getProjectContext(undefined, config.projectBasePath);

  // Build analysis options
  const analysisOptions: AnalysisOptions = {
    includeContentAnalysis: true,
    excludePatterns: exclude_patterns,
    maxFileSize: max_file_size_mb * 1024 * 1024, // Convert MB to bytes
    detectOrphans: include_orphans,
    extractKeywords: true,
  };

  // Analyze vault structure (uses our core tools internally)
  const structure = await analyzeVaultStructure(context.projectFolder, analysisOptions);

  // Apply max_files limit if specified
  let files = structure.files;
  let limitApplied = false;
  if (max_files && files.length > max_files) {
    files = files.slice(0, max_files);
    limitApplied = true;
  }

  // Format size in human-readable format
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Build response object
  const response = {
    success: true,
    project_folder: context.projectFolder,
    analyzed_at: structure.analyzedAt,
    summary: {
      total_files: structure.totalFiles,
      analyzed_files: files.length,
      limit_applied: limitApplied,
      total_folders: Object.keys(structure.folders).length,
      total_size: formatSize(structure.totalSize),
      total_size_bytes: structure.totalSize,
      orphan_files: structure.orphanFiles.length,
    },
    ...(include_categories && {
      categories: Object.entries(structure.categories).map(([name, stats]) => ({
        name,
        file_count: stats.fileCount,
        total_size: formatSize(stats.totalSize),
        confidence: stats.avgConfidence,
      })),
    }),
    folders: Object.entries(structure.folders)
      .map(([path, stats]) => ({
        path,
        file_count: stats.fileCount,
        subfolder_count: stats.subfolderCount,
        total_size: formatSize(stats.totalSize),
      }))
      .sort((a, b) => b.file_count - a.file_count) // Sort by file count desc
      .slice(0, 20), // Limit to top 20 folders
    top_files: files
      .filter((f) => f.contentMetadata)
      .sort((a, b) => {
        // Sort by link count (incoming + outgoing)
        const aLinks =
          (a.contentMetadata?.links.length || 0) + (a.contentMetadata?.backlinks.length || 0);
        const bLinks =
          (b.contentMetadata?.links.length || 0) + (b.contentMetadata?.backlinks.length || 0);
        return bLinks - aLinks;
      })
      .slice(0, 10)
      .map((f) => ({
        path: f.path,
        name: f.name,
        size: formatSize(f.size),
        word_count: f.contentMetadata?.wordCount || 0,
        link_count: f.contentMetadata?.links.length || 0,
        backlink_count: f.contentMetadata?.backlinks.length || 0,
        tags: f.contentMetadata?.tags.slice(0, 5) || [],
        topics: f.topics.slice(0, 5),
      })),
    ...(include_orphans &&
      structure.orphanFiles.length > 0 && {
        orphan_files: structure.orphanFiles.slice(0, 20).map((path) => {
          const file = files.find((f) => f.path === path);
          return {
            path,
            name: file?.name || path.split('/').pop(),
            size: file ? formatSize(file.size) : 'unknown',
            word_count: file?.contentMetadata?.wordCount || 0,
          };
        }),
      }),
    insights: {
      avg_file_size: formatSize(
        structure.totalFiles > 0 ? structure.totalSize / structure.totalFiles : 0
      ),
      avg_links_per_file:
        files.length > 0
          ? (
              files.reduce((sum, f) => sum + (f.contentMetadata?.links.length || 0), 0) /
              files.length
            ).toFixed(2)
          : '0',
      files_with_tags: files.filter((f) => (f.contentMetadata?.tags.length || 0) > 0).length,
      files_with_frontmatter: files.filter(
        (f) => f.contentMetadata && Object.keys(f.contentMetadata.frontmatter).length > 0
      ).length,
    },
  };

  return JSON.stringify(response, null, 2);
}
