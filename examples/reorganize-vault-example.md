# reorganize_vault Tool - Usage Examples

The `reorganize_vault` tool executes vault reorganization based on an OrganizationPlan. It applies move and rename operations to improve vault organization with comprehensive safety features.

## Safety Features

- **Default Dry Run**: `dry_run=true` by default to prevent accidental changes
- **Confidence Threshold**: Skips operations below `min_confidence` (default: 0.7)
- **Automatic Backups**: Creates backups before executing operations (if `create_backup=true`)
- **Automatic Rollback**: Rolls back completed operations on failure
- **Link Updating**: Automatically updates links in other files to prevent broken references

## Basic Usage

### 1. Dry Run (Preview Mode - Recommended First Step)

```typescript
// First, analyze vault structure to get a plan
const analysisResult = await analyzeVaultStructure({
  project_folder: 'my-project',
  include_orphans: true,
});

// Then preview reorganization (dry run)
const dryRunResult = await reorganizeVault({
  project_folder: 'my-project',
  plan: {
    suggestions: [
      {
        type: 'move',
        currentPath: 'loose-note.md',
        suggestedPath: 'docs/loose-note.md',
        reason: 'File appears to be documentation, should be in docs folder',
        confidence: 0.85,
        impact: {
          affectedFiles: 2,
          linksToUpdate: 3,
          potentialBrokenLinks: [],
          complexity: 'low',
        },
      },
      {
        type: 'rename',
        currentPath: 'temp123.md',
        suggestedName: 'api-integration-notes',
        reason: 'Filename is unclear, content suggests API integration notes',
        confidence: 0.9,
        impact: {
          affectedFiles: 1,
          linksToUpdate: 2,
          potentialBrokenLinks: [],
          complexity: 'low',
        },
      },
    ],
  },
  dry_run: true, // Safe preview mode
});

console.log(dryRunResult);
// {
//   "success": true,
//   "mode": "dry-run",
//   "operations": [
//     {
//       "type": "move",
//       "source": "loose-note.md",
//       "target": "docs/loose-note.md",
//       "status": "pending"
//     },
//     {
//       "type": "rename",
//       "source": "temp123.md",
//       "target": "api-integration-notes.md",
//       "status": "pending"
//     }
//   ],
//   "summary": {
//     "total_operations": 2,
//     "completed": 0,
//     "failed": 0,
//     "pending": 2,
//     "links_updated": 0
//   },
//   "warnings": [
//     "DRY RUN: No changes were made to your vault.",
//     "To execute these operations, set dry_run=false.",
//     "Operations will affect 2 files and update 5 links.",
//     "Review the operations list carefully before executing."
//   ]
// }
```

### 2. Execute Reorganization (After Reviewing Dry Run)

```typescript
// Execute the reorganization after reviewing dry run
const executionResult = await reorganizeVault({
  project_folder: 'my-project',
  plan: {
    suggestions: [
      {
        type: 'move',
        currentPath: 'loose-note.md',
        suggestedPath: 'docs/loose-note.md',
        reason: 'File appears to be documentation',
        confidence: 0.85,
      },
      {
        type: 'rename',
        currentPath: 'temp123.md',
        suggestedName: 'api-integration-notes',
        reason: 'Filename is unclear',
        confidence: 0.9,
      },
    ],
  },
  dry_run: false, // Execute operations
  update_links: true, // Update links in other files
  create_backup: true, // Create backups
  min_confidence: 0.7, // Minimum confidence threshold
});

console.log(executionResult);
// {
//   "success": true,
//   "mode": "executed",
//   "operations": [
//     {
//       "type": "move",
//       "source": "loose-note.md",
//       "target": "docs/loose-note.md",
//       "status": "completed",
//       "error": null
//     },
//     {
//       "type": "rename",
//       "source": "temp123.md",
//       "target": "api-integration-notes.md",
//       "status": "completed",
//       "error": null
//     }
//   ],
//   "summary": {
//     "total_operations": 2,
//     "completed": 2,
//     "failed": 0,
//     "pending": 0,
//     "links_updated": 5
//   },
//   "warnings": [
//     "Reorganization has been EXECUTED. Changes are live in your vault.",
//     "If any operations failed, review the failed_operations section.",
//     "Backups were created before operations (if create_backup was enabled)."
//   ]
// }
```

## Advanced Usage

### 3. Complex Reorganization Plan

