import { z } from 'zod';
import { ObsidianClient } from '../obsidian/index.js';
import { sanitizePath } from '../security/path-validator.js';
import { sessionState } from '../session-state.js';
import { config } from '../config/index.js';

export const replaceSectionSchema = z.object({
  path: z
    .string()
    .min(1)
    .describe(
      'Project-relative path to the note. CORRECT: "CHANGELOG.md", "docs/api.md". ' +
        'INCORRECT: "/Users/name/file.md", "Users/name/file.md", "C:/path/file.md". ' +
        'Use paths relative to project root only, NOT absolute filesystem paths.'
    ),
  heading: z
    .string()
    .min(1)
    .describe(
      'Heading text to find (without # symbols, e.g., "Installation" not "## Installation")'
    ),
  content: z.string().describe('New content for the section'),
  mode: z
    .enum(['content-only', 'full', 'heading-only'])
    .optional()
    .default('content-only')
    .describe(
      'Replace mode: content-only (default, replace only section content), ' +
        'full (replace both heading and content), ' +
        'heading-only (replace only heading text, preserve content)'
    ),
  level: z
    .number()
    .int()
    .min(1)
    .max(6)
    .optional()
    .describe('Filter by heading level (1-6). Use to disambiguate duplicate headings.'),
  index: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Which occurrence to replace if duplicates exist (0-based). Use to disambiguate.'),
  preview: z
    .boolean()
    .optional()
    .default(false)
    .describe('Preview changes without applying them. Returns before/after comparison.'),
  createIfMissing: z
    .boolean()
    .optional()
    .default(false)
    .describe('Create section at end of file if not found. Only applies to content-only mode.'),
  project_folder: z
    .string()
    .optional()
    .describe('Optional project folder override (uses session context if omitted)'),
});

// Export inferred type but override to make default fields optional
export type ReplaceSectionInput = Omit<
  z.infer<typeof replaceSectionSchema>,
  'mode' | 'preview' | 'createIfMissing'
> & {
  mode?: 'content-only' | 'full' | 'heading-only';
  preview?: boolean;
  createIfMissing?: boolean;
};

/**
 * Represents a heading in a markdown document
 */
interface Heading {
  text: string;
  level: number;
  line: number; // Line number (0-based)
  raw: string; // Full line with # symbols
}

/**
 * Represents a section in a markdown document
 */
interface Section {
  heading: Heading;
  contentStartLine: number; // Line after heading
  contentEndLine: number; // Last line of content (exclusive)
  sectionContent: string; // Content without heading
}

/**
 * Parse all headings from markdown content
 * Extracts ATX-style headings (# Heading)
 *
 * @param content - Markdown content
 * @returns Array of heading objects with metadata
 */
function parseHeadings(content: string): Heading[] {
  const lines = content.split('\n');
  const headings: Heading[] = [];

  // Match ATX-style headings: ## Heading
  const headingRegex = /^(#{1,6})\s+(.+?)(?:\s*#+)?$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line?.match(headingRegex);

    if (match) {
      const level = match[1]!.length;
      const text = match[2]!.trim();

      headings.push({
        text,
        level,
        line: i,
        raw: line,
      });
    }
  }

  return headings;
}

/**
 * Find a section by heading text, level, and/or index
 *
 * @param content - Markdown content
 * @param headingText - Heading text to search for (case-insensitive)
 * @param level - Optional heading level filter
 * @param index - Optional occurrence index (0-based)
 * @returns Section object or null if not found
 * @throws Error if multiple matches found without index/level to disambiguate
 */
function findSection(
  content: string,
  headingText: string,
  level?: number,
  index?: number
): Section | null {
  const lines = content.split('\n');
  const headings = parseHeadings(content);

  // Find matching headings (case-insensitive)
  const matches = headings.filter((h) => {
    const textMatch = h.text.toLowerCase() === headingText.toLowerCase();
    const levelMatch = level === undefined || h.level === level;
    return textMatch && levelMatch;
  });

  if (matches.length === 0) {
    return null;
  }

  // Check for ambiguity
  if (matches.length > 1 && index === undefined) {
    const matchDetails = matches
      .map((m, i) => `  ${i}: "${m.raw}" at line ${m.line + 1}`)
      .join('\n');
    throw new Error(
      `Multiple headings found matching "${headingText}". ` +
        `Specify 'index' or 'level' to disambiguate:\n${matchDetails}`
    );
  }

  // Get the target heading
  const targetHeading = index !== undefined ? matches[index] : matches[0];

  if (!targetHeading) {
    throw new Error(`No heading found at index ${index}. Found ${matches.length} match(es).`);
  }

  // Find section boundaries
  // Section = heading line + content until next same/higher level heading (or EOF)
  const contentStartLine = targetHeading.line + 1;
  let contentEndLine = lines.length;

  // Find next same-or-higher level heading
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i]!;
    if (h.line > targetHeading.line && h.level <= targetHeading.level) {
      contentEndLine = h.line;
      break;
    }
  }

  // Extract section content (lines between heading and next section)
  const contentLines = lines.slice(contentStartLine, contentEndLine);
  const sectionContent = contentLines.join('\n');

  return {
    heading: targetHeading,
    contentStartLine,
    contentEndLine,
    sectionContent,
  };
}

