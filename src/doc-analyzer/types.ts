/**
 * Types for documentation analysis
 */

export interface DocumentationFile {
  path: string;
  relativePath: string;
  size: number;
  extension: string;
  category: DocumentationCategory;
}

export type DocumentationCategory =
  | 'readme'
  | 'contributing'
  | 'license'
  | 'changelog'
  | 'inline-code-doc'
  | 'test-doc'
  | 'guide'
  | 'tutorial'
  | 'architecture'
  | 'adr'
  | 'research'
  | 'meeting'
  | 'api-reference'
  | 'example'
  | 'config'
  | 'other';

export interface ProjectInfo {
  name: string;
  type: ProjectType;
  hasPackageJson: boolean;
  hasTsConfig: boolean;
  isMonorepo: boolean;
  framework?: string;
}

export type ProjectType =
  | 'library'
  | 'application'
  | 'mcp-server'
  | 'monorepo'
  | 'cli'
  | 'framework'
  | 'unknown';

export interface RepositoryScanResult {
  projectInfo: ProjectInfo;
  documentationFiles: DocumentationFile[];
  existingFolders: string[];
  totalFiles: number;
  totalSize: number;
}

export interface MarkdownLink {
  text: string;
  url: string;
  line: number;
  isInternal: boolean;
  isValid: boolean;
  targetExists?: boolean;
  willMoveToVault?: boolean;
  warning?: string;
}

export interface ReadmeAnalysis {
  exists: boolean;
  path?: string;
  lineCount?: number;
  hasBadges: boolean;
  hasQuickStart: boolean;
  hasInstallation: boolean;
  hasUsage: boolean;
  hasContributing: boolean;
  hasLicense: boolean;
  links: MarkdownLink[];
  isSelfContained: boolean;
  warnings: string[];
  healthScore: number; // 0-100
}

export interface DocumentationRecommendation {
  localFiles: string[];
  vaultFiles: string[];
  newFolders: string[];
  readmeChanges: string[];
  migrationPlan: MigrationStep[];
  rationale: string;
}

export interface MigrationStep {
  action: 'move' | 'keep' | 'create' | 'update';
  file: string;
  destination?: string;
  reason: string;
}

export interface AnalysisReport {
  repositoryScan: RepositoryScanResult;
  readmeAnalysis: ReadmeAnalysis;
  recommendation: DocumentationRecommendation;
  summary: string;
}
