/**
 * Setup Notes Tool
 * Intelligently analyzes repository and recommends documentation organization
 */

import { promises as fs } from 'fs';
import path from 'path';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { config } from '../config/index.js';
import { ObsidianClient } from '../obsidian/client.js';
import { analyzeDocumentation } from '../doc-analyzer/index.js';

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

  /**
   * Auto-apply recommendations without confirmation
   */
  auto_apply?: boolean;
}

/**
 * Setup notes handler with intelligent analysis
 */
export async function setupNotes(args: SetupNotesArgs): Promise<string> {
  const projectRoot = args.project_root || process.cwd();
  const force = args.force ?? false;
  const createStructure = args.create_structure ?? true;
  const _autoApply = args.auto_apply ?? false;

  try {
    const results: string[] = [];
    results.push('=== Intelligent Documentation Setup ===\n');

    // Phase 1: Check for existing config
    const configPath = path.join(projectRoot, '.withcontextconfig.jsonc');

    let configExists = false;
    let existingVaultPatterns: string[] = [];

    try {
      await fs.access(configPath);
      configExists = true;
      results.push(`✓ Found existing config: ${configPath}`);

      // Read existing vault patterns for analysis
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content.replace(/\/\/.*/g, '')); // Remove comments
      existingVaultPatterns = config.vault || [];
    } catch {
      // Config doesn't exist
      results.push('✓ No existing configuration found');
    }

    // Phase 2: Analyze repository documentation
    results.push('\n📊 Analyzing repository documentation...\n');

    const analysis = await analyzeDocumentation(projectRoot, existingVaultPatterns);

    // Display analysis results
    results.push(analysis.summary);
    results.push('\n');

    // Phase 3: Display README health
    if (analysis.readmeAnalysis.exists) {
      const readme = analysis.readmeAnalysis;
      results.push('=== README Health Report ===\n');
      results.push(`Health Score: ${readme.healthScore}/100`);

      if (readme.hasBadges) results.push('✓ Has badges');
      else results.push('⚠ Missing badges');

      if (readme.hasQuickStart) results.push('✓ Has quick start section');
      else results.push('⚠ Missing quick start section');

      if (readme.hasInstallation) results.push('✓ Has installation instructions');
      else results.push('⚠ Missing installation instructions');

      if (readme.hasUsage) results.push('✓ Has usage examples');
      else results.push('⚠ Missing usage examples');

      if (readme.isSelfContained) results.push('✓ Self-contained (no vault dependencies)');
      else results.push('⚠ Has dependencies on vault content');

      if (readme.warnings.length > 0) {
        results.push('\nWarnings:');
        readme.warnings.forEach((warning) => results.push(`  ${warning}`));
      }

      results.push('');
    }

    // Phase 4: Display recommendations
    results.push('=== Documentation Architecture Recommendations ===\n');
    results.push(analysis.recommendation.rationale);
    results.push('\n');

    // Phase 5: Handle configuration
    if (configExists && !force) {
      results.push('⚠ Configuration already exists. Recommendations shown above.');
      results.push('Use force=true to overwrite with recommended configuration.\n');
    } else {
      // Create new config with intelligent recommendations
      results.push('📝 Creating intelligent configuration...\n');

      const configContent = generateIntelligentConfig(analysis);
      await fs.writeFile(configPath, configContent, 'utf-8');

      results.push(`✓ Created: ${configPath}`);
      results.push('  Based on repository analysis and best practices\n');
    }

    // Phase 6: Create vault structure
    if (createStructure && args.project_folder) {
      results.push('📁 Setting up vault folder structure...\n');

      const obsidianClient = new ObsidianClient({
        apiKey: config.obsidianApiKey,
        apiUrl: config.obsidianApiUrl,
        vault: config.obsidianVault,
      });

      const projectFolder = args.project_folder;
      const basePath = path.join(config.projectBasePath, projectFolder);

      // Use recommended folders from analysis
      const folders = analysis.recommendation.newFolders.map((folder) => ({
        path: folder,
        description: getFolderDescription(folder),
      }));

      let structureCreated = false;

      for (const folder of folders) {
        const folderPath = path.join(basePath, folder.path);
        const readmePath = path.join(folderPath, 'README.md');

        try {
          const template = generateFolderReadme(folder.path, folder.description);
          await obsidianClient.writeNote(readmePath, template, 'create');

          results.push(`  ✓ Created: ${folder.path}/README.md`);
          structureCreated = true;
        } catch {
          results.push(`  ⊝ Skipped: ${folder.path}/ (already exists)`);
        }
      }

      if (structureCreated) {
        results.push(`\n✓ Vault folder structure created at: ${basePath}\n`);
      } else {
        results.push(`\n⊝ Folder structure already exists at: ${basePath}\n`);
      }
    }

    // Phase 7: Summary and next steps
    results.push('=== Next Steps ===\n');
    results.push('1. Review .withcontextconfig.jsonc and customize if needed');
    results.push('2. Fix README issues highlighted above');

    if (analysis.recommendation.readmeChanges.length > 0) {
      results.push('3. Apply recommended README changes:');
      analysis.recommendation.readmeChanges.forEach((change) => {
        results.push(`   ${change}`);
      });
    }

    results.push('4. Use /sync-notes or /ingest-notes to migrate files to vault');
    results.push('5. Run /validate-config to ensure configuration is valid\n');

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

/**
 * Generate intelligent configuration based on analysis
 */
function generateIntelligentConfig(analysis: any): string {
  const local = JSON.stringify(analysis.recommendation.localFiles, null, 4);
  const vault = JSON.stringify(analysis.recommendation.vaultFiles, null, 4);

  return `{
  "$schema": "https://raw.githubusercontent.com/boxpositron/with-context-mcp/main/src/config/config-schema.json",

  // Configuration generated based on repository analysis
  // Project: ${analysis.repositoryScan.projectInfo.name}
  // Type: ${analysis.repositoryScan.projectInfo.type}

  "version": "2.1",

  // Default behavior for files not matching any patterns
  "defaultBehavior": "local",

  // Patterns for files to delegate to Obsidian vault
  // Based on Diátaxis framework: guides, tutorials, reference, architecture
  "vault": ${vault.replace(/\n/g, '\n  ')},

  // Patterns for files to keep in local repository
  // Essential files for repository operation and quick reference
  "local": ${local.replace(/\n/g, '\n  ')},

  // Conflict resolution strategy
  "conflictResolution": "local-wins"
}
`;
}

/**
 * Get folder description based on path
 */
function getFolderDescription(folderPath: string): string {
  const descriptions: Record<string, string> = {
    'docs/guides': 'How-to guides and task-oriented documentation',
    'docs/tutorials': 'Step-by-step learning paths and tutorials',
    'docs/reference': 'API reference and technical details',
    'docs/architecture': 'Architecture decisions and technical design',
    'architecture/decisions': 'Architecture Decision Records (ADRs)',
    research: 'Research notes and explorations',
    meetings: 'Meeting notes and discussions',
  };

  return descriptions[folderPath] || `Documentation for ${folderPath}`;
}

/**
 * Generate README template for vault folders
 */
function generateFolderReadme(folderPath: string, description: string): string {
  const title = folderPath.split('/').pop() || folderPath;

  return `# ${title.charAt(0).toUpperCase() + title.slice(1)}

${description}

## Organization

This folder follows best practices for documentation organization.

## Contents

- Add your documentation files here
- Follow consistent naming conventions
- Use descriptive file names

---

*This folder is managed by with-context MCP*
`;
}

export const setupNotesSchema = {
  name: 'setup_notes',
  description:
    'Setup documentation delegation configuration and vault folder structure. ' +
    'Intelligently analyzes repository, validates README, and recommends documentation architecture based on best practices.',
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
        description: 'Create recommended folder structure in vault',
        default: true,
      },
      project_folder: {
        type: 'string',
        description: 'Project folder name in vault (required for creating structure)',
      },
      auto_apply: {
        type: 'boolean',
        description: 'Automatically apply recommendations without confirmation',
        default: false,
      },
    },
  },
};
