# Analyze Vault Structure Tool

The `analyze_vault_structure` MCP tool provides comprehensive analysis of your project's vault structure.

## Features

- Scans all markdown files in the vault
- Extracts metadata (headings, frontmatter, links, tags)
- Builds folder and category statistics
- Identifies orphan files (files with no links)
- Provides insights about vault organization

## Usage via MCP

### Basic Analysis

```json
{
  "name": "analyze_vault_structure",
  "arguments": {
    "project_folder": "my-project"
  }
}
```

### With Options

```json
{
  "name": "analyze_vault_structure",
  "arguments": {
    "project_folder": "my-project",
    "exclude_patterns": ["*.tmp", "drafts/*"],
    "include_categories": true,
    "include_orphans": true,
    "max_file_size_mb": 10,
    "max_files": 100
  }
}
```

### Exclude Patterns

Exclude specific files or folders from analysis:

```json
{
  "name": "analyze_vault_structure",
  "arguments": {
    "project_folder": "my-project",
    "exclude_patterns": ["*.tmp", "drafts/*", ".obsidian/*"]
  }
}
```

### Limit File Count

For large vaults, limit the number of files analyzed:

```json
{
  "name": "analyze_vault_structure",
  "arguments": {
    "project_folder": "my-project",
    "max_files": 50
  }
}
```

## Response Format

The tool returns a JSON response with the following structure:

```json
{
  "success": true,
  "project_folder": "my-project",
  "analyzed_at": "2024-01-15T10:30:00.000Z",
  "summary": {
    "total_files": 42,
    "analyzed_files": 42,
    "limit_applied": false,
    "total_folders": 5,
    "total_size": "2.34 MB",
    "total_size_bytes": 2453821,
    "orphan_files": 3
  },
  "categories": [
    {
      "name": "documentation",
      "file_count": 15,
      "total_size": "856.23 KB",
      "confidence": 1.0
    },
    {
      "name": "meeting-notes",
      "file_count": 10,
      "total_size": "423.11 KB",
      "confidence": 1.0
    }
  ],
  "folders": [
    {
      "path": "docs",
      "file_count": 20,
      "subfolder_count": 2,
      "total_size": "1.23 MB"
    }
  ],
  "top_files": [
    {
      "path": "projects/my-project/README.md",
      "name": "README.md",
      "size": "12.34 KB",
      "word_count": 1234,
      "link_count": 15,
      "backlink_count": 8,
      "tags": ["documentation", "guide"],
      "topics": ["typescript", "setup", "configuration"]
    }
  ],
  "orphan_files": [
    {
      "path": "projects/my-project/orphan.md",
      "name": "orphan.md",
      "size": "2.45 KB",
      "word_count": 234
    }
  ],
  "insights": {
    "avg_file_size": "58.42 KB",
    "avg_links_per_file": "3.45",
    "files_with_tags": 28,
    "files_with_frontmatter": 35
  }
}
```

## Use Cases

### 1. Understanding Vault Organization

Analyze your vault to understand:

- How files are organized across folders
- Which categories dominate your vault
- Average file sizes and link density

### 2. Identifying Orphan Files

Find files that have no incoming or outgoing links, which may indicate:

- Isolated content that could be better connected
- Files that could be archived or deleted
- Opportunities to create more connections

### 3. Vault Health Metrics

Get insights about:

- Tag coverage (how many files use tags)
- Frontmatter adoption
- Link density (average links per file)
- File size distribution

### 4. Pre-Reorganization Analysis

Before reorganizing your vault:

- Analyze current structure
- Identify categories and patterns
- Plan folder structure based on actual content

## Parameters

| Parameter            | Type     | Required | Default           | Description                 |
| -------------------- | -------- | -------- | ----------------- | --------------------------- |
| `project_folder`     | string   | No       | (session context) | Project folder to analyze   |
| `exclude_patterns`   | string[] | No       | `[]`              | Glob patterns to exclude    |
| `include_categories` | boolean  | No       | `true`            | Include category statistics |
| `include_orphans`    | boolean  | No       | `true`            | Identify orphan files       |
| `max_file_size_mb`   | number   | No       | `10`              | Max file size in MB         |
| `max_files`          | number   | No       | (unlimited)       | Max files to analyze        |

## Categories

Files are automatically categorized based on path and content patterns:

- **documentation** - README, guides, tutorials
- **meeting-notes** - Meeting notes, dated files
- **project-plans** - Roadmaps, planning documents
- **reference** - Reference materials, links, bookmarks
- **journal** - Daily notes, diary entries
- **uncategorized** - Files that don't match patterns

## Performance

For large vaults:

- Use `max_files` to limit analysis
- Use `exclude_patterns` to skip large folders
- Use `max_file_size_mb` to skip large files
- Set `include_categories: false` to skip categorization
- Set `include_orphans: false` to skip orphan detection

## Examples

### Quick Health Check

```json
{
  "name": "analyze_vault_structure",
  "arguments": {
    "max_files": 20,
    "include_categories": false
  }
}
```

### Comprehensive Analysis

```json
{
  "name": "analyze_vault_structure",
  "arguments": {
    "include_categories": true,
    "include_orphans": true,
    "max_file_size_mb": 20
  }
}
```

### Focus on Documentation

```json
{
  "name": "analyze_vault_structure",
  "arguments": {
    "exclude_patterns": ["meetings/*", "journal/*", "*.tmp"]
  }
}
```
