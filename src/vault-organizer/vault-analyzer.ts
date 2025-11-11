/**
 * Vault Analyzer Module
 *
 * Handles vault scanning and content analysis for intelligent organization.
 * Provides mechanical analysis of markdown files including metadata extraction,
 * content parsing, and file categorization.
 */

import { ObsidianClient } from '../obsidian/client.js';
import {
  VaultStructure,
  VaultFileInfo,
  ContentMetadata,
  FolderStats,
  CategoryStats,
  AnalysisOptions,
  VaultAnalysisError,
} from './types.js';

// Common stop words to filter from keywords
const STOP_WORDS = new Set([
  'the',
  'be',
  'to',
  'of',
  'and',
  'a',
  'in',
  'that',
  'have',
  'i',
  'it',
  'for',
  'not',
  'on',
  'with',
  'he',
  'as',
  'you',
  'do',
  'at',
  'this',
  'but',
  'his',
  'by',
  'from',
  'they',
  'we',
  'say',
  'her',
  'she',
  'or',
  'an',
  'will',
  'my',
  'one',
  'all',
  'would',
  'there',
  'their',
]);

/**
 * Analyzes the complete structure of a vault for a given project
 *
 * Scans all markdown files in the vault, extracts metadata and content,
 * builds folder and category statistics, and identifies orphan files.
 *
 * @param client - ObsidianClient instance for vault access
 * @param projectFolder - Project folder identifier (used for vault organization)
 * @param options - Analysis options to control behavior
 * @returns Complete vault structure with all analyzed files and statistics
 * @throws VaultAnalysisError if analysis fails
 */
export async function analyzeVaultStructure(
  client: ObsidianClient,
  projectFolder: string,
  options: AnalysisOptions = {}
): Promise<VaultStructure> {
  try {
    const {
      includeContentAnalysis = true,
      excludePatterns = [],
      maxFileSize = 10 * 1024 * 1024, // 10MB default
      detectOrphans = true,
      extractKeywords: shouldExtractKeywords = true,
    } = options;

    // Get all files in the vault for this project
    const projectPath = `projects/${projectFolder}`;
    let filePaths: string[] = [];

    try {
      filePaths = await client.listNotes(projectPath);
    } catch (error) {
      // If project folder doesn't exist, return empty structure
      if (error instanceof Error && error.message.includes('404')) {
        return {
          rootPath: projectPath,
          totalFiles: 0,
          totalSize: 0,
          analyzedAt: new Date().toISOString(),
          files: [],
          folders: {},
          categories: {},
          orphanFiles: [],
        };
      }
      throw error;
    }

    // Filter files based on exclude patterns
    const filteredPaths = filePaths.filter((path) => {
      return !excludePatterns.some((pattern) => matchGlobPattern(path, pattern));
    });

    // Analyze each file
    const files: VaultFileInfo[] = [];
    let totalSize = 0;

    for (const relativePath of filteredPaths) {
      try {
        const fullPath = `${projectPath}/${relativePath}`;

        // Get file content to determine size and extract metadata
        const content = await client.readNote(fullPath);
        const fileSize = Buffer.byteLength(content, 'utf8');

        // Skip files exceeding max size
        if (fileSize > maxFileSize) {
          continue;
        }

        totalSize += fileSize;

        // Extract file metadata
        const name = relativePath.split('/').pop() || relativePath;
        const extension = name.split('.').pop() || '';

        // Analyze content if enabled
        let contentMetadata: ContentMetadata | undefined;
        if (includeContentAnalysis && extension === 'md') {
          contentMetadata = await analyzeFileContent(client, fullPath);
        }

        // Extract keywords if enabled
        const keywords = shouldExtractKeywords && contentMetadata ? extractKeywords(content) : [];

        const fileInfo: VaultFileInfo = {
          path: fullPath,
          name,
          extension,
          size: fileSize,
          created: new Date().toISOString(), // API doesn't provide creation time
          modified: new Date().toISOString(), // API doesn't provide modification time
          contentMetadata,
          keywords,
          topics: [], // Will be populated by extractTopics
        };

        // Extract topics
        const topics = extractTopics(fileInfo);
        files.push({ ...fileInfo, topics });
      } catch (error) {
        // Log error but continue with other files
        console.warn(`Failed to analyze file ${relativePath}:`, error);
      }
    }

    // Build folder statistics
    const folders = buildFolderStats(files, projectPath);

    // Build category statistics
    const categories = buildCategoryStats(files);

    // Detect orphan files if enabled
    const orphanFiles = detectOrphans ? findOrphanFiles(files) : [];

    return {
      rootPath: projectPath,
      totalFiles: files.length,
      totalSize,
      analyzedAt: new Date().toISOString(),
      files,
      folders,
      categories,
      orphanFiles,
    };
  } catch (error) {
    throw new VaultAnalysisError(
      `Failed to analyze vault structure for project ${projectFolder}`,
      projectFolder,
      error
    );
  }
}

