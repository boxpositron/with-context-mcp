/**
 * README Analyzer
 * Analyzes README.md for completeness, link validity, and self-containment
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { ReadmeAnalysis, MarkdownLink } from './types.js';

/**
 * Analyze README.md file
 */
export async function analyzeReadme(
  projectRoot: string,
  vaultPatterns: string[] = []
): Promise<ReadmeAnalysis> {
  const readmePath = path.join(projectRoot, 'README.md');

  try {
    await fs.access(readmePath);
  } catch {
    return {
      exists: false,
      hasBadges: false,
      hasQuickStart: false,
      hasInstallation: false,
      hasUsage: false,
      hasContributing: false,
      hasLicense: false,
      links: [],
      isSelfContained: true,
      warnings: ['README.md not found'],
      healthScore: 0,
    };
  }

  const content = await fs.readFile(readmePath, 'utf-8');
  const lines = content.split('\n');
  const lineCount = lines.length;

  const hasBadges = checkHasBadges(content);
  const hasQuickStart = checkHasQuickStart(content);
  const hasInstallation = checkHasInstallation(content);
  const hasUsage = checkHasUsage(content);
  const hasContributing = checkHasContributing(content);
  const hasLicense = checkHasLicense(content);

  const links = await extractAndValidateLinks(content, projectRoot, vaultPatterns);
  const warnings = generateWarnings(links, {
    hasBadges,
    hasQuickStart,
    hasInstallation,
    hasUsage,
  });

  const isSelfContained = checkIsSelfContained(links);
  const healthScore = calculateHealthScore({
    hasBadges,
    hasQuickStart,
    hasInstallation,
    hasUsage,
    hasContributing,
    hasLicense,
    links,
    isSelfContained,
  });

  return {
    exists: true,
    path: readmePath,
    lineCount,
    hasBadges,
    hasQuickStart,
    hasInstallation,
    hasUsage,
    hasContributing,
    hasLicense,
    links,
    isSelfContained,
    warnings,
    healthScore,
  };
}

/**
 * Check if README has badges
 */
