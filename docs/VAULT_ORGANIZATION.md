# Vault Organization Feature

Intelligent vault organization system with automated content analysis, categorization, and file reorganization capabilities. This feature helps maintain clean, well-structured vaults with meaningful relationships between files and automated link updating.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [API Reference](#api-reference)
  - [analyze_vault_structure](#analyze_vault_structure)
  - [reorganize_vault](#reorganize_vault)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Safety Guidelines](#safety-guidelines)
- [Troubleshooting](#troubleshooting)

## Overview

The Vault Organization feature provides two main MCP tools:

1. **`analyze_vault_structure`** - Analyzes vault content and structure to understand organization
2. **`reorganize_vault`** - Executes reorganization plans with automatic link updating and rollback

### Key Features

- **Intelligent Content Analysis**: Extracts headings, frontmatter, links, tags, keywords, and topics
- **Automatic Categorization**: Groups files by type (documentation, meeting-notes, project-plans, etc.)
- **Folder Statistics**: Tracks file counts, sizes, and hierarchies
- **Orphan Detection**: Finds files with no incoming or outgoing links
- **Safe Reorganization**: Dry-run mode, rollback capability, and link updating
- **Link Management**: Automatically updates wiki-links and markdown links when files move
- **Impact Assessment**: Estimates affected files, broken links, and operation complexity

### Use Cases

- Clean up disorganized vaults with scattered files
- Reorganize project documentation for better discoverability
- Consolidate related files into meaningful categories
- Fix broken links after manual reorganization
- Analyze vault structure and health
- Prepare vaults for sharing or archiving

## Architecture

### Text-Based Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         MCP Tools Layer                         │
├─────────────────────────────────┬───────────────────────────────┤
│  analyze_vault_structure        │  reorganize_vault             │
│  - Validates input              │  - Validates plan             │
│  - Calls analyzer               │  - Calls reorganizer          │
│  - Formats results              │  - Handles errors             │
└─────────────────────────────────┴───────────────────────────────┘
                    │                           │
                    ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Core Business Logic                         │
├─────────────────────────────────┬───────────────────────────────┤
│  vault-analyzer.ts              │  vault-reorganizer.ts         │
│  ┌───────────────────────────┐ │  ┌───────────────────────────┐│
│  │ analyzeVaultStructure()   │ │  │ executeReorganization()   ││
│  │ - Scans project files     │ │  │ - Processes plan          ││
│  │ - Extracts metadata       │ │  │ - Executes operations     ││
│  │ - Builds statistics       │ │  │ - Updates links           ││
│  │ - Detects orphans         │ │  │ - Handles rollback        ││
│  └───────────────────────────┘ │  └───────────────────────────┘│
│  ┌───────────────────────────┐ │  ┌───────────────────────────┐│
│  │ analyzeFileContent()      │ │  │ executeOperation()        ││
│  │ - Parses markdown         │ │  │ - Move/rename/delete      ││
│  │ - Extracts headings       │ │  │ - Stores rollback info    ││
│  │ - Parses frontmatter      │ │  │ - Validates paths         ││
│  │ - Finds links             │ │  └───────────────────────────┘│
│  └───────────────────────────┘ │  ┌───────────────────────────┐│
│  ┌───────────────────────────┐ │  │ updateLinks()             ││
│  │ categorizeFile()          │ │  │ - Finds affected files    ││
│  │ - Path-based heuristics   │ │  │ - Updates wiki-links      ││
│  │ - Frontmatter analysis    │ │  │ - Updates markdown links  ││
│  └───────────────────────────┘ │  └───────────────────────────┘│
│  ┌───────────────────────────┐ │  ┌───────────────────────────┐│
│  │ extractKeywords()         │ │  │ rollbackOperations()      ││
│  │ - Tokenizes content       │ │  │ - Reverses operations     ││
│  │ - Filters stop words      │ │  │ - Restores original state ││
│  │ - Frequency analysis      │ │  └───────────────────────────┘│
│  └───────────────────────────┘ │                               │
│  ┌───────────────────────────┐ │                               │
│  │ extractTopics()           │ │                               │
│  │ - Combines tags           │ │                               │
│  │ - Uses keywords           │ │                               │
│  │ - Parses headings         │ │                               │
│  └───────────────────────────┘ │                               │
└─────────────────────────────────┴───────────────────────────────┘
                    │                           │
                    ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Storage Layer                              │
│                   (ObsidianClient)                              │
│  - readNote()  - writeNote()  - deleteNote()  - listNotes()    │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

**Analysis Workflow:**

```
User Request
    │
    ▼
analyze_vault_structure (MCP Tool)
    │
    ├─→ Validate input (project_folder, options)
    │
    ▼
analyzeVaultStructure() (Core Logic)
    │
    ├─→ List files via ObsidianClient
    ├─→ Filter by exclude patterns
    ├─→ For each file:
    │   ├─→ Read content
    │   ├─→ analyzeFileContent() → ContentMetadata
    │   ├─→ extractKeywords() → keywords
    │   ├─→ extractTopics() → topics
    │   └─→ categorizeFile() → category
    │
    ├─→ Build folder statistics
    ├─→ Build category statistics
    ├─→ Detect orphan files
    │
    ▼
Return VaultStructure
```

**Reorganization Workflow:**

```
User Request + OrganizationPlan
    │
    ▼
reorganize_vault (MCP Tool)
    │
    ├─→ Validate plan structure
    │
    ▼
executeReorganization() (Core Logic)
    │
    ├─→ Dry run mode?
    │   └─→ Yes: Return preview
    │
    ├─→ For each suggestion:
    │   ├─→ Convert to operations
    │   ├─→ Read source content (for rollback)
    │   ├─→ executeOperation():
    │   │   ├─→ Move: read → write → delete
    │   │   ├─→ Rename: read → write → delete
    │   │   └─→ Delete: delete
    │   ├─→ Track moved files
    │   └─→ On error: rollback if stopOnError
    │
    ├─→ Update links? (if updateLinks = true)
    │   ├─→ findAffectedFiles()
    │   ├─→ For each affected file:
    │   │   ├─→ Read content
    │   │   ├─→ Update [[wiki-links]]
    │   │   ├─→ Update [markdown](links)
    │   │   └─→ Write updated content
    │   └─→ Count updated links
    │
    ▼
Return ReorganizationResult
```

### Module Structure

```
src/vault-organizer/
├── index.ts                # Main entry point (exports all)
├── types.ts               # TypeScript type definitions
├── vault-analyzer.ts      # Content analysis and categorization
├── vault-reorganizer.ts   # Reorganization execution
└── README.md             # Module documentation

src/tools/
├── analyze-vault-structure.ts  # MCP tool wrapper
└── reorganize-vault.ts         # MCP tool wrapper

tests/
├── unit/
│   ├── vault-analyzer.test.ts
│   └── vault-reorganizer.test.ts
└── integration/
    └── vault-organization.test.ts

examples/
├── vault-analyzer-example.ts
└── reorganize-vault-example.md
```

## API Reference

### analyze_vault_structure

Analyzes the complete structure and content of a vault for intelligent organization insights.

#### Input Schema

```typescript
{
  project_folder: string;        // Required: Project folder name
  include_content_analysis?: boolean;  // Extract content metadata (default: true)
  exclude_patterns?: string[];   // Glob patterns to exclude
  max_file_size?: number;        // Max file size in bytes (default: 10MB)
  detect_orphans?: boolean;      // Find orphan files (default: true)
  extract_keywords?: boolean;    // Extract keywords (default: true)
}
```

#### Output Schema

```typescript
{
  rootPath: string;              // Vault path analyzed
  totalFiles: number;            // Total file count
  totalSize: number;             // Total size in bytes
  analyzedAt: string;            // ISO 8601 timestamp

  files: VaultFileInfo[];        // All analyzed files
  // Each file contains:
  // - path, name, extension, size
  // - created, modified timestamps
  // - contentMetadata (headings, frontmatter, links, tags, etc.)
  // - keywords, topics

  folders: Record<string, FolderStats>;
  // Folder path → statistics:
  // - fileCount, subfolderCount, totalSize
  // - files array

  categories: Record<string, CategoryStats>;
  // Category → statistics:
  // - fileCount, totalSize, avgConfidence
  // - files array

  orphanFiles: string[];         // Files with no links
}
```

#### Categories

Files are automatically categorized into:

- **`documentation`** - README files, docs folders, guides, tutorials
- **`meeting-notes`** - Meeting folders, date-pattern filenames (YYYY-MM-DD)
- **`project-plans`** - Planning folders, roadmaps, project files
- **`reference`** - Reference folders, links, bookmarks
- **`journal`** - Journal/daily/diary folders
- **`uncategorized`** - Files that don't match any category

#### Example Usage

```typescript
// Basic analysis
const result = await analyze_vault_structure({
  project_folder: 'my-web-app',
});

// Advanced analysis with options
const result = await analyze_vault_structure({
  project_folder: 'my-web-app',
  include_content_analysis: true,
  exclude_patterns: ['*.tmp', '*.log', 'archive/**'],
  max_file_size: 5 * 1024 * 1024, // 5MB
  detect_orphans: true,
  extract_keywords: true,
});

// Access results
console.log(`Analyzed ${result.totalFiles} files`);
console.log(`Found ${result.orphanFiles.length} orphan files`);
console.log('Categories:', Object.keys(result.categories));
```

### reorganize_vault

Executes a reorganization plan with automatic link updating and rollback capability.

#### Input Schema

```typescript
{
  project_folder: string;        // Required: Project folder name

  plan: OrganizationPlan;        // Required: Reorganization plan
  // Contains:
  // - suggestions: OrganizationSuggestion[]
  // - estimatedImpact: EstimatedImpact
  // - warnings: OrganizationWarning[]
  // - summary: string
  // - requiresManualReview: boolean

  dry_run?: boolean;             // Preview without changes (default: false)
  create_backup?: boolean;       // Backup files (default: false)
  update_links?: boolean;        // Update links in other files (default: true)
  stop_on_error?: boolean;       // Stop and rollback on error (default: true)
  skip_low_confidence?: boolean; // Skip low confidence ops (default: false)
  min_confidence?: number;       // Minimum confidence (0-1, default: 0.5)
}
```

#### OrganizationPlan Structure

```typescript
{
  generatedAt: string;           // ISO 8601 timestamp

  suggestions: [
    {
      type: 'rename' | 'move' | 'both';
      currentPath: string;
      suggestedPath?: string;    // For 'move' or 'both'
      suggestedName?: string;    // For 'rename' or 'both'
      reason: string;
      confidence: number;        // 0-1
      impact: {
        affectedFiles: number;
        linksToUpdate: number;
        potentialBrokenLinks: string[];
        complexity: 'low' | 'medium' | 'high';
      };
      targetCategory?: string;
    }
  ],

  estimatedImpact: {
    filesToMove: number;
    filesToRename: number;
    linksToUpdate: number;
    filesRequiringLinkUpdates: number;
    estimatedDuration: number;   // Milliseconds
    hasRiskyOperations: boolean;
  },

  warnings: [
    {
      severity: 'info' | 'warning' | 'error';
      filePath?: string;
      message: string;
      suggestion?: string;
    }
  ],

  summary: string;
  requiresManualReview: boolean;
}
```

#### Output Schema

```typescript
{
  success: boolean;              // Overall success status
  startedAt: string;             // ISO 8601 timestamp
  completedAt: string;           // ISO 8601 timestamp

  operations: ReorganizationOperation[];
  // Each completed operation:
  // - id, type, sourcePath, targetPath
  // - status: 'completed' | 'failed' | 'pending'
  // - rollbackInfo

  failedOperations: FailedOperation[];
  // Each failed operation:
  // - operation, error, errorCode
  // - rollbackSuccessful: boolean

  linksUpdated: number;          // Total links updated
  filesModified: string[];       // Files that were changed
  rollbackAvailable: boolean;    // Can operations be rolled back?
  rollbackStatePath?: string;    // Path to rollback state file
  summary: string;               // Human-readable summary
}
```

#### Example Usage

```typescript
// Preview reorganization (dry run)
const preview = await reorganize_vault({
  project_folder: 'my-web-app',
  plan: organizationPlan,
  dry_run: true,
});

console.log('Preview:', preview.summary);
console.log('Would affect:', preview.operations.length, 'files');

// Execute reorganization with link updates
const result = await reorganize_vault({
  project_folder: 'my-web-app',
  plan: organizationPlan,
  update_links: true,
  stop_on_error: true,
  create_backup: true,
  min_confidence: 0.7,
});

if (result.success) {
  console.log('Success!', result.summary);
  console.log('Updated', result.linksUpdated, 'links');
} else {
  console.error('Failed:', result.failedOperations);
}
```

## Usage Examples

### Complete Workflow: Analyze → Reorganize

This example demonstrates the full workflow from analysis to reorganization.

```typescript
// Step 1: Analyze vault structure
const analysis = await analyze_vault_structure({
  project_folder: 'my-web-app',
  include_content_analysis: true,
  detect_orphans: true,
  extract_keywords: true,
});

console.log('Analysis Results:');
console.log('- Total Files:', analysis.totalFiles);
console.log('- Total Size:', (analysis.totalSize / 1024 / 1024).toFixed(2), 'MB');
console.log('- Orphan Files:', analysis.orphanFiles.length);
console.log('- Categories:', Object.keys(analysis.categories));

// Step 2: Review analysis and create organization plan
// Based on analysis results, identify issues:
// - Files in wrong categories
// - Orphan files that should be linked
// - Poor file naming
// - Scattered files that should be grouped

const organizationPlan: OrganizationPlan = {
  generatedAt: new Date().toISOString(),

  suggestions: [
    {
      type: 'move',
      currentPath: 'projects/my-web-app/random-notes.md',
      suggestedPath: 'projects/my-web-app/docs/notes.md',
      reason: 'Move scattered notes to docs folder for better organization',
      confidence: 0.9,
      impact: {
        affectedFiles: 2,
        linksToUpdate: 3,
        potentialBrokenLinks: [],
        complexity: 'low',
      },
      targetCategory: 'documentation',
    },
    {
      type: 'rename',
      currentPath: 'projects/my-web-app/temp.md',
      suggestedName: 'api-design-draft',
      reason: 'Rename unclear filename to descriptive name',
      confidence: 0.8,
      impact: {
        affectedFiles: 1,
        linksToUpdate: 1,
        potentialBrokenLinks: [],
        complexity: 'low',
      },
    },
    {
      type: 'both',
      currentPath: 'projects/my-web-app/old/2024-notes.md',
      suggestedPath: 'projects/my-web-app/meeting-notes',
      suggestedName: '2024-01-15-team-sync',
      reason: 'Move to meeting-notes folder and add descriptive name with date',
      confidence: 0.85,
      impact: {
        affectedFiles: 0,
        linksToUpdate: 0,
        potentialBrokenLinks: [],
        complexity: 'low',
      },
      targetCategory: 'meeting-notes',
    },
  ],

  estimatedImpact: {
    filesToMove: 2,
    filesToRename: 2,
    linksToUpdate: 4,
    filesRequiringLinkUpdates: 3,
    estimatedDuration: 5000,
    hasRiskyOperations: false,
  },

  warnings: [],

  summary: 'Reorganize 3 files to improve vault structure and naming',
  requiresManualReview: false,
};

// Step 3: Preview reorganization (dry run)
const preview = await reorganize_vault({
  project_folder: 'my-web-app',
  plan: organizationPlan,
  dry_run: true,
});

console.log('\nDry Run Preview:');
console.log(preview.summary);
console.log('Operations:', preview.operations.length);

// Step 4: Execute reorganization
const result = await reorganize_vault({
  project_folder: 'my-web-app',
  plan: organizationPlan,
  update_links: true,
  stop_on_error: true,
  create_backup: true,
  min_confidence: 0.7,
});

console.log('\nReorganization Result:');
if (result.success) {
  console.log('✓ Success!', result.summary);
  console.log('  - Operations completed:', result.operations.length);
  console.log('  - Links updated:', result.linksUpdated);
  console.log('  - Files modified:', result.filesModified.length);
} else {
  console.error('✗ Failed!');
  console.error('  - Failed operations:', result.failedOperations.length);
  result.failedOperations.forEach((op) => {
    console.error(`    - ${op.operation.sourcePath}: ${op.error}`);
  });
  if (result.rollbackAvailable) {
    console.log('  - Rollback is available');
  }
}
```

### Analyzing Specific Categories

```typescript
// Analyze and filter by category
const analysis = await analyze_vault_structure({
  project_folder: 'my-project',
});

// Get all documentation files
const docFiles = analysis.categories['documentation']?.files || [];
console.log('Documentation files:', docFiles.length);

// Get all orphan files
const orphans = analysis.orphanFiles;
console.log('Orphan files:', orphans);

// Find large files
const largeFiles = analysis.files
  .filter((f) => f.size > 1024 * 1024) // > 1MB
  .map((f) => ({ path: f.path, size: (f.size / 1024 / 1024).toFixed(2) + ' MB' }));
console.log('Large files:', largeFiles);
```

### Safe Reorganization with Error Handling

```typescript
try {
  // Execute with strict error handling
  const result = await reorganize_vault({
    project_folder: 'my-project',
    plan: organizationPlan,
    stop_on_error: true, // Stop and rollback on first error
    update_links: true, // Update all links
    create_backup: true, // Create backups
    min_confidence: 0.8, // Only execute high-confidence ops
  });

  if (!result.success) {
    console.error('Reorganization failed');

    // Check for failed operations
    if (result.failedOperations.length > 0) {
      console.error('Failed operations:');
      result.failedOperations.forEach((op) => {
        console.error(`- ${op.operation.type} ${op.operation.sourcePath}`);
        console.error(`  Error: ${op.error}`);
        console.error(`  Rollback successful: ${op.rollbackSuccessful}`);
      });
    }

    // Check rollback availability
    if (result.rollbackAvailable && result.rollbackStatePath) {
      console.log('Rollback state saved to:', result.rollbackStatePath);
    }
  }
} catch (error) {
  if (error.name === 'VaultReorganizationError') {
    console.error('Reorganization error:', error.message);
    console.error('Operation:', error.operation);
    console.error('Rollback available:', error.rollbackAvailable);
  } else if (error.name === 'RollbackError') {
    console.error('Critical: Rollback failed!');
    console.error('Failed operations:', error.failedOperations);
    console.error('Vault may be in inconsistent state');
  } else {
    throw error;
  }
}
```

## Best Practices

### Analysis Best Practices

1. **Use exclude patterns** to skip temporary and system files:

   ```typescript
   exclude_patterns: ['*.tmp', '*.log', '.DS_Store', 'node_modules/**'];
   ```

2. **Set reasonable file size limits** for large vaults:

   ```typescript
   max_file_size: 5 * 1024 * 1024; // 5MB
   ```

3. **Disable content analysis** for quick scans:

   ```typescript
   include_content_analysis: false; // Much faster
   ```

4. **Review orphan files** for potential issues:

   ```typescript
   const orphans = analysis.orphanFiles;
   // These files have no links and may be lost/forgotten
   ```

5. **Check category distribution** for imbalanced organization:
   ```typescript
   const uncategorized = analysis.categories['uncategorized']?.fileCount || 0;
   if (uncategorized > analysis.totalFiles * 0.3) {
     console.warn('High percentage of uncategorized files');
   }
   ```

### Reorganization Best Practices

1. **Always run dry-run first** before executing:

   ```typescript
   const preview = await reorganize_vault({
     project_folder: 'my-project',
     plan: organizationPlan,
     dry_run: true, // Preview changes
   });
   ```

2. **Use confidence thresholds** to skip risky operations:

   ```typescript
   min_confidence: 0.7,
   skip_low_confidence: true
   ```

3. **Enable link updates** to maintain vault integrity:

   ```typescript
   update_links: true; // Automatically update [[links]]
   ```

4. **Stop on errors** for safer execution:

   ```typescript
   stop_on_error: true; // Rollback on failure
   ```

5. **Create backups** for important vaults:

   ```typescript
   create_backup: true; // Store in .backups folder
   ```

6. **Review plan warnings** before execution:

   ```typescript
   if (organizationPlan.warnings.length > 0) {
     console.log('Warnings:');
     organizationPlan.warnings.forEach((w) => {
       console.log(`[${w.severity}] ${w.message}`);
     });
   }
   ```

7. **Check estimated impact** before proceeding:
   ```typescript
   const impact = organizationPlan.estimatedImpact;
   if (impact.hasRiskyOperations) {
     console.warn('Plan contains risky operations!');
   }
   if (impact.linksToUpdate > 100) {
     console.warn('Will update many links - verify carefully');
   }
   ```

### Plan Creation Best Practices

1. **Start with high-confidence suggestions**
2. **Group related operations together**
3. **Avoid complex multi-step changes in one plan**
4. **Test with small batches first**
5. **Review impact assessment carefully**
6. **Add clear reasons for each suggestion**
7. **Set `requiresManualReview` for complex plans**

## Safety Guidelines

### Before Reorganization

1. **Backup your vault** using Obsidian's built-in backup or git
2. **Run analysis** to understand current state
3. **Review the plan** carefully, especially warnings
4. **Run dry-run** to preview changes
5. **Test on a small subset** first if possible
6. **Close Obsidian** during reorganization to avoid conflicts

### During Reorganization

1. **Monitor progress** if executing large plans
2. **Don't interrupt** the process mid-execution
3. **Check for errors** in the result
4. **Verify rollback availability** if errors occur

### After Reorganization

1. **Verify links** are working correctly
2. **Check file locations** match expectations
3. **Review modified files** list
4. **Test search and navigation** in Obsidian
5. **Check for broken links** using Obsidian's link checker

### Rollback Procedures

If reorganization fails or produces unexpected results:

```typescript
// 1. Check if rollback is available
if (result.rollbackAvailable) {
  console.log('Rollback state:', result.rollbackStatePath);

  // 2. If rollback failed during execution, manually restore
  result.failedOperations.forEach((op) => {
    if (!op.rollbackSuccessful) {
      console.error('Manual intervention needed for:', op.operation.sourcePath);
    }
  });
}

// 3. If you have git, revert changes
// git checkout -- .
// git clean -fd

// 4. If you have Obsidian backups, restore from backup
```

### Risk Mitigation

**Low Risk Operations:**

- Moving files within same category
- Renaming with high confidence
- Operations affecting 0-5 links

**Medium Risk Operations:**

- Moving files between categories
- Batch renames
- Operations affecting 5-20 links

**High Risk Operations:**

- Deleting files (not recommended via this tool)
- Complex multi-step changes
- Operations affecting 20+ links
- Changes to hub/index files

**Best Practice:** Always set `requiresManualReview: true` for medium/high risk operations.

## Troubleshooting

### Analysis Issues

**Problem:** Analysis is very slow

**Solutions:**

- Use `exclude_patterns` to skip unnecessary files
- Set `include_content_analysis: false` for quick scans
- Reduce `max_file_size` to skip large files
- Disable `extract_keywords` if not needed

**Problem:** Some files are not being analyzed

**Solutions:**

- Check `exclude_patterns` - may be too broad
- Verify `max_file_size` isn't excluding important files
- Check file permissions
- Ensure files are markdown (.md extension)

**Problem:** Categories are incorrect

**Solutions:**

- Use frontmatter `type` field to explicitly set category
- Adjust file paths to match categorization heuristics
- Files in `docs/` folders → documentation
- Files with date patterns (YYYY-MM-DD) → meeting-notes
- Files in `planning/` folders → project-plans

**Problem:** Too many orphan files detected

**Solutions:**

- This is informational - orphans aren't necessarily a problem
- Review orphans manually to determine if they need links
- Some files (templates, drafts) are meant to be orphans

### Reorganization Issues

**Problem:** Operation failed with "Path traversal detected"

**Solutions:**

- Ensure all paths are relative to project folder
- Don't use `../` or absolute paths
- Paths must be within `projects/{project_folder}/`

**Problem:** Links not being updated

**Solutions:**

- Ensure `update_links: true` is set
- Check that links use standard wiki `[[link]]` or markdown `[text](link.md)` format
- Custom link formats are not supported
- Links in code blocks are not updated

**Problem:** "File not found" during reorganization

**Solutions:**

- Ensure source files exist before execution
- Don't manually delete files during reorganization
- Check that ObsidianClient has proper permissions
- Verify API key is valid

**Problem:** Rollback failed

**Solutions:**

- **Critical situation** - vault may be in inconsistent state
- Restore from backup immediately
- Check `result.failedOperations` for specific errors
- Manually verify file locations
- Use git to revert if available

**Problem:** Too many warnings in plan

**Solutions:**

- Review each warning carefully
- Adjust plan to address warnings
- Set `requiresManualReview: true` if unsure
- Split complex plans into smaller batches

### Performance Issues

**Problem:** Reorganization is taking too long

**Solutions:**

- Large vaults need more time (estimate: ~100-200 files/minute)
- Link updates are expensive - consider `update_links: false` if links are already correct
- Split large plans into smaller batches
- Reduce `filesRequiringLinkUpdates` by organizing related files together

**Problem:** High memory usage during analysis

**Solutions:**

- Use `max_file_size` to skip large files
- Reduce vault size by archiving old files
- Disable `include_content_analysis` for quick scans
- Process project folders separately instead of entire vault

### Error Messages

**`VaultAnalysisError`**

- Analysis failed - check project folder exists
- Verify ObsidianClient connection
- Check file permissions

**`VaultReorganizationError`**

- Operation failed during execution
- Check error details in `result.failedOperations`
- Verify rollback availability

**`RollbackError`**

- Critical error - rollback failed
- Vault may be in inconsistent state
- Restore from backup immediately
- Check system logs for underlying cause

**`ObsidianApiError`**

- API connection issue
- Verify Obsidian is running
- Check API key and URL
- Ensure Local REST API plugin is enabled

### Getting Help

If you encounter issues not covered here:

1. **Check logs** for detailed error messages
2. **Review the plan** that caused the issue
3. **Share analysis results** (without sensitive data)
4. **Include error stack traces**
5. **Report version numbers** (with-context-mcp, Obsidian, plugins)
6. **Open an issue** on GitHub with reproduction steps

---

**Version:** 3.0.5  
**Last Updated:** 2025-11-11  
**Related Documentation:**

- [Main README](../README.md)
- [Vault Organizer Module](../src/vault-organizer/README.md)
- [Session Management](../src/session/README.md)
