# Editing Tools

Advanced editing tools for targeted updates to note structure and metadata. New in v3.0.6.

## Table of Contents

- [update_frontmatter](#update_frontmatter)
- [replace_section](#replace_section)

---

## update_frontmatter

Edit YAML frontmatter in markdown notes with merge or replace modes.

### Parameters

| Parameter        | Type                     | Required | Default     | Description                       |
| ---------------- | ------------------------ | -------- | ----------- | --------------------------------- |
| `path`           | string                   | Yes      | -           | Project-relative path to the note |
| `frontmatter`    | Record<string, any>      | Yes      | -           | Frontmatter fields to update      |
| `mode`           | `'merge'` \| `'replace'` | Yes      | -           | Update mode                       |
| `project_folder` | string                   | No       | Auto-detect | Optional project context override |

### Modes

**`merge`** (Recommended)

- Adds new fields to existing frontmatter
- Updates existing fields with new values
- Preserves other fields not mentioned
- Creates frontmatter if note doesn't have any

**`replace`**

- Replaces entire frontmatter block
- Removes all existing fields
- Only includes fields you specify
- Use when you want complete control

### Supported Field Types

- **Strings** - Automatically quoted and escaped
- **Numbers** - Preserved as numeric values
- **Booleans** - `true` / `false`
- **Arrays** - Formatted with proper YAML indentation

### Return Value

```json
{
  "success": true,
  "path": "docs/api.md",
  "mode": "merge",
  "project_folder": "my-project",
  "frontmatter": {
    "title": "API Documentation",
    "version": "2.0.0",
    "tags": ["api", "docs"]
  },
  "message": "Frontmatter merged successfully"
}
```

### Examples

#### Example 1: Add tags to existing note (merge mode)

```javascript
update_frontmatter({
  path: 'docs/api.md',
  frontmatter: {
    tags: ['api', 'documentation'],
  },
  mode: 'merge',
});
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

#### Example 2: Update existing field (merge mode)

```javascript
update_frontmatter({
  path: 'docs/api.md',
  frontmatter: {
    version: '2.0.0',
    updated: '2025-11-13',
  },
  mode: 'merge',
});
```

**Before:**

```markdown
---
title: API Documentation
version: 1.0.0
---
```

**After:**

```markdown
---
title: 'API Documentation'
version: '2.0.0'
updated: '2025-11-13'
---
```

#### Example 3: Replace entire frontmatter (replace mode)

```javascript
update_frontmatter({
  path: 'docs/api.md',
  frontmatter: {
    title: 'New Title',
    status: 'draft',
  },
  mode: 'replace',
});
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
```

**After:**

```markdown
---
title: 'New Title'
status: 'draft'
---
```

#### Example 4: Create frontmatter in note without any

```javascript
update_frontmatter({
  path: 'docs/new-note.md',
  frontmatter: {
    title: 'My Note',
    tags: ['dev', 'mcp'],
  },
  mode: 'merge',
});
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

#### Example 5: Complex frontmatter with arrays and nested data

```javascript
update_frontmatter({
  path: 'docs/guide.md',
  frontmatter: {
    title: 'User Guide',
    version: '2.0.0',
    tags: ['guide', 'tutorial', 'beginner'],
    metadata: {
      author: 'Alice',
      reviewed: true,
      reviewers: ['Bob', 'Charlie'],
    },
  },
  mode: 'merge',
});
```

### Use Cases

**Documentation Management:**

- Add or update tags for organization
- Track version numbers and update dates
- Set status flags (draft, published, archived)
- Add metadata (author, category, priority)

**Content Tracking:**

- Update timestamps (created, modified, reviewed)
- Track review status and reviewers
- Manage publication dates
- Set content lifecycle status

**Organization:**

- Categorize notes with tags
- Set priority levels
- Link related content
- Track dependencies

**Metadata Enrichment:**

- Add SEO metadata
- Set reading time estimates
- Track word counts
- Add custom fields

### Common Patterns

**Pattern 1: Update timestamp on edit**

```javascript
update_frontmatter({
  path: 'docs/api.md',
  frontmatter: {
    updated: new Date().toISOString().split('T')[0],
    version: '2.1.0',
  },
  mode: 'merge',
});
```

**Pattern 2: Add tags incrementally**

```javascript
// Read existing tags first
const metadata = get_note_metadata({ path: 'docs/guide.md' });
const existingTags = metadata.frontmatter?.tags || [];

// Add new tags
update_frontmatter({
  path: 'docs/guide.md',
  frontmatter: {
    tags: [...existingTags, 'new-tag', 'another-tag'],
  },
  mode: 'merge',
});
```

**Pattern 3: Set review status**

```javascript
update_frontmatter({
  path: 'docs/feature-spec.md',
  frontmatter: {
    status: 'reviewed',
    reviewed_by: 'Alice',
    reviewed_at: '2025-11-13',
    approved: true,
  },
  mode: 'merge',
});
```

**Pattern 4: Initialize new note with metadata**

```javascript
// Create note
write_note({
  path: 'docs/new-api.md',
  content: '# New API\n\n...',
  mode: 'create',
});

// Add frontmatter
update_frontmatter({
  path: 'docs/new-api.md',
  frontmatter: {
    title: 'New API Documentation',
    created: '2025-11-13',
    author: 'Development Team',
    status: 'draft',
    tags: ['api', 'new'],
  },
  mode: 'merge',
});
```

### Related Tools

- `get_note_metadata` - Read existing frontmatter
- `write_note` - Write entire note content
- `read_note` - Read note for inspection
- `replace_section` - Update specific sections

### Notes

- Enforces read-before-write for safety
- Handles special characters and escaping
- Preserves YAML formatting
- Creates frontmatter if missing (merge mode)
- Supports nested objects and arrays

### Error Handling

**Common Errors:**

- **"File not found"** - Verify path exists
- **"Invalid frontmatter"** - Check YAML syntax
- **"Path traversal detected"** - Use project-relative paths

**Best Practices:**

- Use `merge` mode unless you need complete replacement
- Read metadata first to avoid overwriting important fields
- Use consistent field naming conventions
- Validate complex objects before updating

---

## replace_section

Replace specific sections in markdown notes by heading. Supports three replacement modes and automatic disambiguation.

### Parameters

| Parameter         | Type                                             | Required | Default          | Description                              |
| ----------------- | ------------------------------------------------ | -------- | ---------------- | ---------------------------------------- |
| `path`            | string                                           | Yes      | -                | Project-relative path to the note        |
| `heading`         | string                                           | Yes      | -                | Heading text to find (without # symbols) |
| `content`         | string                                           | Yes      | -                | New content for the section              |
| `mode`            | `'content-only'` \| `'full'` \| `'heading-only'` | No       | `'content-only'` | Replacement mode                         |
| `level`           | number (1-6)                                     | No       | -                | Optional heading level filter            |
| `index`           | number                                           | No       | -                | Optional occurrence index (0-based)      |
| `preview`         | boolean                                          | No       | `false`          | Preview changes without applying         |
| `createIfMissing` | boolean                                          | No       | `false`          | Create section if not found              |
| `project_folder`  | string                                           | No       | Auto-detect      | Optional project context override        |

### Modes

**`content-only`** (Default)

- Replaces only the section content
- Preserves the heading line
- Preserves nested subsections (when `level` is specified)
- Most common use case

**`full`**

- Replaces both heading and content
- Removes entire section including heading
- New content should include the heading
- Use for complete section rewrites

**`heading-only`**

- Replaces only the heading text
- Preserves all section content
- Use for renaming sections

### Section Boundaries

Sections are determined by heading hierarchy:

- A section includes the heading and all content until the next same/higher level heading
- Nested headings (lower in hierarchy) are included in the section
- Example: `## Section` includes all content until the next `##` or `#` heading

### Return Value

```json
{
  "success": true,
  "action": "replace",
  "path": "README.md",
  "heading": "Installation",
  "level": 2,
  "mode": "content-only",
  "section": {
    "line": 45,
    "contentLines": 12
  },
  "project_folder": "my-project",
  "message": "Section \"Installation\" content-only replaced successfully"
}
```

**Preview Response:**

```json
{
  "success": true,
  "preview": true,
  "action": "replace",
  "before": "## Installation\nOld content...",
  "after": "## Installation\nNew content...",
  "message": "Preview: Would replace content-only of section \"Installation\""
}
```

### Examples

#### Example 1: Replace section content (default mode)

```javascript
replace_section({
  path: 'README.md',
  heading: 'Installation',
  content: "npm install my-package\n\nThat's it!",
  mode: 'content-only', // default, can be omitted
});
```

**Before:**

```markdown
## Installation

Old installation steps here...
```

**After:**

```markdown
## Installation

npm install my-package

That's it!
```

#### Example 2: Replace both heading and content

```javascript
replace_section({
  path: 'docs/guide.md',
  heading: 'Old Section',
  content: '## New Section Title\n\nCompletely new content here.',
  mode: 'full',
});
```

**Before:**

```markdown
## Old Section

Old content...
```

**After:**

```markdown
## New Section Title

Completely new content here.
```

#### Example 3: Replace only heading (rename section)

```javascript
replace_section({
  path: 'docs/api.md',
  heading: 'Users',
  content: '## User Management',
  mode: 'heading-only',
});
```

**Before:**

```markdown
## Users

User API endpoints...
```

**After:**

```markdown
## User Management

User API endpoints...
```

#### Example 4: Disambiguate by heading level

```javascript
replace_section({
  path: 'README.md',
  heading: 'Examples',
  content: 'Updated examples...',
  level: 2, // Only match ## Examples, not ### Examples
});
```

#### Example 5: Disambiguate by index

```javascript
replace_section({
  path: 'CHANGELOG.md',
  heading: 'Fixed',
  content: '- Bug fix details',
  index: 1, // Second occurrence (0-based)
});
```

#### Example 6: Preview changes before applying

```javascript
const preview = replace_section({
  path: 'README.md',
  heading: 'Installation',
  content: 'New installation steps',
  preview: true,
});

console.log('Before:', preview.before);
console.log('After:', preview.after);

// If satisfied, apply changes
replace_section({
  path: 'README.md',
  heading: 'Installation',
  content: 'New installation steps',
});
```

#### Example 7: Create section if not found

```javascript
replace_section({
  path: 'docs/api.md',
  heading: 'Authentication',
  content: 'Details about authentication...',
  createIfMissing: true, // Only works with content-only mode
  level: 2, // Creates ## Authentication
});
```

### Handling Duplicate Headings

If multiple headings match your query, the tool returns an error with details:

```json
{
  "success": false,
  "error": "Ambiguous heading",
  "message": "Multiple headings found matching \"Examples\". Specify 'index' or 'level' to disambiguate.",
  "matches": 3,
  "details": "  0: Level 2 - \"## Examples\" at line 45\n  1: Level 3 - \"### Examples\" at line 120\n  2: Level 2 - \"## Examples\" at line 200"
}
```

**Solutions:**

1. Use `level` parameter to filter by heading level
2. Use `index` parameter to select specific occurrence (0-based)
3. Combine both for precise targeting

### Use Cases

**Documentation Updates:**

- Update installation instructions
- Refresh API endpoint documentation
- Update changelog sections
- Revise examples and tutorials

**Section Management:**

- Rename sections while preserving content
- Rewrite entire sections with new structure
- Add new sections to existing documents
- Update specific parts of long documents

**Content Maintenance:**

- Update outdated information
- Add new information to sections
- Remove deprecated content
- Reorganize section structure

### Common Patterns

**Pattern 1: Update installation steps**

```javascript
replace_section({
  path: 'README.md',
  heading: 'Installation',
  content: `
npm install my-package

Or using yarn:

yarn add my-package
  `.trim(),
});
```

**Pattern 2: Update API documentation**

```javascript
replace_section({
  path: 'docs/api.md',
  heading: 'POST /api/users',
  content: `
**Request Body:**
\`\`\`json
{
  "name": "string",
  "email": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "string",
  "name": "string",
  "email": "string"
}
\`\`\`
  `.trim(),
  level: 3,
});
```

**Pattern 3: Update changelog section**

```javascript
replace_section({
  path: 'CHANGELOG.md',
  heading: 'Unreleased',
  content: `
### Added
- New feature X
- New feature Y

### Fixed
- Bug fix Z
  `.trim(),
});
```

**Pattern 4: Safe update with preview**

```javascript
// Preview first
const preview = replace_section({
  path: 'README.md',
  heading: 'Usage',
  content: 'New usage instructions...',
  preview: true,
});

// Review changes
if (preview.success) {
  console.log('Changes look good!');

  // Apply changes
  replace_section({
    path: 'README.md',
    heading: 'Usage',
    content: 'New usage instructions...',
  });
}
```

### Edge Cases

**Empty content:**

```javascript
replace_section({
  path: 'README.md',
  heading: 'Deprecated',
  content: '', // Removes section content, keeps heading
  mode: 'content-only',
});
```

**Section with nested headings:**

```javascript
// When level is NOT specified: replaces all content including nested sections
// When level IS specified: preserves nested subsections

replace_section({
  path: 'docs/guide.md',
  heading: 'API',
  content: 'New API overview',
  level: 2, // Preserves ### subsections under ## API
});
```

**Section not found:**

```javascript
// Without createIfMissing:
// Returns error: "Heading not found"

// With createIfMissing:
// Creates new section at end of file (content-only mode only)
```

### Related Tools

- `write_note` - Write entire note content
- `update_frontmatter` - Edit YAML frontmatter
- `read_note` - Read note for inspection
- `get_note_metadata` - Get headings and structure

### Notes

- Enforces read-before-write for safety
- Supports markdown headings (# through ######)
- Preserves formatting and indentation
- Handles nested sections intelligently
- Preview mode available for safety

### Error Handling

**Common Errors:**

- **"Heading not found"** - Verify heading text matches exactly (case-sensitive)
- **"Ambiguous heading"** - Use `level` or `index` to disambiguate
- **"Invalid level"** - Level must be 1-6
- **"Path traversal detected"** - Use project-relative paths

**Best Practices:**

- Use `preview: true` for complex updates
- Specify `level` when dealing with nested headings
- Use `index` for duplicate headings in changelogs
- Test on a copy first for major rewrites

---

## Best Practices

### Frontmatter Management

1. **Use merge mode by default:**

   ```javascript
   update_frontmatter({
     path: 'docs/api.md',
     frontmatter: { updated: '2025-11-13' },
     mode: 'merge', // Preserves other fields
   });
   ```

2. **Read before complex updates:**

   ```javascript
   const metadata = get_note_metadata({ path: 'docs/api.md' });
   const existingTags = metadata.frontmatter?.tags || [];

   update_frontmatter({
     path: 'docs/api.md',
     frontmatter: { tags: [...existingTags, 'new-tag'] },
     mode: 'merge',
   });
   ```

3. **Use consistent field naming:**

   ```javascript
   // Good: snake_case or camelCase
   { created_at: '2025-11-13', updated_at: '2025-11-13' }

   // Avoid: mixed styles
   { created_at: '2025-11-13', UpdatedAt: '2025-11-13' }
   ```

### Section Replacement

1. **Preview before applying:**

   ```javascript
   const preview = replace_section({
     path: 'README.md',
     heading: 'Installation',
     content: 'New content...',
     preview: true,
   });

   if (preview.success) {
     replace_section({
       path: 'README.md',
       heading: 'Installation',
       content: 'New content...',
     });
   }
   ```

2. **Use level for nested documents:**

   ```javascript
   replace_section({
     path: 'docs/guide.md',
     heading: 'Examples',
     content: 'New examples...',
     level: 2, // Only ## Examples, not ### Examples
   });
   ```

3. **Handle duplicates explicitly:**
   ```javascript
   replace_section({
     path: 'CHANGELOG.md',
     heading: 'Fixed',
     content: '- Bug fixes...',
     index: 0, // First occurrence
   });
   ```

## Common Workflows

### Workflow 1: Update Documentation Metadata

```javascript
// 1. Read current metadata
const metadata = get_note_metadata({ path: 'docs/api.md' });

// 2. Update frontmatter
update_frontmatter({
  path: 'docs/api.md',
  frontmatter: {
    version: '2.0.0',
    updated: '2025-11-13',
    reviewed: true,
  },
  mode: 'merge',
});

// 3. Update content section
replace_section({
  path: 'docs/api.md',
  heading: 'Version History',
  content: '## Version History\n\n- v2.0.0 (2025-11-13): Major update',
});
```

### Workflow 2: Maintain Changelog

```javascript
// 1. Prepend new version to changelog
write_note({
  path: 'CHANGELOG.md',
  content: '## v2.0.0 - 2025-11-13\n\n',
  mode: 'prepend',
});

// 2. Update unreleased section
replace_section({
  path: 'CHANGELOG.md',
  heading: 'Unreleased',
  content: '### No unreleased changes',
  level: 2,
});

// 3. Update frontmatter
update_frontmatter({
  path: 'CHANGELOG.md',
  frontmatter: {
    latest_version: '2.0.0',
    updated: '2025-11-13',
  },
  mode: 'merge',
});
```

### Workflow 3: Restructure Documentation

```javascript
// 1. Preview section update
const preview = replace_section({
  path: 'README.md',
  heading: 'Installation',
  content: '## Setup\n\nNew installation steps...',
  mode: 'full',
  preview: true,
});

// 2. Apply if satisfied
if (preview.success) {
  replace_section({
    path: 'README.md',
    heading: 'Installation',
    content: '## Setup\n\nNew installation steps...',
    mode: 'full',
  });
}

// 3. Update table of contents
replace_section({
  path: 'README.md',
  heading: 'Table of Contents',
  content: '- [Setup](#setup)\n- [Usage](#usage)\n- [API](#api)',
});
```

## Related Documentation

- [Core Tools](./core-tools.md) - Basic note operations
- [Session Tools](./session-tools.md) - Session management
- [Update Frontmatter Guide](../UPDATE_FRONTMATTER.md) - Detailed frontmatter documentation
- [Configuration Guide](../configuration.md) - Setup and configuration
