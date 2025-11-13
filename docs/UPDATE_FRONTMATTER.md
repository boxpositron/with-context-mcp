# update_frontmatter Tool

## Overview

The `update_frontmatter` tool allows you to edit YAML frontmatter in markdown notes. It supports two modes: **merge** (add/update fields while preserving others) and **replace** (overwrite entire frontmatter block).

## Features

- **Merge Mode**: Add new fields or update existing fields while preserving other fields
- **Replace Mode**: Replace the entire frontmatter block with new content
- **Auto-create**: Automatically creates frontmatter if the note doesn't have any
- **Read-before-write**: Enforces read-before-write pattern for safety
- **Type-safe**: Full TypeScript support with Zod schema validation
- **Edge-case handling**: Handles empty files, missing frontmatter, special characters, and arrays

## API

### Input Parameters

```typescript
{
  path: string;              // Project-relative path to the note
  frontmatter: Record<string, any>;  // Frontmatter fields to update
  mode: 'merge' | 'replace'; // Update mode
  project_folder?: string;   // Optional project context override
}
```

### Output

```json
{
  "success": true,
  "path": "docs/api.md",
  "mode": "merge",
  "project_folder": "my-project",
  "frontmatter": {
    "title": "API Documentation",
    "version": "1.0.0",
    "tags": ["api", "docs"]
  },
  "message": "Frontmatter merged successfully"
}
```

## Usage Examples

### Example 1: Add tags to existing note (merge mode)

**Input:**

```json
{
  "path": "docs/api.md",
  "frontmatter": {
    "tags": ["api", "documentation"]
  },
  "mode": "merge"
}
```

**Before:**

```markdown
---
title: API Documentation
author: John Doe
---

# API Documentation

...
```

**After:**

```markdown
---
title: 'API Documentation'
author: 'John Doe'
tags:
  - api
  - documentation
---

# API Documentation

...
```

### Example 2: Update existing field (merge mode)

**Input:**

```json
{
  "path": "docs/api.md",
  "frontmatter": {
    "version": "2.0.0",
    "updated": "2025-11-13"
  },
  "mode": "merge"
}
```

**Before:**

```markdown
---
title: API Documentation
version: 1.0.0
---

Content
```

**After:**

```markdown
---
title: 'API Documentation'
version: '2.0.0'
updated: '2025-11-13'
---

Content
```

### Example 3: Replace entire frontmatter (replace mode)

**Input:**

```json
{
  "path": "docs/api.md",
  "frontmatter": {
    "title": "New Title",
    "status": "draft"
  },
  "mode": "replace"
}
```

**Before:**

```markdown
---
title: Old Title
author: John Doe
version: 1.0.0
tags:
  - old
  - tags
---

Content
```

**After:**

```markdown
---
title: 'New Title'
status: 'draft'
---

Content
```

### Example 4: Create frontmatter in note without any

**Input:**

```json
{
  "path": "docs/new-note.md",
  "frontmatter": {
    "title": "My Note",
    "tags": ["dev", "mcp"]
  },
  "mode": "merge"
}
```

**Before:**

```markdown
# My Note

This note has no frontmatter yet.
```

**After:**

```markdown
---
title: 'My Note'
tags:
  - dev
  - mcp
---

# My Note

This note has no frontmatter yet.
```

## Implementation Details

### Frontmatter Parsing

The tool uses a simple YAML parser that supports:

- Key-value pairs (strings, numbers, booleans)
- Arrays (using `- item` syntax)
- Quoted strings (with escape handling)

### Frontmatter Building

The tool builds YAML frontmatter with:

- String values are quoted and escaped
- Arrays use proper indentation (`  - item`)
- Values preserve their types (strings, numbers, booleans)

### Read-Before-Write Enforcement

Like other write operations in this MCP server, `update_frontmatter` enforces read-before-write:

1. The tool reads the existing note content
2. Parses the current frontmatter
3. Updates or replaces based on mode
4. Writes back the updated content

This ensures the tool has the current state before making changes.

### Edge Cases Handled

1. **No frontmatter**: Creates new frontmatter block
2. **Empty file**: Creates frontmatter with content
3. **Malformed frontmatter**: Treats as no frontmatter (graceful fallback)
4. **Special characters**: Properly escapes quotes and special characters
5. **Arrays**: Supports array fields (tags, categories, etc.)
6. **Mixed types**: Handles strings, numbers, booleans, and arrays

## Error Handling

The tool will throw errors for:

- Invalid path (security validation)
- File not found
- Obsidian API connection issues
- Invalid input schema (Zod validation)
- Read-before-write violations

## Related Tools

- `get_note_metadata`: Read existing frontmatter and metadata
- `write_note`: Write or update entire note content
- `read_note`: Read note content for inspection

## Testing

Unit tests are available in `tests/unit/update-frontmatter.test.ts`.

To run tests:

```bash
npm run test:run tests/unit/update-frontmatter.test.ts
```

## Security

- Path validation via `sanitizePath()` prevents directory traversal
- Project context isolation ensures notes stay within project folder
- Read-before-write enforcement prevents accidental overwrites
- Input validation via Zod schemas

## Performance

- Fast operation: single read + single write
- Minimal memory footprint: parses line-by-line
- No external YAML library dependencies
- Suitable for notes up to several MB in size