```typescript
const complexPlan = {
  suggestions: [
    {
      type: 'both', // Move and rename
      currentPath: 'old-folder/unclear-name.md',
      suggestedPath: 'docs/architecture',
      suggestedName: 'system-architecture',
      reason: 'File contains architecture documentation, should be in docs/architecture',
      confidence: 0.95,
      impact: {
        affectedFiles: 5,
        linksToUpdate: 12,
        potentialBrokenLinks: ['obsolete-file.md'],
        complexity: 'medium',
      },
      targetCategory: 'documentation',
    },
    {
      type: 'move',
      currentPath: 'random-notes/meeting-2024-01.md',
      suggestedPath: 'meetings/2024/meeting-2024-01.md',
      reason: 'Meeting notes should be organized by year',
      confidence: 0.88,
      impact: {
        affectedFiles: 2,
        linksToUpdate: 4,
        potentialBrokenLinks: [],
        complexity: 'low',
      },
      targetCategory: 'meetings',
    },
  ],
  estimatedImpact: {
    filesToMove: 2,
    filesToRename: 1,
    linksToUpdate: 16,
    filesRequiringLinkUpdates: 7,
    estimatedDuration: 5000, // milliseconds
    hasRiskyOperations: false,
  },
  warnings: [
    {
      severity: 'warning',
      filePath: 'obsolete-file.md',
      message: 'This file links to system-architecture.md but may be obsolete',
      suggestion: 'Review and update or delete obsolete-file.md',
    },
  ],
  summary: 'Reorganize 2 files to improve documentation structure',
  requiresManualReview: false,
};

const result = await reorganizeVault({
  project_folder: 'my-project',
  plan: complexPlan,
  dry_run: false,
  update_links: true,
  create_backup: true,
  min_confidence: 0.8, // Higher confidence threshold
});
```

### 4. Handling Failures and Rollback

```typescript
const result = await reorganizeVault({
  project_folder: 'my-project',
  plan: {
    suggestions: [
      {
        type: 'move',
        currentPath: 'docs/guide.md',
        suggestedPath: 'tutorials/getting-started.md',
        reason: 'Better organization',
        confidence: 0.75,
      },
    ],
  },
  dry_run: false,
});

if (!result.success) {
  console.log('Some operations failed:');
  result.failed_operations.forEach((failed) => {
    console.log(`- ${failed.operation.source}: ${failed.error}`);
    console.log(`  Rollback successful: ${failed.rollback_successful}`);
  });
}

// Example failed operation output:
// {
//   "failed_operations": [
//     {
//       "operation": {
//         "type": "move",
//         "source": "docs/guide.md",
//         "target": "tutorials/getting-started.md"
//       },
//       "error": "File not found: docs/guide.md",
//       "rollback_successful": true
//     }
//   ]
// }
```

### 5. Confidence Filtering

```typescript
// Only execute high-confidence operations
const result = await reorganizeVault({
  project_folder: 'my-project',
  plan: {
    suggestions: [
      {
        type: 'move',
        currentPath: 'a.md',
        suggestedPath: 'docs/a.md',
        reason: 'Clear documentation',
        confidence: 0.95,
      },
      {
        type: 'move',
        currentPath: 'b.md',
        suggestedPath: 'notes/b.md',
        reason: 'Unclear category',
        confidence: 0.65,
      },
      {
        type: 'rename',
        currentPath: 'c.md',
        suggestedName: 'config',
        reason: 'Better name',
        confidence: 0.85,
      },
    ],
  },
  dry_run: false,
  min_confidence: 0.8, // Skip operations below 0.8
});

// Result will show:
// - Operation on a.md: EXECUTED (0.95 confidence)
// - Operation on b.md: SKIPPED (0.65 < 0.8)
// - Operation on c.md: EXECUTED (0.85 confidence)
//
// Warnings will include:
// "Note: 1 operations were skipped due to confidence below 0.8."
```

## Response Format

### Dry Run Response

```json
{
  "success": true,
  "mode": "dry-run",
  "project_folder": "my-project",
  "operations": [
    {
      "type": "move",
      "source": "file.md",
      "target": "docs/file.md",
      "status": "pending",
      "error": null
    }
  ],
  "summary": {
    "total_operations": 1,
    "completed": 0,
    "failed": 0,
    "pending": 1,
    "links_updated": 0
  },
  "failed_operations": [],
  "files_modified": [],
  "rollback_available": false,
  "warnings": [
    "DRY RUN: No changes were made to your vault.",
    "To execute these operations, set dry_run=false.",
    "Operations will affect 1 files and update 3 links.",
    "Review the operations list carefully before executing."
  ],
  "execution_details": {
    "started_at": "2024-01-15T10:30:00.000Z",
    "completed_at": "2024-01-15T10:30:00.100Z",
    "result_summary": "DRY RUN: Would perform 1 operations affecting 3 links"
  }
}
```

