import { z } from 'zod';
import { ObsidianClient } from '../obsidian/index.js';
import { sanitizePath } from '../security/path-validator.js';
import { sessionState } from '../session-state.js';
import { config } from '../config/index.js';

export const getNoteMetadataSchema = z.object({
  path: z
    .string()
    .min(1)
    .describe(
      'Project-relative path to the note. CORRECT: "CHANGELOG.md", "docs/api.md". ' +
        'INCORRECT: "/Users/name/file.md", "Users/name/file.md", "C:/path/file.md". ' +
        'Use paths relative to project root only, NOT absolute filesystem paths.'
    ),
  project_folder: z
    .string()
    .optional()
    .describe('Optional: Override the project folder for this operation'),
});

export type GetNoteMetadataInput = z.infer<typeof getNoteMetadataSchema>;

interface Frontmatter {
  [key: string]: unknown;
}

interface NoteMetadata {
  size: number;
  lines: number;
  words: number;
  characters: number;
  frontmatter: Frontmatter | null;
  tags: string[];
  headings: string[];
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): {
  frontmatter: Frontmatter | null;
  contentWithoutFrontmatter: string;
} {
  const lines = content.split('\n');

  // Check if content starts with frontmatter delimiter
  if (lines[0]?.trim() !== '---') {
    return { frontmatter: null, contentWithoutFrontmatter: content };
  }

  // Find closing delimiter
  let closingIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') {
      closingIndex = i;
      break;
    }
  }

  if (closingIndex === -1) {
    return { frontmatter: null, contentWithoutFrontmatter: content };
  }

  // Extract frontmatter lines
  const frontmatterLines = lines.slice(1, closingIndex);
  const contentWithoutFrontmatter = lines.slice(closingIndex + 1).join('\n');

  // Parse simple YAML (basic key-value pairs and arrays)
  const frontmatter: Frontmatter = {};
  let currentKey: string | null = null;
  let currentArray: string[] = [];

  for (const line of frontmatterLines) {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) continue;

    // Array item
    if (trimmedLine.startsWith('- ')) {
      if (currentKey && currentArray) {
        currentArray.push(trimmedLine.slice(2).trim());
      }
      continue;
    }

    // Save previous array if exists
    if (currentKey && currentArray.length > 0) {
      frontmatter[currentKey] = currentArray;
      currentArray = [];
    }

    // Key-value pair
    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex > 0) {
      currentKey = trimmedLine.slice(0, colonIndex).trim();
      const value = trimmedLine.slice(colonIndex + 1).trim();

      if (value) {
        // Remove quotes if present
        const unquotedValue = value.replace(/^["']|["']$/g, '');
        frontmatter[currentKey] = unquotedValue;
        currentKey = null; // Reset for next iteration
      } else {
        // Value might be on next line or it's an array
        currentArray = [];
      }
    }
  }

  // Save last array if exists
  if (currentKey && currentArray.length > 0) {
    frontmatter[currentKey] = currentArray;
  }

  return { frontmatter, contentWithoutFrontmatter };
}

/**
 * Extract tags from frontmatter
 */
function extractTags(frontmatter: Frontmatter | null): string[] {
  if (!frontmatter) return [];

  const tags: string[] = [];

  // Check for 'tags' field
  if (frontmatter.tags) {
    if (Array.isArray(frontmatter.tags)) {
      tags.push(...frontmatter.tags.map(String));
    } else {
      tags.push(String(frontmatter.tags));
    }
  }

  // Check for 'tag' field (singular)
  if (frontmatter.tag) {
    if (Array.isArray(frontmatter.tag)) {
      tags.push(...frontmatter.tag.map(String));
    } else {
      tags.push(String(frontmatter.tag));
    }
  }

  return tags;
}

/**
 * Extract markdown headings from content
 */
function extractHeadings(content: string): string[] {
  const headings: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('#')) {
      headings.push(trimmedLine);
    }
  }

  return headings;
}

/**
 * Count words in text (ignoring markdown syntax)
 */
function countWords(text: string): number {
  // Remove markdown syntax patterns
  const cleanedText = text
    .replace(/^#+\s/gm, '') // Remove heading markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
    .replace(/[*_~`]/g, '') // Remove emphasis markers
    .replace(/^[-*+]\s/gm, '') // Remove list markers
    .trim();

  if (!cleanedText) return 0;

  // Split by whitespace and count
  return cleanedText.split(/\s+/).filter((word) => word.length > 0).length;
}

export async function getNoteMetadata(input: GetNoteMetadataInput): Promise<string> {
  const { path, project_folder } = input;

  // Get project context (use override if provided, otherwise session/detected)
  const context = await sessionState.getProjectContext(project_folder, config.projectBasePath);

  // Sanitize and validate path
  const sanitizedPath = sanitizePath(path, context.projectFolder, context.basePath);

  // Initialize Obsidian client
  const client = new ObsidianClient({
    apiUrl: config.obsidianApiUrl,
    apiKey: config.obsidianApiKey,
    vault: config.obsidianVault,
    allowInsecure: config.nodeEnv === 'development',
  });

  // Read the note
  const content = await client.readNote(sanitizedPath);

  // Parse frontmatter
  const { frontmatter, contentWithoutFrontmatter } = parseFrontmatter(content);

  // Extract metadata
  const tags = extractTags(frontmatter);
  const headings = extractHeadings(contentWithoutFrontmatter);
  const lines = content.split('\n').length;
  const words = countWords(contentWithoutFrontmatter);
  const characters = content.length;
  const size = Buffer.byteLength(content, 'utf8');

  const metadata: NoteMetadata = {
    size,
    lines,
    words,
    characters,
    frontmatter,
    tags,
    headings,
  };

  // Return response
  return JSON.stringify(
    {
      success: true,
      path: sanitizedPath,
      project_folder: context.projectFolder,
      metadata,
    },
    null,
    2
  );
}