/**
 * Replace a section in markdown content
 *
 * @param markdownContent - Original markdown content
 * @param section - Section to replace
 * @param newContent - New content for the section
 * @param mode - Replace mode
 * @param preserveNested - Whether to preserve nested subsections (used when level is specified)
 * @returns Updated markdown content
 */
function performSectionReplacement(
  markdownContent: string,
  section: Section,
  newContent: string,
  mode: 'content-only' | 'full' | 'heading-only',
  preserveNested: boolean = false
): string {
  const lines = markdownContent.split('\n');

  switch (mode) {
    case 'content-only': {
      let contentEndBeforeNested = section.contentEndLine;

      // If preserveNested is true (level was specified), find first nested heading
      if (preserveNested) {
        const headings = parseHeadings(markdownContent);

        // Find first nested heading (higher level number = lower in hierarchy)
        for (const h of headings) {
          if (h.line > section.contentStartLine && h.line < section.contentEndLine) {
            // This is a nested heading within our section
            contentEndBeforeNested = h.line;
            break;
          }
        }
      }

      // Remove content (either all or just direct content before nested headings)
      const linesToRemove = contentEndBeforeNested - section.contentStartLine;
      lines.splice(section.contentStartLine, linesToRemove);

      // Insert new content
      const contentToInsert = newContent ? newContent : '';
      const contentLines = contentToInsert.split('\n');

      lines.splice(section.contentStartLine, 0, ...contentLines);
      break;
    }

    case 'full': {
      // Replace both heading and content
      // Remove heading + content
      lines.splice(section.heading.line, section.contentEndLine - section.heading.line);

      // Insert new content (should include heading)
      const contentLines = newContent.split('\n');
      lines.splice(section.heading.line, 0, ...contentLines);
      break;
    }

    case 'heading-only': {
      // Replace only heading, preserve content
      lines[section.heading.line] = newContent;
      break;
    }
  }

  return lines.join('\n');
}

/**
 * Detect if heading exists multiple times
 *
 * @param content - Markdown content
 * @param headingText - Heading text to search for
 * @param level - Optional level filter
 * @returns Object with ambiguity information
 */
function detectAmbiguity(
  content: string,
  headingText: string,
  level?: number
): {
  isAmbiguous: boolean;
  matches: Heading[];
} {
  const headings = parseHeadings(content);

  const matches = headings.filter((h) => {
    const textMatch = h.text.toLowerCase() === headingText.toLowerCase();
    const levelMatch = level === undefined || h.level === level;
    return textMatch && levelMatch;
  });

  return {
    isAmbiguous: matches.length > 1,
    matches,
  };
}

/**
 * Replace a section in a markdown note by heading
 *
 * This tool allows targeted editing of markdown sections identified by heading.
 * Supports three replacement modes: content-only (default), full, and heading-only.
 * Enforces read-before-write to ensure current state is known before updating.
 *
 * Section boundaries are determined by heading level:
 * - A section includes the heading and all content until the next same/higher level heading
 * - Nested headings (lower level) are included in the section
 * - Content before the first heading (preamble) is always preserved
 *
 * @param input - Replace parameters
 * @param input.path - Project-relative path to the note
 * @param input.heading - Heading text to find (without # symbols)
 * @param input.content - New content for the section
 * @param input.mode - Replace mode: content-only (default), full, or heading-only
 * @param input.level - Optional heading level filter (1-6) to disambiguate duplicates
 * @param input.index - Optional occurrence index (0-based) to disambiguate duplicates
 * @param input.preview - Preview changes without applying them
 * @param input.createIfMissing - Create section at end if not found (content-only mode only)
 * @param input.project_folder - Optional project folder override
 * @returns Promise resolving to success response with section details
 */