function checkHasBadges(content: string): boolean {
  const badgePatterns = [
    /!\[.*\]\(https:\/\/img\.shields\.io/,
    /!\[.*\]\(https:\/\/badge/,
    /!\[.*\]\(https:\/\/github\.com\/.*\/workflows\//,
  ];

  return badgePatterns.some((pattern) => pattern.test(content));
}

/**
 * Check if README has quick start section
 */
function checkHasQuickStart(content: string): boolean {
  const patterns = [/##\s*quick\s*start/i, /##\s*getting\s*started/i, /##\s*quickstart/i];

  return patterns.some((pattern) => pattern.test(content));
}

/**
 * Check if README has installation section
 */
function checkHasInstallation(content: string): boolean {
  const patterns = [/##\s*install/i, /##\s*setup/i, /npm install/i, /yarn add/i];

  return patterns.some((pattern) => pattern.test(content));
}

/**
 * Check if README has usage section
 */
function checkHasUsage(content: string): boolean {
  const patterns = [/##\s*usage/i, /##\s*examples/i, /##\s*how\s*to\s*use/i];

  return patterns.some((pattern) => pattern.test(content));
}

/**
 * Check if README has contributing section
 */
function checkHasContributing(content: string): boolean {
  const patterns = [/##\s*contribut/i, /CONTRIBUTING\.md/i];

  return patterns.some((pattern) => pattern.test(content));
}

/**
 * Check if README has license section
 */
function checkHasLicense(content: string): boolean {
  const patterns = [/##\s*license/i, /LICENSE/i];

  return patterns.some((pattern) => pattern.test(content));
}

/**
 * Extract and validate markdown links
 */
async function extractAndValidateLinks(
  content: string,
  projectRoot: string,
  vaultPatterns: string[]
): Promise<MarkdownLink[]> {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links: MarkdownLink[] = [];

  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const text = match[1];
    const url = match[2];

    // Find line number
    const beforeMatch = content.substring(0, match.index);
    const line = beforeMatch.split('\n').length;

    const isInternal = !url.startsWith('http://') && !url.startsWith('https://');

    let isValid = true;
    let targetExists = undefined;
    let willMoveToVault = undefined;
    let warning = undefined;

    if (isInternal) {
      // Validate internal link
      const targetPath = url.startsWith('#') ? 'README.md' : url.split('#')[0];

      if (!targetPath.startsWith('#')) {
        const absolutePath = path.join(projectRoot, targetPath);

        try {
          await fs.access(absolutePath);
          targetExists = true;

          // Check if file will move to vault
          willMoveToVault = checkWillMoveToVault(targetPath, vaultPatterns);

          if (willMoveToVault) {
            isValid = false;
            warning = `Link target will move to vault: ${targetPath}`;
          }
        } catch {
          targetExists = false;
          isValid = false;
          warning = `Link target not found: ${targetPath}`;
        }
      }
    }

    links.push({
      text,
      url,
      line,
      isInternal,
      isValid,
      targetExists,
      willMoveToVault,
      warning,
    });
  }

  return links;
}

/**
 * Check if a file will move to vault based on patterns
 */
function checkWillMoveToVault(filePath: string, vaultPatterns: string[]): boolean {
  // Simple pattern matching - in production, use micromatch like the main code
  for (const pattern of vaultPatterns) {
    const regex = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*').replace(/\?/g, '.');

    if (new RegExp(`^${regex}$`).test(filePath)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if README is self-contained (no dependencies on vault content)
 */
function checkIsSelfContained(links: MarkdownLink[]): boolean {
  return !links.some((link) => link.willMoveToVault);
}

/**
 * Generate warnings based on analysis
 */
function generateWarnings(
  links: MarkdownLink[],
  checks: {
    hasBadges: boolean;
    hasQuickStart: boolean;
    hasInstallation: boolean;
    hasUsage: boolean;
  }
): string[] {
  const warnings: string[] = [];

  // Link warnings
  const brokenLinks = links.filter((link) => !link.isValid);
  if (brokenLinks.length > 0) {
    warnings.push(`Found ${brokenLinks.length} broken or problematic link(s)`);
    brokenLinks.forEach((link) => {
      if (link.warning) {
        warnings.push(`  Line ${link.line}: ${link.warning}`);
      }
    });
  }

  // Completeness warnings
  if (!checks.hasBadges) {
    warnings.push('No badges found (consider adding build status, version, etc.)');
  }
  if (!checks.hasQuickStart) {
    warnings.push('No quick start or getting started section found');
  }
  if (!checks.hasInstallation) {
    warnings.push('No installation instructions found');
  }
  if (!checks.hasUsage) {
    warnings.push('No usage or examples section found');
  }

  return warnings;
}

/**
 * Calculate README health score (0-100)
 */
function calculateHealthScore(analysis: {
  hasBadges: boolean;
  hasQuickStart: boolean;
  hasInstallation: boolean;
  hasUsage: boolean;
  hasContributing: boolean;
  hasLicense: boolean;
  links: MarkdownLink[];
  isSelfContained: boolean;
}): number {
  let score = 0;

  // Completeness checks (60 points)
  if (analysis.hasBadges) score += 10;
  if (analysis.hasQuickStart) score += 15;
  if (analysis.hasInstallation) score += 15;
  if (analysis.hasUsage) score += 15;
  if (analysis.hasContributing) score += 5;

  // Link validity (30 points)
  const totalLinks = analysis.links.length;
  if (totalLinks > 0) {
    const validLinks = analysis.links.filter((link) => link.isValid).length;
    score += Math.round((validLinks / totalLinks) * 30);
  } else {
    score += 30; // No links is fine
  }

  // Self-contained (10 points)
  if (analysis.isSelfContained) score += 10;

  return Math.min(score, 100);
}
