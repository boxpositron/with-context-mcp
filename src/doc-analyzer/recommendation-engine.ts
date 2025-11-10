/**
 * Documentation Recommendation Engine
 * Generates recommendations for documentation organization based on best practices
 */

import type {
  RepositoryScanResult,
  ReadmeAnalysis,
  DocumentationRecommendation,
  MigrationStep,
  DocumentationFile,
} from './types.js';

/**
 * Generate documentation recommendations
 */
export function generateRecommendations(
  scan: RepositoryScanResult,
  readme: ReadmeAnalysis
): DocumentationRecommendation {
  const localFiles = determineLocalFiles(scan);
  const vaultFiles = determineVaultFiles(scan);
  const newFolders = suggestNewFolders(scan);
  const readmeChanges = suggestReadmeChanges(readme);
  const migrationPlan = createMigrationPlan(scan, localFiles, vaultFiles);
  const rationale = generateRationale(scan, readme);

  return {
    localFiles,
    vaultFiles,
    newFolders,
    readmeChanges,
    migrationPlan,
    rationale,
  };
}

/**
 * Determine which files should stay local (in repository)
 */
function determineLocalFiles(scan: RepositoryScanResult): string[] {
  const local: string[] = [];

  for (const file of scan.documentationFiles) {
    const shouldStayLocal =
      file.category === 'readme' ||
      file.category === 'contributing' ||
      file.category === 'license' ||
      file.category === 'inline-code-doc' ||
      file.category === 'test-doc' ||
      file.category === 'config' ||
      file.category === 'example' ||
      file.relativePath.includes('.draft.') ||
      file.relativePath.includes('.wip.');

    if (shouldStayLocal) {
      local.push(file.relativePath);
    }
  }

  // Add common patterns
  local.push('/README.md', '/CONTRIBUTING.md', '/LICENSE', '/AGENTS.md');
  local.push('src/**/*.md', 'tests/**/*.md', 'examples/**/*.md');
  local.push('dist/**', 'node_modules/**', 'build/**', 'coverage/**');
  local.push('.git/**', '.github/**', '.vscode/**', '.idea/**');
  local.push('**/*.draft.md', '**/*.wip.md');
  local.push('.env*', '*.config.*', 'package.json', 'tsconfig.json');

  return Array.from(new Set(local)); // Remove duplicates
}

/**
 * Determine which files should go to vault (Obsidian)
 */
function determineVaultFiles(scan: RepositoryScanResult): string[] {
  const vault: string[] = [];

  for (const file of scan.documentationFiles) {
    const shouldGoToVault =
      file.category === 'guide' ||
      file.category === 'tutorial' ||
      file.category === 'architecture' ||
      file.category === 'adr' ||
      file.category === 'research' ||
      file.category === 'meeting' ||
      file.category === 'api-reference' ||
      file.category === 'changelog';

    if (shouldGoToVault) {
      vault.push(file.relativePath);
    }
  }

  // Add recommended patterns based on Diátaxis framework
  if (scan.existingFolders.includes('docs')) {
    vault.push('docs/guides/**/*.md');
    vault.push('docs/tutorials/**/*.md');
    vault.push('docs/architecture/**/*.md');
    vault.push('docs/research/**/*.md');
    vault.push('docs/api/**/*.md');
  }

  vault.push('CHANGELOG.md');

  return Array.from(new Set(vault)); // Remove duplicates
}

/**
 * Suggest new folders to create in vault
 */
function suggestNewFolders(scan: RepositoryScanResult): string[] {
  const suggestions: string[] = [];

  // Diátaxis-inspired structure
  const hasDocs = scan.existingFolders.includes('docs');

  if (hasDocs) {
    // Suggest subfolders within docs/
    if (!scan.existingFolders.includes('docs/guides')) {
      suggestions.push('docs/guides');
    }
    if (!scan.existingFolders.includes('docs/tutorials')) {
      suggestions.push('docs/tutorials');
    }
    if (!scan.existingFolders.includes('docs/reference')) {
      suggestions.push('docs/reference');
    }
    if (!scan.existingFolders.includes('docs/architecture')) {
      suggestions.push('docs/architecture');
    }
  }

  // Project-specific suggestions
  const hasArchitectureDocs = scan.documentationFiles.some(
    (f) => f.category === 'architecture' || f.category === 'adr'
  );

  if (hasArchitectureDocs && !scan.existingFolders.includes('architecture')) {
    suggestions.push('architecture/decisions'); // For ADRs
  }

  const hasResearch = scan.documentationFiles.some((f) => f.category === 'research');
  if (hasResearch && !scan.existingFolders.includes('research')) {
    suggestions.push('research');
  }

  const hasMeetings = scan.documentationFiles.some((f) => f.category === 'meeting');
  if (hasMeetings && !scan.existingFolders.includes('meetings')) {
    suggestions.push('meetings');
  }

  return suggestions;
}

