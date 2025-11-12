---
description: Analyze vault structure and organization
agent: general
subtask: true
---

# Analyze Vault Structure

This command performs a comprehensive analysis of your vault's structure, content, and organization. It scans all markdown files, extracts metadata, categorizes content, and identifies opportunities for improvement.

## What This Command Does

The vault analyzer performs deep structural analysis:

### Content Scanning

- Scans all markdown files in the project folder
- Extracts frontmatter metadata (tags, dates, categories)
- Analyzes headings hierarchy and structure
- Identifies internal and external links
- Extracts inline tags and keywords
- Calculates file statistics (size, word count, etc.)

### Organization Analysis

- Categorizes files by type (guides, tutorials, reference, architecture, etc.)
- Analyzes folder structure and depth
- Identifies orphaned files (no incoming/outgoing links)
- Detects naming patterns and conventions
- Builds link graph showing connections between notes
- Calculates organization health metrics

### Output Includes

- **Summary**: Total files, folders, size, and health score
- **Folder Statistics**: File counts, average depth, naming patterns
- **Categories**: Files grouped by content type with statistics
- **Orphans**: Isolated files that could be better connected
- **Link Analysis**: Most referenced files, broken links
- **Recommendations**: Suggestions for improving organization

## Example Output

```
=== Vault Structure Analysis ===

Project: my-awesome-project
Total Files: 45 markdown files
Total Size: 2.34 MB
Health Score: 78/100

=== Folder Structure ===

docs/                     (32 files, 1.8 MB)
  guides/                 (12 files)
  tutorials/              (8 files)
  architecture/           (6 files)
    decisions/            (5 files)
  reference/              (6 files)

=== Content Categories ===

Guides (task-oriented):        12 files (26.7%)
Tutorials (learning):           8 files (17.8%)
Architecture (explanation):    11 files (24.4%)
Reference (information):        6 files (13.3%)
Uncategorized:                  8 files (17.8%)

=== Orphaned Files ===

Found 4 orphaned files with no links:
  - docs/old-notes.md (0 incoming, 0 outgoing)
  - drafts/temp.md (0 incoming, 0 outgoing)
  - research/abandoned.md (1 outgoing, 0 incoming)

=== Link Analysis ===

Total Links: 234
  Internal: 198 (84.6%)
  External: 36 (15.4%)

Most Referenced Files:
  1. docs/architecture/overview.md (23 incoming links)
  2. docs/guides/quick-start.md (18 incoming links)
  3. README.md (15 incoming links)

=== Recommendations ===

1. Connect orphaned files or consider archiving
2. Add more cross-references between guides and tutorials
3. Create index files for large folders (guides/, reference/)
4. Consider moving 3 files to more appropriate categories
5. Standardize file naming (found mixed conventions)
```

## Your Task

Execute the analyze_vault_structure tool immediately with options based on user arguments:

```javascript
// Parse optional arguments
const args = '$ARGUMENTS';
const noCategories = args.includes('--no-categories');
const noOrphans = args.includes('--no-orphans');
const maxFilesMatch = args.match(/--max-files[=\s](\d+)/);
const maxFiles = maxFilesMatch ? parseInt(maxFilesMatch[1]) : undefined;

const result = await analyze_vault_structure({
  include_categories: !noCategories,
  include_orphans: !noOrphans,
  max_file_size_mb: 10,
  max_files: maxFiles,
  exclude_patterns: ['drafts/*', '*.tmp', 'archive/*'],
});

return result;
```

**Usage Examples:**

- `/analyze-vault` - Full analysis with all features
- `/analyze-vault --no-categories` - Skip content categorization
- `/analyze-vault --no-orphans` - Skip orphan detection
- `/analyze-vault --max-files 500` - Limit to 500 files

## Analysis Options

### exclude_patterns (optional)

Glob patterns for files/folders to skip:

```javascript
exclude_patterns: ['drafts/*', '*.tmp', 'archive/*', '.trash/*'];
```

### include_categories (optional, default: true)

Whether to categorize files by content type (guides, tutorials, reference, etc.):

```javascript
include_categories: true; // Analyze and group by category
include_categories: false; // Skip categorization
```

### include_orphans (optional, default: true)

Whether to identify orphaned files with no links:

```javascript
include_orphans: true; // Find isolated files
include_orphans: false; // Skip orphan detection
```

### max_file_size_mb (optional, default: 10)

Skip files larger than this size:

```javascript
max_file_size_mb: 10; // Skip files over 10 MB
```

### max_files (optional)

Limit total number of files analyzed (useful for large vaults):

```javascript
max_files: 500; // Analyze first 500 files only
```

## Understanding the Results

### Health Score (0-100)

Indicates overall vault organization quality:

- **90-100**: Excellent organization, consistent structure
- **70-89**: Good organization, minor improvements possible
- **50-69**: Moderate organization, several areas need attention
- **Below 50**: Poor organization, significant restructuring recommended

### Categories

Files are classified using the Diátaxis framework:

- **Guides** (task-oriented): How-to documentation
- **Tutorials** (learning-oriented): Step-by-step learning paths
- **Reference** (information-oriented): API docs, specifications
- **Architecture** (understanding-oriented): Design decisions, explanations
- **Uncategorized**: Files that don't fit clear patterns

### Orphaned Files

Files with no connections to the rest of your vault:

- **No incoming links**: Nothing references this file
- **No outgoing links**: This file doesn't reference others
- **Both**: Completely isolated

Consider linking orphans or archiving if obsolete.

### Link Analysis

Shows how notes connect:

- **High incoming links**: Core reference documents
- **High outgoing links**: Hub or index pages
- **Broken links**: References to missing files

## Common Use Cases

### 1. Initial Vault Assessment

```javascript
analyze_vault_structure({
  project_folder: 'my-project',
  include_categories: true,
  include_orphans: true,
});
```

Understand current state before reorganization.

### 2. Identify Cleanup Targets

```javascript
analyze_vault_structure({
  project_folder: 'my-project',
  include_orphans: true,
  exclude_patterns: ['archive/*'],
});
```

Find files to archive or delete.

### 3. Verify Organization

```javascript
analyze_vault_structure({
  project_folder: 'my-project',
  include_categories: true,
});
```

Check if files are properly categorized.

### 4. Performance Analysis

```javascript
analyze_vault_structure({
  project_folder: 'large-project',
  max_files: 1000,
  max_file_size_mb: 5,
});
```

Analyze large vaults efficiently.

## Guidelines for Agents

When running this command:

1. **ONLY use the analyze_vault_structure tool** - Do NOT perform manual analysis
2. **Present results clearly** - Show full output with key highlights
3. **Explain findings** - Help user understand what the analysis means
4. **Do NOT**:
   - Manually read files or scan directories
   - Parse markdown or extract metadata yourself
   - Build statistics or link graphs manually
   - The tool does everything automatically
5. **Your role is to**:
   - Call the tool with appropriate parameters
   - Present and explain the results
   - Suggest next steps based on findings

## Next Steps After Analysis

Based on the analysis results:

1. **If orphans found**: Review and either link or archive them
2. **If health score low**: Consider running `/reorganize-notes`
3. **If categories mixed**: Move files to appropriate folders
4. **If broken links**: Fix or remove invalid references
5. **If naming inconsistent**: Standardize file names

## Related Commands

- `/reorganize-notes` - Execute reorganization plan based on analysis
- `/setup-notes` - Configure documentation architecture
- `/validate-config` - Validate configuration
- `/sync-notes` - Sync files between local and vault

---

_The analyze-vault-structure tool uses intelligent content analysis to provide actionable insights about your vault's organization and health._