export async function replaceSection(input: ReplaceSectionInput): Promise<string> {
  const {
    path,
    heading: headingText,
    content: newContent,
    mode = 'content-only',
    level,
    index,
    preview = false,
    createIfMissing = false,
    project_folder,
  } = input;

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

  // Read the existing note (enforces read-before-write)
  const existingContent = await client.readNote(sanitizedPath);

  // Check for ambiguity first
  const ambiguity = detectAmbiguity(existingContent, headingText, level);

  if (ambiguity.isAmbiguous && index === undefined) {
    const matchDetails = ambiguity.matches
      .map((m, i) => `  ${i}: Level ${m.level} - "${m.raw}" at line ${m.line + 1}`)
      .join('\n');

    return JSON.stringify(
      {
        success: false,
        error: 'Ambiguous heading',
        message: `Multiple headings found matching "${headingText}". Specify 'index' or 'level' to disambiguate.`,
        matches: ambiguity.matches.length,
        details: matchDetails,
        path: sanitizedPath,
      },
      null,
      2
    );
  }

  // Find the section
  let section: Section | null;
  try {
    section = findSection(existingContent, headingText, level, index);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return JSON.stringify(
      {
        success: false,
        error: 'Section search error',
        message,
        path: sanitizedPath,
      },
      null,
      2
    );
  }

  // Handle section not found
  if (!section) {
    if (createIfMissing && mode === 'content-only') {
      // Create new section at end of file
      const newHeadingLevel = level || 2;
      const headingPrefix = '#'.repeat(newHeadingLevel);
      const newSection = `\n${headingPrefix} ${headingText}\n${newContent}`;
      const updatedContent = existingContent.trimEnd() + newSection + '\n';

      if (preview) {
        return JSON.stringify(
          {
            success: true,
            preview: true,
            action: 'create',
            path: sanitizedPath,
            heading: headingText,
            level: newHeadingLevel,
            mode,
            before: existingContent.slice(-200), // Last 200 chars for context
            after: updatedContent.slice(-200 - newSection.length),
            message: `Preview: Would create new section "${headingText}" at end of file`,
          },
          null,
          2
        );
      }

      // Write the updated content
      await client.writeNote(sanitizedPath, updatedContent, 'overwrite');

      return JSON.stringify(
        {
          success: true,
          action: 'create',
          path: sanitizedPath,
          heading: headingText,
          level: newHeadingLevel,
          mode,
          project_folder: context.projectFolder,
          message: `Section "${headingText}" created successfully`,
        },
        null,
        2
      );
    }

    return JSON.stringify(
      {
        success: false,
        error: 'Section not found',
        message: `Heading "${headingText}" not found in file. ${
          mode === 'content-only'
            ? 'Set createIfMissing=true to create it.'
            : 'Cannot create section in full/heading-only mode.'
        }`,
        path: sanitizedPath,
      },
      null,
      2
    );
  }

  // Perform replacement
  // When level is specified, preserve nested subsections (used for disambiguation)
  const preserveNested = level !== undefined;
  const updatedContent = performSectionReplacement(
    existingContent,
    section,
    newContent,
    mode,
    preserveNested
  );

  // Preview mode - return comparison without writing
  if (preview) {
    // Extract relevant portions for preview
    const contextLines = 3;
    const lines = existingContent.split('\n');
    const startLine = Math.max(0, section.heading.line - contextLines);
    const endLine = Math.min(lines.length, section.contentEndLine + contextLines);
    const beforePreview = lines.slice(startLine, endLine).join('\n');

    const updatedLines = updatedContent.split('\n');
    const afterPreview = updatedLines.slice(startLine, endLine).join('\n');

    return JSON.stringify(
      {
        success: true,
        preview: true,
        action: 'replace',
        path: sanitizedPath,
        heading: headingText,
        level: section.heading.level,
        mode,
        section: {
          line: section.heading.line + 1, // 1-based for user display
          contentLines: section.contentEndLine - section.contentStartLine,
        },
        before: beforePreview,
        after: afterPreview,
        message: `Preview: Would replace ${mode} of section "${headingText}"`,
      },
      null,
      2
    );
  }

  // Write the updated content
  await client.writeNote(sanitizedPath, updatedContent, 'overwrite');

  // Return success response
  return JSON.stringify(
    {
      success: true,
      action: 'replace',
      path: sanitizedPath,
      heading: headingText,
      level: section.heading.level,
      mode,
      section: {
        line: section.heading.line + 1, // 1-based for user display
        contentLines: section.contentEndLine - section.contentStartLine,
      },
      project_folder: context.projectFolder,
      message: `Section "${headingText}" ${mode} replaced successfully`,
    },
    null,
    2
  );
}
