import { z } from 'zod';
import fuzzysort from 'fuzzysort';
import { ObsidianClient } from '../obsidian/index.js';
import { sessionState } from '../session-state.js';
import { config } from '../config/index.js';

export const listNotesSchema = z
  .object({
    path: z
      .string()
      .optional()
      .describe(
        'Optional: Relative path to a folder within the project. Omit, use empty string, "/" or "." for project root. Examples: "docs", "meetings/2024"'
      ),
    fuzzy_query: z
      .string()
      .optional()
      .describe(
        'Optional: Fuzzy search query to filter files. Searches both filename and full path.'
      ),
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Maximum number of results to return. Default: 50'),
    min_score: z
      .number()
      .optional()
      .describe('Minimum fuzzy match score threshold. Default: -10000'),
    include_highlights: z
      .boolean()
      .optional()
      .describe('Include match highlights with <b> tags in results. Default: true'),
  })
  .transform((data) => ({
    ...data,
    limit: data.limit ?? 50,
    min_score: data.min_score ?? -10000,
    include_highlights: data.include_highlights ?? true,
  }));

export type ListNotesInput = z.input<typeof listNotesSchema>;

/**
 * Performs fuzzy search on file paths with filename prioritization
 * @param files Array of file paths to search
 * @param query Search query string
 * @param minScore Minimum score threshold
 * @param limit Maximum results to return
 * @param includeHighlights Whether to include highlighted matches
 * @returns Sorted array of search results with scores and optional highlights
 */
function fuzzySearchFiles(
  files: string[],
  query: string,
  minScore: number,
  limit: number,
  includeHighlights: boolean
): {
  path: string;
  score?: number;
  highlight?: string;
}[] {
  // Prepare targets for fuzzy search - search both filename and full path
  const targets = files.map((file) => {
    const filename = file.split('/').pop() || file;
    return {
      path: file,
      filename,
    };
  });

  // Search on both filename and full path, then combine results
  const filenameResults = fuzzysort.go(query, targets, {
    key: 'filename',
    threshold: minScore,
  });

  const pathResults = fuzzysort.go(query, targets, {
    key: 'path',
    threshold: minScore,
  });

  // Combine and deduplicate results, boosting filename matches
  const resultsMap = new Map<
    string,
    { path: string; score: number; highlight: string; isFilenameMatch: boolean }
  >();

  // Add filename matches with 1.5x score boost
  for (const result of filenameResults) {
    const boostedScore = result.score * 1.5;
    const highlighted = result.highlight('<b>', '</b>');
    resultsMap.set(result.obj.path, {
      path: result.obj.path,
      score: boostedScore,
      highlight: highlighted || result.obj.filename,
      isFilenameMatch: true,
    });
  }

  // Add path matches (if not already present or if score is better)
  for (const result of pathResults) {
    const existing = resultsMap.get(result.obj.path);
    if (!existing || result.score > existing.score) {
      // Keep the better score, but preserve filename match flag if it was already matched
      const highlighted = result.highlight('<b>', '</b>');
      resultsMap.set(result.obj.path, {
        path: result.obj.path,
        score: existing?.isFilenameMatch ? existing.score : result.score,
        highlight: highlighted || result.obj.path,
        isFilenameMatch: existing?.isFilenameMatch || false,
      });
    }
  }

  // Sort by score (descending) and apply limit
  const sortedResults = Array.from(resultsMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Format results
  return sortedResults.map((result) => ({
    path: result.path,
    ...(includeHighlights && { score: result.score, highlight: result.highlight }),
  }));
}

export async function listNotes(input: ListNotesInput): Promise<string> {
  const {
    path = '',
    fuzzy_query,
    limit = 50,
    min_score = -10000,
    include_highlights = true,
  } = input;

  const searchStartTime = performance.now();

  // Get project context (automatically detected from session/git)
  const context = await sessionState.getProjectContext(undefined, config.projectBasePath);

  // Build the full directory path
  // Format: "basePath/projectFolder/optionalSubPath"
  let fullPath = `${context.basePath}/${context.projectFolder}`;

  if (path && path.trim() !== '') {
    // Validate the subpath (basic security check - no traversal)
    const cleanPath = path.trim().replace(/^\/+|\/+$/g, '');
    if (cleanPath.includes('..')) {
      throw new Error('Path traversal is not allowed');
    }
    // Only append if cleanPath is not empty and not just '.'
    if (cleanPath && cleanPath !== '.') {
      fullPath = `${fullPath}/${cleanPath}`;
    }
  }

  // Initialize Obsidian client
  const client = new ObsidianClient({
    apiUrl: config.obsidianApiUrl,
    apiKey: config.obsidianApiKey,
    vault: config.obsidianVault,
    allowInsecure: config.nodeEnv === 'development', // Allow self-signed certs in dev
  });

  // List notes in the directory
  const allFiles = await client.listNotes(fullPath);

  // Apply fuzzy search if query is provided
  let files: (string | { path: string; score?: number; highlight?: string })[] = allFiles;
  let totalMatches = allFiles.length;
  let limited = false;
  let searchTimeMs: number | undefined;

  if (fuzzy_query && fuzzy_query.trim() !== '') {
    const fuzzyResults = fuzzySearchFiles(
      allFiles,
      fuzzy_query.trim(),
      min_score,
      limit,
      include_highlights
    );
    files = fuzzyResults;
    totalMatches = fuzzyResults.length;
    limited = totalMatches > limit;
    searchTimeMs = performance.now() - searchStartTime;
  }

  // Build response object
  const response: {
    success: boolean;
    path: string;
    project_folder: string;
    files: (string | { path: string; score?: number; highlight?: string })[];
    count: number;
    query?: string;
    total_matches?: number;
    limited?: boolean;
    search_time_ms?: number;
  } = {
    success: true,
    path: fullPath,
    project_folder: context.projectFolder,
    files,
    count: files.length,
  };

  // Add fuzzy search metadata if query was provided
  if (fuzzy_query && fuzzy_query.trim() !== '') {
    response.query = fuzzy_query.trim();
    response.total_matches = totalMatches;
    response.limited = limited;
    response.search_time_ms = searchTimeMs;
  }

  return JSON.stringify(response, null, 2);
}
