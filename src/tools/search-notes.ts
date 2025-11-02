import { z } from 'zod';
import { ObsidianClient } from '../obsidian/index.js';
import { sessionState } from '../session-state.js';
import { config } from '../config/index.js';

export const searchNotesSchema = z.object({
  query: z.string().min(1).describe('Search query text to find in note contents'),
  project_folder: z.string().optional().describe('Optional: Override the project folder for this operation'),
  case_sensitive: z.boolean().optional().default(false).describe('Whether to perform case-sensitive search (default: false)'),
  limit: z.number().optional().default(10).describe('Maximum number of results to return (default: 10)'),
});

export type SearchNotesInput = z.infer<typeof searchNotesSchema>;

interface SearchMatch {
  path: string;
  snippet: string;
  line: number;
}

/**
 * Extract a snippet of text around a match with context
 */
function extractSnippet(content: string, matchIndex: number, contextLength: number = 100): string {
  const start = Math.max(0, matchIndex - contextLength);
  const end = Math.min(content.length, matchIndex + contextLength);
  
  let snippet = content.slice(start, end);
  
  // Add ellipsis if we're not at the start/end
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';
  
  return snippet.trim();
}

/**
 * Find the line number of a match in content
 */
function getLineNumber(content: string, matchIndex: number): number {
  const beforeMatch = content.slice(0, matchIndex);
  return beforeMatch.split('\n').length;
}

export async function searchNotes(input: SearchNotesInput): Promise<string> {
  const { query, project_folder, case_sensitive = false, limit = 10 } = input;
  
  // Get project context (use override if provided, otherwise session/detected)
  const context = await sessionState.getProjectContext(
    project_folder,
    config.projectBasePath
  );
  
  // Initialize Obsidian client
  const client = new ObsidianClient({
    apiUrl: config.obsidianApiUrl,
    apiKey: config.obsidianApiKey,
    vault: config.obsidianVault,
    allowInsecure: config.nodeEnv === 'development',
  });
  
  // Get all files in the project folder
  const files = await client.listNotes(context.projectFolder);
  
  const matches: SearchMatch[] = [];
  const searchQuery = case_sensitive ? query : query.toLowerCase();
  
  // Search through each file
  for (const filePath of files) {
    // Stop if we've reached the limit
    if (matches.length >= limit) {
      break;
    }
    
    try {
      // Read file content
      const content = await client.readNote(filePath);
      const searchContent = case_sensitive ? content : content.toLowerCase();
      
      // Find all occurrences in this file
      let startIndex = 0;
      while (startIndex < searchContent.length && matches.length < limit) {
        const matchIndex = searchContent.indexOf(searchQuery, startIndex);
        
        if (matchIndex === -1) {
          break; // No more matches in this file
        }
        
        // Extract snippet and line number
        const snippet = extractSnippet(content, matchIndex);
        const line = getLineNumber(content, matchIndex);
        
        matches.push({
          path: filePath,
          snippet,
          line,
        });
        
        // Move past this match
        startIndex = matchIndex + searchQuery.length;
      }
    } catch (error) {
      // Skip files that can't be read
      console.error(`Failed to read file ${filePath}:`, error);
      continue;
    }
  }
  
  // Return search results
  return JSON.stringify({
    success: true,
    query,
    project_folder: context.projectFolder,
    matches,
    total: matches.length,
    limited: matches.length >= limit,
  }, null, 2);
}