### Execution Response (Success)

```json
{
  "success": true,
  "mode": "executed",
  "project_folder": "my-project",
  "operations": [
    {
      "type": "move",
      "source": "file.md",
      "target": "docs/file.md",
      "status": "completed",
      "error": null
    }
  ],
  "summary": {
    "total_operations": 1,
    "completed": 1,
    "failed": 0,
    "pending": 0,
    "links_updated": 3
  },
  "failed_operations": [],
  "files_modified": ["docs/file.md"],
  "rollback_available": true,
  "warnings": [
    "Reorganization has been EXECUTED. Changes are live in your vault.",
    "If any operations failed, review the failed_operations section.",
    "Backups were created before operations (if create_backup was enabled)."
  ],
  "execution_details": {
    "started_at": "2024-01-15T10:35:00.000Z",
    "completed_at": "2024-01-15T10:35:02.500Z",
    "result_summary": "Successfully completed 1 operations and updated 3 links."
  }
}
```

### Execution Response (Partial Failure)

```json
{
  "success": false,
  "mode": "executed",
  "operations": [
    {
      "type": "move",
      "source": "good-file.md",
      "target": "docs/good-file.md",
      "status": "completed",
      "error": null
    },
    {
      "type": "move",
      "source": "missing-file.md",
      "target": "docs/missing-file.md",
      "status": "failed",
      "error": "File not found: missing-file.md"
    }
  ],
  "summary": {
    "total_operations": 2,
    "completed": 1,
    "failed": 1,
    "pending": 0,
    "links_updated": 2
  },
  "failed_operations": [
    {
      "operation": {
        "type": "move",
        "source": "missing-file.md",
        "target": "docs/missing-file.md"
      },
      "error": "File not found: missing-file.md",
      "rollback_successful": true
    }
  ],
  "files_modified": ["docs/good-file.md"],
  "rollback_available": true,
  "warnings": [
    "Reorganization has been EXECUTED. Changes are live in your vault.",
    "If any operations failed, review the failed_operations section.",
    "Backups were created before operations (if create_backup was enabled).",
    "Some operations failed. Automatic rollback was attempted.",
    "Review the rollback_successful field in failed_operations to see if rollback succeeded."
  ]
}
```

## Best Practices

1. **Always Start with Dry Run**: Review operations before executing
2. **Use Confidence Thresholds**: Set appropriate `min_confidence` for your use case
3. **Enable Backups**: Keep `create_backup=true` for safety
4. **Enable Link Updates**: Set `update_links=true` to prevent broken links
5. **Review Warnings**: Check the warnings array for important information
6. **Check Failed Operations**: If `success=false`, review `failed_operations` array
7. **Verify Rollback**: Check `rollback_successful` for failed operations

## Error Handling

```typescript
try {
  const result = await reorganizeVault({
    project_folder: 'my-project',
    plan: myPlan,
    dry_run: false,
  });

  if (!result.success) {
    console.error('Reorganization completed with errors');
    result.failed_operations.forEach((failed) => {
      console.error(`Failed: ${failed.operation.source}`);
      console.error(`Error: ${failed.error}`);
      console.error(`Rollback: ${failed.rollback_successful ? 'SUCCESS' : 'FAILED'}`);
    });
  } else {
    console.log('Reorganization completed successfully');
    console.log(`Modified ${result.files_modified.length} files`);
    console.log(`Updated ${result.summary.links_updated} links`);
  }
} catch (error) {
  console.error('Reorganization failed:', error);
}
```

## Integration with analyze_vault_structure

The `reorganize_vault` tool is designed to work with plans generated by `analyze_vault_structure`:

```typescript
// Step 1: Analyze vault
const analysis = await analyzeVaultStructure({
  project_folder: 'my-project',
  include_orphans: true,
});

// Step 2: Generate reorganization plan (manual or AI-assisted)
const plan = generateReorganizationPlan(analysis); // Your logic

// Step 3: Preview with dry run
const preview = await reorganizeVault({
  project_folder: 'my-project',
  plan,
  dry_run: true,
});

// Step 4: Review and execute
if (preview.success) {
  const result = await reorganizeVault({
    project_folder: 'my-project',
    plan,
    dry_run: false,
  });
}
```