/**
 * Analyzes the content of a single file
 *
 * Extracts structural elements including headings, frontmatter, links,
 * tags, code blocks, and calculates word count.
 *
 * @param client - ObsidianClient instance for vault access
 * @param filePath - Full path to the file in the vault
 * @returns Content metadata with all extracted information
 * @throws VaultAnalysisError if content analysis fails
 */
export async function analyzeFileContent(
  client: ObsidianClient,
  filePath: string
): Promise<ContentMetadata> {
  try {
    const content = await client.readNote(filePath);

    // Extract headings (lines starting with #)
    const headings = extractHeadings(content);

    // Extract and parse frontmatter
    const frontmatter = extractFrontmatter(content);

    // Extract internal links
    const links = extractLinks(content);

    // Extract tags
    const tags = extractTags(content, frontmatter);

    // Count words (excluding frontmatter and code blocks)
    const wordCount = countWords(content);

    // Extract code blocks
    const codeBlocks = extractCodeBlocks(content);

    // Note: backlinks would require analyzing other files, which is expensive
    // For now, we return an empty array and can populate this in a separate pass if needed
    const backlinks: string[] = [];

    return {
      headings,
      frontmatter,
      wordCount,
      links,
      backlinks,
      codeBlocks,
      tags,
    };
  } catch (error) {
    throw new VaultAnalysisError(`Failed to analyze file content`, filePath, error);
  }
}

/**
 * Categorizes a file based on its path, name, and content
 *
 * Uses heuristics to determine the most appropriate category:
 * - documentation: README, docs, guides
 * - meeting-notes: meetings, notes with date patterns
 * - project-plans: planning, roadmap, project
 * - reference: reference, resources, links
 * - journal: journal, daily, diary
 * - uncategorized: fallback
 *
 * @param fileInfo - File information including path and content metadata
 * @returns Category string
 */
export function categorizeFile(fileInfo: VaultFileInfo): string {
  const { path, name, contentMetadata } = fileInfo;
  const lowerPath = path.toLowerCase();
  const lowerName = name.toLowerCase();

  // Check frontmatter for explicit type/category
  if (contentMetadata?.frontmatter.type) {
    const type = String(contentMetadata.frontmatter.type).toLowerCase();
    if (
      ['documentation', 'meeting-notes', 'project-plans', 'reference', 'journal'].includes(type)
    ) {
      return type;
    }
  }

  // Documentation patterns
  if (
    lowerName.includes('readme') ||
    lowerPath.includes('/docs/') ||
    lowerPath.includes('/documentation/') ||
    lowerName.includes('guide') ||
    lowerName.includes('tutorial')
  ) {
    return 'documentation';
  }

  // Meeting notes patterns
  if (
    lowerPath.includes('/meetings/') ||
    lowerPath.includes('/notes/') ||
    lowerName.includes('meeting') ||
    /\d{4}-\d{2}-\d{2}/.test(lowerName) // Date pattern YYYY-MM-DD
  ) {
    return 'meeting-notes';
  }

  // Project plans patterns
  if (
    lowerPath.includes('/planning/') ||
    lowerPath.includes('/plans/') ||
    lowerName.includes('roadmap') ||
    lowerName.includes('plan') ||
    lowerName.includes('project')
  ) {
    return 'project-plans';
  }

  // Reference patterns
  if (
    lowerPath.includes('/reference/') ||
    lowerPath.includes('/resources/') ||
    lowerName.includes('reference') ||
    lowerName.includes('links') ||
    lowerName.includes('bookmarks')
  ) {
    return 'reference';
  }

  // Journal patterns
  if (
    lowerPath.includes('/journal/') ||
    lowerPath.includes('/daily/') ||
    lowerPath.includes('/diary/') ||
    lowerName.includes('journal') ||
    lowerName.includes('diary')
  ) {
    return 'journal';
  }

  return 'uncategorized';
}