/**
 * Suggest README changes
 */
function suggestReadmeChanges(readme: ReadmeAnalysis): string[] {
  const changes: string[] = [];

  if (!readme.exists) {
    changes.push('Create README.md with project overview and quick start');
    return changes;
  }

  // Link fixes
  const brokenLinks = readme.links.filter((link) => !link.isValid);
  if (brokenLinks.length > 0) {
    changes.push(`Fix ${brokenLinks.length} broken or problematic link(s):`);
    brokenLinks.forEach((link) => {
      if (link.willMoveToVault) {
        changes.push(
          `  - Line ${link.line}: Remove or update link to "${link.url}" (will move to vault)`
        );
      } else if (!link.targetExists) {
        changes.push(`  - Line ${link.line}: Fix broken link to "${link.url}"`);
      }
    });
  }

  // Completeness suggestions
  if (!readme.hasBadges) {
    changes.push('Add badges (build status, version, license, etc.)');
  }
  if (!readme.hasQuickStart) {
    changes.push('Add a "Quick Start" or "Getting Started" section');
  }
  if (!readme.hasInstallation) {
    changes.push('Add installation instructions');
  }
  if (!readme.hasUsage) {
    changes.push('Add usage examples');
  }

  return changes;
}

/**
 * Create migration plan
 */
function createMigrationPlan(
  scan: RepositoryScanResult,
  localFiles: string[],
  vaultFiles: string[]
): MigrationStep[] {
  const steps: MigrationStep[] = [];

  // Files to keep local
  const localDocs = scan.documentationFiles.filter((file) =>
    shouldMatchPattern(file.relativePath, localFiles)
  );

  localDocs.forEach((file) => {
    steps.push({
      action: 'keep',
      file: file.relativePath,
      reason: `Essential repository file (${file.category})`,
    });
  });

  // Files to move to vault
  const vaultDocs = scan.documentationFiles.filter(
    (file) =>
      shouldMatchPattern(file.relativePath, vaultFiles) &&
      !shouldMatchPattern(file.relativePath, localFiles)
  );

  vaultDocs.forEach((file) => {
    const destination = determineVaultDestination(file);
    steps.push({
      action: 'move',
      file: file.relativePath,
      destination,
      reason: `Detailed documentation (${file.category})`,
    });
  });

  return steps;
}

/**
 * Simple pattern matching helper
 */
function shouldMatchPattern(filePath: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    // Exact match
    if (pattern === filePath || pattern === `/${filePath}`) {
      return true;
    }

    // Simple glob pattern
    const regex = pattern
      .replace(/\*\*\//g, '(.*/)?')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.')
      .replace(/\./g, '\\.');

    if (new RegExp(`^${regex}$`).test(filePath)) {
      return true;
    }
  }

  return false;
}

/**
 * Determine vault destination for a file based on its category
 */
function determineVaultDestination(file: DocumentationFile): string {
  const baseName = file.relativePath.split('/').pop() || file.relativePath;

  switch (file.category) {
    case 'guide':
      return `guides/${baseName}`;
    case 'tutorial':
      return `tutorials/${baseName}`;
    case 'architecture':
    case 'adr':
      return `architecture/decisions/${baseName}`;
    case 'research':
      return `research/${baseName}`;
    case 'meeting':
      return `meetings/${baseName}`;
    case 'api-reference':
      return `reference/${baseName}`;
    case 'changelog':
      return baseName; // Keep at root
    default:
      return `docs/${baseName}`;
  }
}

/**
 * Generate rationale for recommendations
 */
function generateRationale(scan: RepositoryScanResult, readme: ReadmeAnalysis): string {
  const parts: string[] = [];

  parts.push(`Project Type: ${scan.projectInfo.type}`);
  parts.push(`Total Documentation Files: ${scan.totalFiles}`);

  if (scan.projectInfo.framework) {
    parts.push(`Framework: ${scan.projectInfo.framework}`);
  }

  parts.push('\nRecommendations based on:');
  parts.push('- Diátaxis framework (tutorials, guides, reference, explanation)');
  parts.push('- Local = Essential (README, contributing, inline docs, quick reference)');
  parts.push('- Vault = Deep Research (detailed guides, architecture, ADRs, explorations)');
  parts.push('- README must be self-contained and work without vault access');

  if (!readme.isSelfContained) {
    parts.push('\n[!] README currently has dependencies on vault content - needs fixing');
  }

  if (readme.healthScore < 70) {
    parts.push(`\n[!] README health score: ${readme.healthScore}/100 - improvements recommended`);
  }

  return parts.join('\n');
}
