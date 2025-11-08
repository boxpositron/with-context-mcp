/**
 * Setup Notes Tool
 * Sets up documentation delegation configuration and vault folder structure
 */

import { promises as fs } from 'fs';
import path from 'path';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { config } from '../config/index.js';
import { generateConfigFromIgnore, isLegacyIgnoreFormat } from '../config/legacy-ignore-parser.js';
import { ObsidianClient } from '../obsidian/client.js';

export interface SetupNotesArgs {
  /**
   * Project root directory (defaults to current working directory)
   */
  project_root?: string;

  /**
   * Force overwrite existing config
   */
  force?: boolean;

  /**
   * Create example folder structure in vault
   */
  create_structure?: boolean;

  /**
   * Project folder name in vault (for creating structure)
   */
  project_folder?: string;
}

/**
 * Default .withcontextconfig.jsonc template
 */
const DEFAULT_CONFIG_TEMPLATE = `{
  "$schema": "https://raw.githubusercontent.com/yourusername/with-context-mcp/main/src/config/config-schema.json",

  // Configuration format version
  "version": "2.1",

  // Default behavior for files not matching any patterns
  // "local" = keep in project (safer default)
  // "vault" = delegate to Obsidian vault
  "defaultBehavior": "local",

  // Patterns for files to delegate to Obsidian vault
  // These are documentation files you want to manage in your vault
  "vault": [
    "docs/**/*.md",
    "guides/**/*.md",
    "tutorials/**/*.md",
    "CHANGELOG.md"
  ],

  // Patterns for files to keep in local project
  // These stay in your repository and won't be synced to vault
  "local": [
    // Core repository documentation
    "/README.md",
    "/CONTRIBUTING.md",
    "/AGENTS.md",
    "/LICENSE",

    // Development documentation
    "src/**/*.md",
    "tests/**/*.md",
    "examples/**/*.md",

    // Build output and dependencies
    "dist/**",
    "node_modules/**",
    "build/**",
    "coverage/**",

    // Configuration files
    ".env*",
    "*.config.*",
    "package.json",
    "tsconfig.json",

    // Version control and IDE
    ".git/**",
    ".github/**",
    ".vscode/**",
    ".idea/**",

    // Work in progress
    "**/*.draft.md",
    "**/*.wip.md",
    "docs/wip/**"
  ],

  // How to handle conflicts when file matches both vault and local patterns
  // "local-wins" = prefer keeping files local (safer)
  // "vault-wins" = prefer delegating to vault
  // "most-specific-wins" = use most specific pattern match
  // "error" = throw error on conflict
  "conflictResolution": "local-wins"
}
`;

/**
 * Setup notes handler
 */