/**
 * Extracts important keywords from content
 *
 * Tokenizes content, filters stop words and short words,
 * counts frequency, and returns top keywords.
 *
 * @param content - File content to analyze
 * @returns Array of top keywords (limited to 20)
 */
export function extractKeywords(content: string): string[] {
  // Remove frontmatter, code blocks, and links for cleaner keyword extraction
  let cleanContent = content.replace(/^---\n[\s\S]*?\n---\n/, ''); // Remove frontmatter
  cleanContent = cleanContent.replace(/```[\s\S]*?```/g, ''); // Remove code blocks
  cleanContent = cleanContent.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Extract text from markdown links
  cleanContent = cleanContent.replace(/\[\[([^\]]+)\]\]/g, '$1'); // Extract text from wiki links

  // Tokenize: split on whitespace and punctuation
  const words = cleanContent
    .toLowerCase()
    .split(/[\s\n\r.,;:!?()[\]{}'"]+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));

  // Count frequency
  const frequency = new Map<string, number>();
  for (const word of words) {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  }

  // Sort by frequency and take top 20
  const sorted = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);

  return sorted;
}

/**
 * Infers topics from file information
 *
 * Combines information from headings, tags, and keywords
 * to determine relevant topics for the file.
 *
 * @param fileInfo - File information including content metadata
 * @returns Array of inferred topics
 */
export function extractTopics(fileInfo: VaultFileInfo): string[] {
  const topics = new Set<string>();

  // Add tags as topics
  if (fileInfo.contentMetadata?.tags) {
    fileInfo.contentMetadata.tags.forEach((tag) => {
      // Remove # prefix if present
      const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
      topics.add(cleanTag);
    });
  }

  // Add top keywords as topics (limit to 5)
  if (fileInfo.keywords) {
    fileInfo.keywords.slice(0, 5).forEach((keyword) => topics.add(keyword));
  }

  // Extract topics from headings (H1 and H2 only)
  if (fileInfo.contentMetadata?.headings) {
    fileInfo.contentMetadata.headings.slice(0, 3).forEach((heading) => {
      // Clean heading: remove #, trim, convert to lowercase
      const cleanHeading = heading
        .replace(/^#+\s*/, '')
        .trim()
        .toLowerCase();
      if (cleanHeading.length > 3 && cleanHeading.length < 50) {
        topics.add(cleanHeading);
      }
    });
  }

  return Array.from(topics).slice(0, 10); // Limit to 10 topics
}

// ============================================
// Helper Functions
// ============================================

/**
 * Extracts headings from markdown content
 */
function extractHeadings(content: string): string[] {
  const headingRegex = /^#{1,6}\s+(.+)$/gm;
  const headings: string[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    headings.push(match[0].trim());
  }

  return headings;
}

/**
 * Extracts and parses YAML frontmatter
 */
function extractFrontmatter(content: string): Record<string, unknown> {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {};
  }

  try {
    const yamlContent = match[1];
    const frontmatter: Record<string, unknown> = {};

    // Simple YAML parser for common cases
    const lines = yamlContent.split('\n');
    let currentKey: string | null = null;
    const arrayValues: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Array item
      if (trimmed.startsWith('- ')) {
        if (currentKey) {
          arrayValues.push(trimmed.slice(2).trim());
        }
        continue;
      }

      // Save previous array if we had one
      if (currentKey && arrayValues.length > 0) {
        frontmatter[currentKey] = arrayValues.slice();
        arrayValues.length = 0;
      }

      // Key-value pair
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.slice(0, colonIndex).trim();
        let value: unknown = trimmed.slice(colonIndex + 1).trim();

        // Remove quotes
        if (typeof value === 'string') {
          value = value.replace(/^["'](.*)["']$/, '$1');
        }

        // Try to parse as number or boolean
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (typeof value === 'string' && /^\d+$/.test(value)) value = parseInt(value, 10);
        else if (typeof value === 'string' && /^\d+\.\d+$/.test(value)) value = parseFloat(value);

        currentKey = key;
        if (value !== '') {
          frontmatter[key] = value;
        }
      }
    }

    // Save last array if any
    if (currentKey && arrayValues.length > 0) {
      frontmatter[currentKey] = arrayValues;
    }

    return frontmatter;
  } catch {
    // Return empty object if parsing fails
    return {};
  }
}

/**
 * Extracts internal links from content
 */
