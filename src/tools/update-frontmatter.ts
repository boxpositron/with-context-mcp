import { z } from 'zod';
import { ObsidianClient } from '../obsidian/index.js';
import { sanitizePath } from '../security/path-validator.js';
import { sessionState } from '../session-state.js';
import { config } from '../config/index.js';

export const updateFrontmatterSchema = z.object({
  path: z
    .string()
    .min(1)
    .describe(
      'Project-relative path to the note. CORRECT: "CHANGELOG.md", "docs/api.md". ' +
        'INCORRECT: "/Users/name/file.md", "Users/name/file.md", "C:/path/file.md". ' +
        'Use paths relative to project root only, NOT absolute filesystem paths.'
    ),
  frontmatter: z
    .record(z.unknown())
    .describe('Frontmatter fields to add or update as key-value pairs'),
  mode: z
    .enum(['merge', 'replace'])
    .describe(
      'Update mode: merge (add/update fields, preserve others) or replace (overwrite entire frontmatter)'
    ),
  project_folder: z
    .string()
    .optional()
    .describe('Optional project folder override (uses session context if omitted)'),
});

export type UpdateFrontmatterInput = z.infer<typeof updateFrontmatterSchema>;

interface Frontmatter {
  [key: string]: unknown;
}

/**
 * Parse YAML frontmatter from markdown content
 * Returns the parsed frontmatter object and content without frontmatter
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
 * Build YAML frontmatter from object
 * Converts a frontmatter object to a properly formatted YAML string
 */
function buildFrontmatter(data: Record<string, unknown>): string {
  const lines = ['---'];

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      value.forEach((item) => lines.push(`  - ${item}`));
    } else if (typeof value === 'string') {
      // Escape quotes in strings
      const escaped = value.replace(/"/g, '\\"');
      lines.push(`${key}: "${escaped}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push('---');
  return lines.join('\n');
}

/**
 * Update frontmatter in a markdown note
 *
 * This tool allows you to add, update, or replace frontmatter fields in markdown notes.
 * It enforces read-before-write to ensure the current state is known before updating.
 *
 * @param input - Update parameters
 * @param input.path - Project-relative path to the note
 * @param input.frontmatter - Frontmatter fields to update
 * @param input.mode - 'merge' to add/update fields (preserving others) or 'replace' to overwrite all frontmatter
 * @param input.project_folder - Optional project folder override
 * @returns Promise resolving to success response with updated frontmatter
 */
export async function updateFrontmatter(input: UpdateFrontmatterInput): Promise<string> {
  const { path, frontmatter: newFrontmatter, mode, project_folder } = input;

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

  // Parse existing frontmatter
  const { frontmatter: existingFrontmatter, contentWithoutFrontmatter } =
    parseFrontmatter(existingContent);

  // Build updated frontmatter based on mode
  let updatedFrontmatter: Record<string, unknown>;

  if (mode === 'merge') {
    // Merge mode: combine existing and new frontmatter
    updatedFrontmatter = {
      ...(existingFrontmatter || {}),
      ...newFrontmatter,
    };
  } else {
    // Replace mode: use only new frontmatter
    updatedFrontmatter = { ...newFrontmatter };
  }

  // Build the new content with updated frontmatter
  const yamlFrontmatter = buildFrontmatter(updatedFrontmatter);
  const newContent = `${yamlFrontmatter}\n${contentWithoutFrontmatter}`;

  // Write back the updated content
  await client.writeNote(sanitizedPath, newContent, 'overwrite');

  // Return success response
  return JSON.stringify(
    {
      success: true,
      path: sanitizedPath,
      mode,
      project_folder: context.projectFolder,
      frontmatter: updatedFrontmatter,
      message: `Frontmatter ${mode === 'merge' ? 'merged' : 'replaced'} successfully`,
    },
    null,
    2
  );
}
