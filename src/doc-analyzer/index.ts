/**
 * Documentation Analyzer
 * Main module for analyzing repository documentation and generating recommendations
 */

export { scanRepository } from './repo-scanner.js';
export { analyzeReadme } from './readme-analyzer.js';
export { generateRecommendations } from './recommendation-engine.js';
export * from './types.js';

import { scanRepository } from './repo-scanner.js';
import { analyzeReadme } from './readme-analyzer.js';
import { generateRecommendations } from './recommendation-engine.js';
import type {
  AnalysisReport,
  RepositoryScanResult,
  ReadmeAnalysis,
  DocumentationRecommendation,
} from './types.js';

/**
 * Perform complete documentation analysis
 */
export async function analyzeDocumentation(
  projectRoot: string,
  existingVaultPatterns: string[] = []
): Promise<AnalysisReport> {
  // Phase 1: Scan repository
  const repositoryScan = await scanRepository(projectRoot);

  // Phase 2: Analyze README
  const readmeAnalysis = await analyzeReadme(projectRoot, existingVaultPatterns);

  // Phase 3: Generate recommendations
  const recommendation = generateRecommendations(repositoryScan, readmeAnalysis);

  // Generate summary
  const summary = generateSummary(repositoryScan, readmeAnalysis, recommendation);

  return {
    repositoryScan,
    readmeAnalysis,
    recommendation,
    summary,
  };
}

/**
 * Generate analysis summary
 */
function generateSummary(
  scan: RepositoryScanResult,
  readme: ReadmeAnalysis,
  recommendation: DocumentationRecommendation
): string {
  const parts: string[] = [];

  parts.push('=== Documentation Analysis ===\n');
  parts.push(`Project: ${scan.projectInfo.name}`);
  parts.push(`Type: ${scan.projectInfo.type}`);
  parts.push(`Total Docs: ${scan.totalFiles} files\n`);

  if (readme.exists) {
    parts.push(`[OK] README.md (${readme.lineCount} lines)`);
    parts.push(`  Health Score: ${readme.healthScore}/100`);
    parts.push(`  Links: ${readme.links.length} total`);
    if (readme.warnings.length > 0) {
      parts.push(`  [!] ${readme.warnings.length} warning(s)`);
    }
  } else {
    parts.push('[!] README.md not found');
  }

  parts.push('\n=== Recommendations ===\n');
  parts.push(`Keep LOCAL: ${recommendation.localFiles.length} pattern(s)`);
  parts.push(`Move to VAULT: ${recommendation.vaultFiles.length} pattern(s)`);

  if (recommendation.newFolders.length > 0) {
    parts.push(`\nSuggested vault folders:`);
    recommendation.newFolders.forEach((folder: string) => {
      parts.push(`  - ${folder}`);
    });
  }

  if (recommendation.readmeChanges.length > 0) {
    parts.push(`\nREADME changes needed:`);
    recommendation.readmeChanges.forEach((change: string) => {
      parts.push(`  ${change}`);
    });
  }

  return parts.join('\n');
}