function extractLinks(content: string): string[] {
  const links: string[] = [];

  // Wiki-style links [[link]] or [[link|display]]
  const wikiLinkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let match;
  while ((match = wikiLinkRegex.exec(content)) !== null) {
    links.push(match[1].trim());
  }

  // Markdown links [text](link.md)
  const mdLinkRegex = /\[([^\]]+)\]\(([^)]+\.md)\)/g;
  while ((match = mdLinkRegex.exec(content)) !== null) {
    links.push(match[2].trim());
  }

  return Array.from(new Set(links)); // Deduplicate
}

/**
 * Extracts tags from content and frontmatter
 */
function extractTags(content: string, frontmatter: Record<string, unknown>): string[] {
  const tags = new Set<string>();

  // Extract from frontmatter
  if (frontmatter.tags) {
    if (Array.isArray(frontmatter.tags)) {
      frontmatter.tags.forEach((tag) => tags.add(String(tag)));
    } else {
      tags.add(String(frontmatter.tags));
    }
  }

  // Extract inline tags (#tag)
  const tagRegex = /#([a-zA-Z0-9_-]+)/g;
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    tags.add(match[1]);
  }

  return Array.from(tags);
}

/**
 * Counts words in content (excluding frontmatter and code blocks)
 */
function countWords(content: string): number {
  // Remove frontmatter
  let cleanContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');

  // Remove code blocks
  cleanContent = cleanContent.replace(/```[\s\S]*?```/g, '');

  // Remove inline code
  cleanContent = cleanContent.replace(/`[^`]+`/g, '');

  // Split by whitespace and count
  const words = cleanContent.split(/\s+/).filter((word) => word.length > 0);

  return words.length;
}

/**
 * Extracts code block language identifiers
 */
function extractCodeBlocks(content: string): string[] {
  const codeBlockRegex = /```(\w+)?\n[\s\S]*?```/g;
  const languages: string[] = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const lang = match[1];
    if (lang) {
      languages.push(lang);
    }
  }

  return Array.from(new Set(languages)); // Deduplicate
}

/**
 * Builds folder statistics from analyzed files
 */
function buildFolderStats(files: VaultFileInfo[], rootPath: string): Record<string, FolderStats> {
  const folders = new Map<string, FolderStats>();

  for (const file of files) {
    // Extract folder path (remove root and filename)
    const relativePath = file.path.replace(rootPath + '/', '');
    const pathParts = relativePath.split('/');
    pathParts.pop(); // Remove filename

    // Build folder path incrementally
    let currentPath = '';
    for (const part of pathParts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      const existing = folders.get(currentPath);
      if (existing) {
        folders.set(currentPath, {
          fileCount: existing.fileCount + 1,
          subfolderCount: existing.subfolderCount,
          totalSize: existing.totalSize + file.size,
          files: [...existing.files, file.path],
        });
      } else {
        folders.set(currentPath, {
          fileCount: 1,
          subfolderCount: 0,
          totalSize: file.size,
          files: [file.path],
        });
      }
    }
  }

  // Convert to plain object
  return Object.fromEntries(folders);
}

/**
 * Builds category statistics from analyzed files
 */
function buildCategoryStats(files: VaultFileInfo[]): Record<string, CategoryStats> {
  const categories = new Map<string, CategoryStats>();

  for (const file of files) {
    const category = categorizeFile(file);

    const existing = categories.get(category);
    if (existing) {
      categories.set(category, {
        fileCount: existing.fileCount + 1,
        totalSize: existing.totalSize + file.size,
        files: [...existing.files, file.path],
        avgConfidence: existing.avgConfidence, // No AI confidence yet
      });
    } else {
      categories.set(category, {
        fileCount: 1,
        totalSize: file.size,
        files: [file.path],
        avgConfidence: 1.0, // Manual categorization has full confidence
      });
    }
  }

  return Object.fromEntries(categories);
}

/**
 * Finds orphan files (no incoming or outgoing links)
 */
function findOrphanFiles(files: VaultFileInfo[]): string[] {
  const orphans: string[] = [];

  for (const file of files) {
    const hasOutgoingLinks = (file.contentMetadata?.links.length || 0) > 0;
    const hasIncomingLinks = (file.contentMetadata?.backlinks.length || 0) > 0;

    if (!hasOutgoingLinks && !hasIncomingLinks) {
      orphans.push(file.path);
    }
  }

  return orphans;
}

/**
 * Simple glob pattern matching
 */
function matchGlobPattern(path: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}
