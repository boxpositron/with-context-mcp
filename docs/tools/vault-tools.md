# Vault Tools

Intelligent vault organization and analysis tools for maintaining clean, well-structured vaults.

## Table of Contents

- [analyze_vault_structure](#analyze_vault_structure)
- [generate_organization_plan](#generate_organization_plan)
- [reorganize_vault](#reorganize_vault)
- [Organization Presets](#organization-presets)

---

## analyze_vault_structure

Analyze vault content, structure, and relationships to understand organization.

### Parameters

| Parameter                  | Type     | Required | Default | Description                      |
| -------------------------- | -------- | -------- | ------- | -------------------------------- |
| `project_folder`           | string   | No       | Auto    | Optional project folder override |
| `include_content_analysis` | boolean  | No       | `true`  | Extract content metadata         |
| `exclude_patterns`         | string[] | No       | `[]`    | Glob patterns to exclude         |
| `max_file_size_mb`         | number   | No       | `10`    | Max file size in MB              |
| `detect_orphans`           | boolean  | No       | `true`  | Find orphan files                |
| `extract_keywords`         | boolean  | No       | `true`  | Extract keywords from content    |

### Return Value

```json
{
  "rootPath": "Projects/my-project",
  "totalFiles": 156,
  "totalSize": 2457600,
  "analyzedAt": "2025-11-13T14:30:22.123Z",
  "files": [...],
  "folders": {
    "docs": {
      "fileCount": 45,
      "subfolderCount": 3,
      "totalSize": 892000,
      "files": [...]
    }
  },
  "categories": {
    "documentation": {
      "fileCount": 45,
      "totalSize": 892000,
      "avgConfidence": 0.92,
      "files": [...]
    },
    "meeting-notes": {
      "fileCount": 23,
      "totalSize": 456000,
      "avgConfidence": 0.88,
      "files": [...]
    }
  },
  "orphanFiles": ["temp.md", "old-notes.md"]
}
```

### File Categories

Files are automatically categorized:

- **documentation** - README files, docs folders, guides, tutorials
- **meeting-notes** - Meeting folders, date-pattern filenames
- **project-plans** - Planning folders, roadmaps, projects
- **reference** - Reference folders, links, bookmarks
- **journal** - Journal/daily/diary folders
- **uncategorized** - Files that don't match any category

### Examples

**Basic analysis:**

```javascript
const analysis = analyze_vault_structure({
  project_folder: 'my-project',
});

console.log('Total files:', analysis.totalFiles);
console.log('Orphans:', analysis.orphanFiles.length);
console.log('Categories:', Object.keys(analysis.categories));
```

**Advanced analysis with filters:**

```javascript
const analysis = analyze_vault_structure({
  project_folder: 'my-project',
  exclude_patterns: ['*.tmp', '*.log', 'archive/**'],
  max_file_size_mb: 5,
  detect_orphans: true,
  extract_keywords: true,
});
```

**Quick scan (no content analysis):**

```javascript
const analysis = analyze_vault_structure({
  project_folder: 'my-project',
  include_content_analysis: false, // Much faster
  extract_keywords: false,
});
```

### Use Cases

- Understand vault organization
- Find orphan files
- Analyze documentation structure
- Identify categorization issues
- Plan reorganization
- Generate vault statistics

### Performance

- Optimized for 1000+ files
- Content analysis adds ~50ms per file
- Keyword extraction adds ~20ms per file
- Use exclude patterns to skip unnecessary files

### Related Tools

- `generate_organization_plan` - Generate reorganization plans
- `reorganize_vault` - Execute reorganization

---

## generate_organization_plan

**NEW in v3.0.5** - Generate intelligent organization plans using preset strategies.

### Parameters

| Parameter          | Type         | Required | Default | Description                      |
| ------------------ | ------------ | -------- | ------- | -------------------------------- |
| `project_folder`   | string       | No       | Auto    | Optional project folder override |
| `preset_id`        | string       | Yes      | -       | Preset ID (see below)            |
| `min_confidence`   | number       | No       | `0.7`   | Minimum confidence (0-1)         |
| `exclude_files`    | string[]     | No       | `[]`    | Glob patterns to exclude         |
| `custom_rules`     | CustomRule[] | No       | `[]`    | Additional custom rules          |
| `max_file_size_mb` | number       | No       | `10`    | Max file size in MB              |

### Available Presets

| Preset ID      | Philosophy                       | Best For                                |
| -------------- | -------------------------------- | --------------------------------------- |
| `clean`        | Comprehensive vault organization | Production projects, clean separation   |
| `minimal`      | Keep most docs local             | Docs-as-code workflows, simple projects |
| `docs-as-code` | Mirror repo structure            | Developer-friendly, familiar structure  |
| `research`     | Heavy vault with rich linking    | Research projects, academic work        |

See [Vault Presets Documentation](../VAULT_PRESETS.md) for detailed preset information.

### Custom Rule Schema

```typescript
{
  name: string; // Human-readable name
  priority: number; // 0-100, higher = processed first
  pattern: string; // Regex pattern or string to match
  targetPath: string; // Target path (supports {YEAR} placeholder)
  confidence: number; // 0-1 confidence score
  reason: string; // Why this rule exists
}
```

### Return Value

```json
{
  "success": true,
  "preset": {
    "id": "clean",
    "name": "Clean Vault Organization",
    "description": "Comprehensive organization with minimal local files"
  },
  "project_folder": "my-project",
  "vault_analysis": {
    "total_files": 156,
    "total_size": "2.3 MB",
    "analyzed_at": "2025-11-13T14:30:22.123Z",
    "categories": [...],
    "orphan_files": 12
  },
  "plan": {
    "generatedAt": "2025-11-13T14:30:22.123Z",
    "suggestions": [...],
    "estimatedImpact": {
      "filesToMove": 45,
      "filesToRename": 12,
      "linksToUpdate": 89,
      "filesRequiringLinkUpdates": 34,
      "estimatedDuration": 15000,
      "hasRiskyOperations": false
    },
    "warnings": [],
    "summary": "Reorganize 57 files to improve vault structure",
    "requiresManualReview": false
  },
  "next_steps": [
    "Review the organization plan",
    "Run reorganize_vault with dry_run: true to preview",
    "Execute reorganization with update_links: true"
  ]
}
```

### Examples

**Generate plan with clean preset:**

```javascript
const plan = generate_organization_plan({
  project_folder: 'my-project',
  preset_id: 'clean',
  min_confidence: 0.7,
});

console.log('Files to move:', plan.plan.estimatedImpact.filesToMove);
console.log('Links to update:', plan.plan.estimatedImpact.linksToUpdate);
```

**Generate plan with custom rules:**

```javascript
const plan = generate_organization_plan({
  project_folder: 'my-project',
  preset_id: 'clean',
  custom_rules: [
    {
      name: 'Security Docs',
      priority: 96,
      pattern: 'security|auth',
      targetPath: 'docs/security',
      confidence: 0.95,
      reason: 'Security documentation should be grouped',
    },
  ],
});
```

**Generate plan excluding files:**

```javascript
const plan = generate_organization_plan({
  project_folder: 'my-project',
  preset_id: 'minimal',
  exclude_files: ['*.tmp', '*.log', 'archive/**'],
});
```

### Use Cases

- Plan vault reorganization
- Apply best practices automatically
- Standardize vault structure
- Clean up disorganized vaults
- Prepare vaults for sharing

### Related Tools

- `analyze_vault_structure` - Analyze before planning
- `reorganize_vault` - Execute the plan

---

## reorganize_vault

Execute reorganization plans with automatic link updates and rollback capability.

### Parameters

| Parameter        | Type             | Required | Default | Description                      |
| ---------------- | ---------------- | -------- | ------- | -------------------------------- |
| `project_folder` | string           | No       | Auto    | Optional project folder override |
| `plan`           | OrganizationPlan | Yes      | -       | Reorganization plan to execute   |
| `dry_run`        | boolean          | No       | `false` | Preview without changes          |
| `create_backup`  | boolean          | No       | `false` | Backup files before changes      |
| `update_links`   | boolean          | No       | `true`  | Update links in other files      |
| `stop_on_error`  | boolean          | No       | `true`  | Stop and rollback on error       |
| `min_confidence` | number           | No       | `0.5`   | Minimum confidence (0-1)         |

### Return Value

```json
{
  "success": true,
  "startedAt": "2025-11-13T14:30:22.123Z",
  "completedAt": "2025-11-13T14:30:37.456Z",
  "operations": [
    {
      "id": "op_001",
      "type": "move",
      "sourcePath": "random-notes.md",
      "targetPath": "docs/notes.md",
      "status": "completed",
      "rollbackInfo": {...}
    }
  ],
  "failedOperations": [],
  "linksUpdated": 23,
  "filesModified": ["docs/api.md", "README.md"],
  "rollbackAvailable": true,
  "rollbackStatePath": "Projects/my-project/.backups/rollback_20251113_143022.json",
  "summary": "Successfully reorganized 45 files, updated 23 links in 12 files"
}
```

### Examples

**Preview reorganization (dry run):**

```javascript
const preview = reorganize_vault({
  project_folder: 'my-project',
  plan: organizationPlan,
  dry_run: true,
});

console.log('Preview:', preview.summary);
console.log('Would affect:', preview.operations.length, 'files');
```

**Execute reorganization:**

```javascript
const result = reorganize_vault({
  project_folder: 'my-project',
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

**Execute without link updates:**

```javascript
const result = reorganize_vault({
  project_folder: 'my-project',
  plan: organizationPlan,
  update_links: false, // Faster, but may break links
  min_confidence: 0.8,
});
```

### Safety Features

**Dry Run Mode:**

- Preview all changes before applying
- No files are modified
- Shows what would happen

**Rollback Capability:**

- Automatic rollback on errors (if `stop_on_error: true`)
- Rollback state saved to vault
- Can manually restore from rollback file

**Link Updates:**

- Automatically updates `[[wiki-links]]`
- Updates `[markdown](links.md)`
- Preserves link text and formatting

**Backups:**

- Optional file backups before changes
- Stored in `.backups` folder
- Includes original content and metadata

### Use Cases

- Execute organization plans
- Clean up vault structure
- Fix broken links after manual moves
- Standardize file organization
- Prepare vaults for sharing

### Error Handling

**On Error:**

1. If `stop_on_error: true` - Stops and rolls back all changes
2. If `stop_on_error: false` - Continues with remaining operations
3. Failed operations listed in `failedOperations`
4. Rollback state saved for manual recovery

**Common Errors:**

- "Path traversal detected" - Invalid paths in plan
- "File not found" - Source file doesn't exist
- "Link update failed" - Error updating links

### Related Tools

- `analyze_vault_structure` - Analyze vault first
- `generate_organization_plan` - Generate plans

---

## Organization Presets

**NEW in v3.0.5** - Four battle-tested organization strategies.

### Clean Preset

**Philosophy:** Comprehensive vault organization with minimal local files

**Best For:** Production projects, clean separation between local and vault

**Organization:**

- Essential files stay local (README, CONTRIBUTING, LICENSE)
- Documentation goes to vault (guides, tutorials, architecture)
- Meeting notes and research in vault
- ADRs and design docs in vault

**Example:**

```javascript
generate_organization_plan({
  preset_id: 'clean',
  min_confidence: 0.7,
});
```

### Minimal Preset

**Philosophy:** Keep most documentation local, minimal vault usage

**Best For:** Docs-as-code workflows, simple projects

**Organization:**

- Most files stay local
- Only ADRs and deep research go to vault
- Inline documentation stays local
- API docs stay local

**Example:**

```javascript
generate_organization_plan({
  preset_id: 'minimal',
  min_confidence: 0.8,
});
```

### Docs-as-Code Preset

**Philosophy:** Mirror repository structure in vault

**Best For:** Developer-friendly, familiar structure

**Organization:**

- Mirrors local docs/ structure
- Preserves folder hierarchy
- Maintains relative paths
- Easy to sync back to repo

**Example:**

```javascript
generate_organization_plan({
  preset_id: 'docs-as-code',
  min_confidence: 0.7,
});
```

### Research Preset

**Philosophy:** Heavy vault usage with rich linking

**Best For:** Research projects, academic work, knowledge management

**Organization:**

- Most documentation in vault
- Rich cross-linking
- Topic-based organization
- Meeting notes and journals in vault

**Example:**

```javascript
generate_organization_plan({
  preset_id: 'research',
  min_confidence: 0.6,
});
```

### Choosing a Preset

**Use `clean` if:**

- You want clear separation
- You have extensive documentation
- You value vault organization

**Use `minimal` if:**

- You prefer docs-as-code
- You have simple documentation
- You want most files local

**Use `docs-as-code` if:**

- You're a developer
- You want familiar structure
- You sync docs to repo

**Use `research` if:**

- You do research work
- You want rich linking
- You value vault features

See [Vault Presets Documentation](../VAULT_PRESETS.md) for complete details.

---

## Complete Workflow

### Step 1: Analyze Vault

```javascript
const analysis = analyze_vault_structure({
  project_folder: 'my-project',
  detect_orphans: true,
  extract_keywords: true,
});

console.log('Total files:', analysis.totalFiles);
console.log('Orphans:', analysis.orphanFiles.length);
console.log('Categories:', Object.keys(analysis.categories));
```

### Step 2: Generate Organization Plan

```javascript
const plan = generate_organization_plan({
  project_folder: 'my-project',
  preset_id: 'clean',
  min_confidence: 0.7,
});

console.log('Files to move:', plan.plan.estimatedImpact.filesToMove);
console.log('Links to update:', plan.plan.estimatedImpact.linksToUpdate);
```

### Step 3: Preview Changes

```javascript
const preview = reorganize_vault({
  project_folder: 'my-project',
  plan: plan.plan,
  dry_run: true,
});

console.log('Preview:', preview.summary);
console.log('Operations:', preview.operations.length);
```

### Step 4: Execute Reorganization

```javascript
const result = reorganize_vault({
  project_folder: 'my-project',
  plan: plan.plan,
  update_links: true,
  create_backup: true,
  stop_on_error: true,
  min_confidence: 0.7,
});

if (result.success) {
  console.log('Success!', result.summary);
  console.log('  - Operations:', result.operations.length);
  console.log('  - Links updated:', result.linksUpdated);
} else {
  console.error('Failed!');
  console.error('  - Failed operations:', result.failedOperations.length);
}
```

## Best Practices

### Analysis

1. **Use exclude patterns** to skip unnecessary files
2. **Set reasonable file size limits** for large vaults
3. **Disable content analysis** for quick scans
4. **Review orphan files** for potential issues

### Planning

1. **Start with appropriate preset** for your workflow
2. **Use high confidence threshold** (0.7+) for safety
3. **Add custom rules** for project-specific needs
4. **Review plan warnings** before execution

### Execution

1. **Always run dry-run first** before executing
2. **Enable link updates** to maintain vault integrity
3. **Create backups** for important vaults
4. **Stop on errors** for safer execution
5. **Review estimated impact** before proceeding

## Safety Guidelines

### Before Reorganization

1. Backup your vault (Obsidian backup or git)
2. Run analysis to understand current state
3. Review the plan carefully
4. Run dry-run to preview changes
5. Close Obsidian during reorganization

### During Reorganization

1. Monitor progress for large operations
2. Don't interrupt the process
3. Check for errors in the result

### After Reorganization

1. Verify links are working
2. Check file locations
3. Test search and navigation
4. Check for broken links

## Related Documentation

- [Vault Organization Guide](../VAULT_ORGANIZATION.md) - Detailed documentation
- [Vault Presets Guide](../VAULT_PRESETS.md) - Preset details and customization
- [Configuration Guide](../configuration.md) - Setup and configuration
