/**
 * Vault Analyzer Usage Example
 *
 * Demonstrates how to use the vault-analyzer module to scan and analyze
 * vault structure and content.
 */

import { ObsidianClient } from '../src/obsidian/client.js';
import {
  analyzeVaultStructure,
  analyzeFileContent,
  categorizeFile,
  extractKeywords,
  extractTopics,
} from '../src/vault-organizer/vault-analyzer.js';
import type { VaultFileInfo } from '../src/vault-organizer/types.js';

// Example: Analyze complete vault structure
async function exampleAnalyzeVaultStructure() {
  const client = new ObsidianClient({
    apiUrl: process.env.OBSIDIAN_API_URL || 'https://localhost:27124',
    apiKey: process.env.OBSIDIAN_API_KEY || '',
    vault: process.env.OBSIDIAN_VAULT || 'MyVault',
  });

  try {
    // Analyze vault structure with options
    const vaultStructure = await analyzeVaultStructure(client, 'my-project', {
      includeContentAnalysis: true,
      excludePatterns: ['*.tmp', '.*'],
      maxFileSize: 5 * 1024 * 1024, // 5MB
      detectOrphans: true,
      extractKeywords: true,
    });

    console.log('Vault Analysis Results:');
    console.log('======================');
    console.log(`Total Files: ${vaultStructure.totalFiles}`);
    console.log(`Total Size: ${(vaultStructure.totalSize / 1024).toFixed(2)} KB`);
    console.log(`Analyzed At: ${vaultStructure.analyzedAt}`);
    console.log();

    // Display folder statistics
    console.log('Folder Statistics:');
    for (const [folderPath, stats] of Object.entries(vaultStructure.folders)) {
      console.log(
        `  ${folderPath}: ${stats.fileCount} files, ${(stats.totalSize / 1024).toFixed(2)} KB`
      );
    }
    console.log();

    // Display category statistics
    console.log('Category Statistics:');
    for (const [category, stats] of Object.entries(vaultStructure.categories)) {
      console.log(
        `  ${category}: ${stats.fileCount} files (confidence: ${(stats.avgConfidence * 100).toFixed(0)}%)`
      );
    }
    console.log();

    // Display orphan files
    if (vaultStructure.orphanFiles.length > 0) {
      console.log('Orphan Files (no links):');
      vaultStructure.orphanFiles.forEach((file) => console.log(`  - ${file}`));
    }
  } catch (error) {
    console.error('Failed to analyze vault:', error);
  }
}

// Example: Analyze individual file content
async function exampleAnalyzeFileContent() {
  const client = new ObsidianClient({
    apiUrl: process.env.OBSIDIAN_API_URL || 'https://localhost:27124',
    apiKey: process.env.OBSIDIAN_API_KEY || '',
    vault: process.env.OBSIDIAN_VAULT || 'MyVault',
  });

  try {
    const filePath = 'projects/my-project/README.md';
    const contentMetadata = await analyzeFileContent(client, filePath);

    console.log('File Content Analysis:');
    console.log('=====================');
    console.log(`Headings: ${contentMetadata.headings.length}`);
    contentMetadata.headings.forEach((h) => console.log(`  - ${h}`));
    console.log();

    console.log(`Word Count: ${contentMetadata.wordCount}`);
    console.log();

    console.log('Frontmatter:');
    console.log(JSON.stringify(contentMetadata.frontmatter, null, 2));
    console.log();

    console.log(`Links: ${contentMetadata.links.length}`);
    contentMetadata.links.forEach((link) => console.log(`  - ${link}`));
    console.log();

    console.log(`Tags: ${contentMetadata.tags.join(', ')}`);
    console.log();

    console.log(`Code Blocks: ${contentMetadata.codeBlocks.join(', ')}`);
  } catch (error) {
    console.error('Failed to analyze file content:', error);
  }
}

// Example: Categorize files
function exampleCategorizeFile() {
  const files: VaultFileInfo[] = [
    {
      path: 'projects/my-project/README.md',
      name: 'README.md',
      extension: 'md',
      size: 2048,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      keywords: ['documentation', 'guide'],
      topics: [],
    },
    {
      path: 'projects/my-project/meetings/2024-01-15.md',
      name: '2024-01-15.md',
      extension: 'md',
      size: 1024,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      keywords: ['meeting', 'discussion'],
      topics: [],
    },
    {
      path: 'projects/my-project/roadmap.md',
      name: 'roadmap.md',
      extension: 'md',
      size: 3072,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      keywords: ['planning', 'features'],
      topics: [],
    },
  ];

  console.log('File Categorization:');
  console.log('===================');
  files.forEach((file) => {
    const category = categorizeFile(file);
    console.log(`${file.path} -> ${category}`);
  });
}

// Example: Extract keywords and topics
function exampleExtractKeywordsAndTopics() {
  const content = `
---
title: TypeScript Best Practices
tags: [typescript, programming, best-practices]
type: documentation
---

# TypeScript Best Practices

This guide covers essential TypeScript best practices for modern web development.

## Type Safety

TypeScript provides compile-time type checking for JavaScript applications.
Using strict type checking helps catch errors early in development.

## Code Organization

Organize your TypeScript code into modules for better maintainability.
Use interfaces and types to define clear contracts between components.

## Testing

Write comprehensive tests for your TypeScript code using frameworks like Jest or Vitest.
Type-safe testing improves confidence in your application logic.
`;

  const keywords = extractKeywords(content);
  console.log('Extracted Keywords:');
  console.log(keywords.join(', '));
  console.log();

  // Create mock file info for topic extraction
  const fileInfo: VaultFileInfo = {
    path: 'projects/my-project/typescript-guide.md',
    name: 'typescript-guide.md',
    extension: 'md',
    size: Buffer.byteLength(content, 'utf8'),
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    contentMetadata: {
      headings: [
        '# TypeScript Best Practices',
        '## Type Safety',
        '## Code Organization',
        '## Testing',
      ],
      frontmatter: {
        title: 'TypeScript Best Practices',
        tags: ['typescript', 'programming', 'best-practices'],
        type: 'documentation',
      },
      wordCount: 89,
      links: [],
      backlinks: [],
      codeBlocks: [],
      tags: ['typescript', 'programming', 'best-practices'],
    },
    keywords,
    topics: [],
  };

  const topics = extractTopics(fileInfo);
  console.log('Extracted Topics:');
  console.log(topics.join(', '));
}

// Run examples
console.log('Vault Analyzer Examples\n');
console.log('========================\n');

// Note: These examples require environment variables to be set
// and the Obsidian Local REST API to be running

// Uncomment to run specific examples (async functions need await):
const _runAsyncExamples = async () => {
  await exampleAnalyzeVaultStructure();
  await exampleAnalyzeFileContent();
};

// Run sync examples
exampleCategorizeFile();
console.log();
exampleExtractKeywordsAndTopics();
