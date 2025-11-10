/**
 * Repository Scanner
 * Scans a repository to identify documentation files and project structure
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import type {
  RepositoryScanResult,
  ProjectInfo,
  DocumentationFile,
  DocumentationCategory,
  ProjectType,
} from './types.js';

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  bin?: unknown;
  main?: string;
  exports?: unknown;
}

/**
 * Scan a repository for documentation files and project information
 */
export async function scanRepository(projectRoot: string): Promise<RepositoryScanResult> {
  const projectInfo = await identifyProjectType(projectRoot);
  const documentationFiles = await findDocumentationFiles(projectRoot);
  const existingFolders = await findDocumentationFolders(projectRoot);

  const totalFiles = documentationFiles.length;
  const totalSize = documentationFiles.reduce((sum, file) => sum + file.size, 0);

  return {
    projectInfo,
    documentationFiles,
    existingFolders,
    totalFiles,
    totalSize,
  };
}

/**
 * Identify project type from package.json and structure
 */
async function identifyProjectType(projectRoot: string): Promise<ProjectInfo> {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');

  let hasPackageJson = false;
  let hasTsConfig = false;
  let packageJson: PackageJson | null = null;

  try {
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(content);
    hasPackageJson = true;
  } catch {
    // No package.json
  }

  try {
    await fs.access(tsConfigPath);
    hasTsConfig = true;
  } catch {
    // No tsconfig.json
  }

  const name = packageJson?.name || path.basename(projectRoot);
  const isMonorepo = await checkMonorepo(projectRoot);
  const type = determineProjectType(packageJson, isMonorepo, projectRoot);
  const framework = detectFramework(packageJson);

  return {
    name,
    type,
    hasPackageJson,
    hasTsConfig,
    isMonorepo,
    framework,
  };
}

/**
 * Check if project is a monorepo
 */
async function checkMonorepo(projectRoot: string): Promise<boolean> {
  // Check for common monorepo indicators
  const indicators = [
    'packages',
    'apps',
    'workspaces',
    'lerna.json',
    'pnpm-workspace.yaml',
    'turbo.json',
  ];

  for (const indicator of indicators) {
    try {
      const stat = await fs.stat(path.join(projectRoot, indicator));
      if (stat.isDirectory() || stat.isFile()) {
        return true;
      }
    } catch {
      // Not found
    }
  }

  return false;
}

/**
 * Determine project type from package.json and structure
 */
function determineProjectType(
  packageJson: PackageJson | null,
  isMonorepo: boolean,
  _projectRoot: string
): ProjectType {
  if (isMonorepo) {
    return 'monorepo';
  }

  if (!packageJson) {
    return 'unknown';
  }

  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  // Check for MCP server
  if (deps['@modelcontextprotocol/sdk'] || packageJson.name?.includes('mcp')) {
    return 'mcp-server';
  }

  // Check for CLI
  if (packageJson.bin || deps['commander'] || deps['yargs']) {
    return 'cli';
  }

  // Check for framework
  if (deps['next'] || deps['nuxt'] || deps['gatsby']) {
    return 'framework';
  }

  // Check for library vs application
  if (packageJson.main || packageJson.exports) {
    return 'library';
  }

  return 'application';
}

/**
 * Detect framework from dependencies
 */
function detectFramework(packageJson: PackageJson | null): string | undefined {
  if (!packageJson) return undefined;

  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const frameworks = [
    'next',
    'nuxt',
    'gatsby',
    'react',
    'vue',
    'svelte',
    'angular',
    'express',
    'fastify',
    'nestjs',
  ];

  for (const framework of frameworks) {
    if (deps[framework]) {
      return framework;
    }
  }

  return undefined;
}

/**
 * Find all documentation files in the repository
 */
async function findDocumentationFiles(projectRoot: string): Promise<DocumentationFile[]> {
  const patterns = ['**/*.md', '**/*.txt', '**/*.rst'];
  const ignore = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.git/**',
    '**/.next/**',
    '**/.nuxt/**',
  ];

  const files: DocumentationFile[] = [];

  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: projectRoot,
      ignore,
      absolute: false,
      nodir: true,
    });

    for (const match of matches) {
      const absolutePath = path.join(projectRoot, match);
      const stats = await fs.stat(absolutePath);
      const category = categorizeDocumentationFile(match);

      files.push({
        path: absolutePath,
        relativePath: match,
        size: stats.size,
        extension: path.extname(match),
        category,
      });
    }
  }

  return files;
}

/**
 * Categorize a documentation file based on its path and name
 */
function categorizeDocumentationFile(relativePath: string): DocumentationCategory {
  const lowerPath = relativePath.toLowerCase();
  const fileName = path.basename(lowerPath);

  // Exact matches
  if (fileName === 'readme.md') return 'readme';
  if (fileName === 'contributing.md') return 'contributing';
  if (fileName === 'license' || fileName === 'license.md') return 'license';
  if (fileName === 'changelog.md') return 'changelog';

  // Path-based categorization
  if (lowerPath.includes('src/') || lowerPath.includes('lib/')) return 'inline-code-doc';
  if (lowerPath.includes('test') || lowerPath.includes('spec')) return 'test-doc';
  if (lowerPath.includes('guide')) return 'guide';
  if (lowerPath.includes('tutorial')) return 'tutorial';
  if (lowerPath.includes('architecture') || lowerPath.includes('arch/')) return 'architecture';
  if (lowerPath.includes('adr') || lowerPath.includes('decision')) return 'adr';
  if (lowerPath.includes('research')) return 'research';
  if (lowerPath.includes('meeting')) return 'meeting';
  if (lowerPath.includes('api') || lowerPath.includes('reference')) return 'api-reference';
  if (lowerPath.includes('example')) return 'example';
  if (fileName.includes('config')) return 'config';

  return 'other';
}

/**
 * Find existing documentation folders
 */
async function findDocumentationFolders(projectRoot: string): Promise<string[]> {
  const commonFolders = [
    'docs',
    'documentation',
    'guides',
    'tutorials',
    'examples',
    'architecture',
    'research',
    'meetings',
  ];

  const existingFolders: string[] = [];

  for (const folder of commonFolders) {
    try {
      const folderPath = path.join(projectRoot, folder);
      const stat = await fs.stat(folderPath);
      if (stat.isDirectory()) {
        existingFolders.push(folder);
      }
    } catch {
      // Folder doesn't exist
    }
  }

  return existingFolders;
}