export async function setupNotes(args: SetupNotesArgs): Promise<string> {
  const projectRoot = args.project_root || process.cwd();
  const force = args.force ?? false;
  const createStructure = args.create_structure ?? true;

  try {
    const results: string[] = [];
    results.push('=== Documentation Setup ===\n');

    // 1. Check for existing config files
    const newConfigPath = path.join(projectRoot, '.withcontextconfig.jsonc');
    const oldConfigPath = path.join(projectRoot, '.withcontextignore');

    let configExists = false;
    let isOldFormat = false;

    try {
      await fs.access(newConfigPath);
      configExists = true;
      results.push(`✓ Found existing config: ${newConfigPath}`);
    } catch {
      // New config doesn't exist
    }

    if (!configExists) {
      try {
        await fs.access(oldConfigPath);
        isOldFormat = true;
        results.push(`✓ Found legacy config: ${oldConfigPath}`);
      } catch {
        // No config exists
        results.push('✓ No existing configuration found');
      }
    }

    // 2. Handle config creation/migration
    if (configExists && !force) {
      results.push(`\n⚠ Configuration already exists. Use force=true to overwrite.`);
    } else if (isOldFormat) {
      // Migrate from old format
      results.push('\n📦 Migrating from legacy .withcontextignore format...');

      const oldContent = await fs.readFile(oldConfigPath, 'utf-8');

      if (isLegacyIgnoreFormat(oldContent)) {
        const newContent = generateConfigFromIgnore(oldContent);
        await fs.writeFile(newConfigPath, newContent, 'utf-8');

        // Create backup
        const backupPath = path.join(projectRoot, '.withcontextignore.backup');
        await fs.copyFile(oldConfigPath, backupPath);

        results.push(`✓ Created new config: ${newConfigPath}`);
        results.push(`✓ Backed up old config: ${backupPath}`);
        results.push(`\n💡 Review the new config and delete the old .withcontextignore when ready`);
      } else {
        results.push(`⚠ Old config doesn't look like legacy format, skipping migration`);
      }
    } else {
      // Create new config
      results.push('\n📝 Creating new configuration file...');
      await fs.writeFile(newConfigPath, DEFAULT_CONFIG_TEMPLATE, 'utf-8');
      results.push(`✓ Created: ${newConfigPath}`);
    }

    // 3. Create vault folder structure (if requested and project_folder provided)
    if (createStructure && args.project_folder) {
      results.push('\n📁 Setting up vault folder structure...');

      const obsidianClient = new ObsidianClient({
        apiKey: config.obsidianApiKey,
        apiUrl: config.obsidianApiUrl,
        vault: config.obsidianVault,
      });

      const projectFolder = args.project_folder;
      const basePath = path.join(config.projectBasePath, projectFolder);

      // Define folder structure based on best practices
      const folders = [
        { path: 'docs/api', description: 'API documentation and references' },
        { path: 'docs/guides', description: 'User guides and how-tos' },
        { path: 'docs/tutorials', description: 'Step-by-step tutorials' },
        { path: 'docs/architecture', description: 'Architecture decisions and diagrams' },
        { path: 'development', description: 'Development notes and progress logs' },
        { path: 'research', description: 'Research notes and investigations' },
        { path: 'meetings', description: 'Meeting notes and discussions' },
      ];

      // Create README files in each folder
      const readmeTemplates: Record<string, string> = {
        'docs/api': `# API Documentation

This folder contains API documentation and references.

## Contents

- Endpoint documentation
- Request/response schemas
- Authentication guides
- Error codes and handling
`,
        'docs/guides': `# User Guides

This folder contains user guides and how-to documentation.

## Contents

- Getting started guides
- Feature tutorials
- Best practices
- Troubleshooting
`,
        'docs/tutorials': `# Tutorials

This folder contains step-by-step tutorials.

## Contents

- Beginner tutorials
- Advanced tutorials
- Integration guides
- Example projects
`,
        'docs/architecture': `# Architecture Documentation

This folder contains architecture decisions and technical design docs.

## Contents

- Architecture Decision Records (ADRs)
- System design documents
- Data models
- Infrastructure diagrams
`,
        development: `# Development Notes

This folder contains development notes and progress logs.

## Contents

- Sprint notes
- Progress logs
- Technical spikes
- Implementation notes
`,
        research: `# Research Notes

This folder contains research notes and investigations.

## Contents

- Technology research
- Competitive analysis
- Performance benchmarks
- Proof of concepts
`,
        meetings: `# Meeting Notes

This folder contains meeting notes and discussions.

## Contents

- Team meetings
- Design reviews
- Planning sessions
- Retrospectives
`,
      };

      let structureCreated = false;

      for (const folder of folders) {
        const folderPath = path.join(basePath, folder.path);
        const readmePath = path.join(folderPath, 'README.md');

        try {
          // Try to create README (will fail if already exists)
          const template =
            readmeTemplates[folder.path] || `# ${folder.path}\n\n${folder.description}\n`;

          await obsidianClient.writeNote(readmePath, template, 'create');

          results.push(`  ✓ Created: ${folder.path}/README.md`);
          structureCreated = true;
        } catch {
          // Folder likely already exists, skip
          results.push(`  ⊝ Skipped: ${folder.path}/ (already exists)`);
        }
      }

      if (structureCreated) {
        results.push(`\n✓ Vault folder structure created at: ${basePath}`);
      } else {
        results.push(`\n⊝ Folder structure already exists at: ${basePath}`);
      }
    } else if (createStructure && !args.project_folder) {
      results.push(
        `\n💡 Tip: Provide project_folder to create vault folder structure automatically`
      );
    }

    // 4. Summary
    results.push('\n=== Setup Complete ===');
    results.push('\nNext steps:');
    results.push('1. Review and customize .withcontextconfig.jsonc');
    results.push('2. Add patterns for files you want to delegate to vault');
    results.push('3. Use preview-delegation to test your patterns');
    results.push('4. Run sync-notes to synchronize documentation');

    return results.join('\n');
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to setup notes: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const setupNotesSchema = {
  name: 'setup_notes',
  description:
    'Setup documentation delegation configuration and vault folder structure. Creates .withcontextconfig.jsonc and optional folder structure in vault.',
  inputSchema: {
    type: 'object',
    properties: {
      project_root: {
        type: 'string',
        description: 'Project root directory (defaults to current working directory)',
      },
      force: {
        type: 'boolean',
        description: 'Force overwrite existing configuration',
        default: false,
      },
      create_structure: {
        type: 'boolean',
        description: 'Create example folder structure in vault',
        default: true,
      },
      project_folder: {
        type: 'string',
        description: 'Project folder name in vault (required for creating structure)',
      },
    },
  },
};
