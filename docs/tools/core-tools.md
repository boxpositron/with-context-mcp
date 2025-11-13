# Core Tools

Essential tools for reading, writing, and managing notes in your Obsidian vault.

## Table of Contents

- [write_note](#write_note)
- [read_note](#read_note)
- [list_notes](#list_notes)
- [search_notes](#search_notes)
- [get_note_metadata](#get_note_metadata)
- [delete_note](#delete_note)
- [batch_write_notes](#batch_write_notes)
- [Template Tools](#template-tools)
  - [list_templates](#list_templates)
  - [create_from_template](#create_from_template)

---

## write_note

Write or update notes with multiple write modes including create, overwrite, append, and prepend.

### Parameters

| Parameter        | Type                                                     | Required | Default       | Description                       |
| ---------------- | -------------------------------------------------------- | -------- | ------------- | --------------------------------- |
| `path`           | string                                                   | Yes      | -             | Project-relative path to the note |
| `content`        | string                                                   | Yes      | -             | Content to write                  |
| `mode`           | `'create'` \| `'overwrite'` \| `'append'` \| `'prepend'` | No       | `'overwrite'` | Write mode                        |
| `project_folder` | string                                                   | No       | Auto-detect   | Optional project context override |

### Write Modes

**`create`** - Create new file (fails if exists)

- Use for new documentation
- Prevents accidental overwrites
- Returns error if file already exists

**`overwrite`** - Replace entire file content

- Use for complete rewrites
- Enforces read-before-write for safety
- Replaces all existing content

**`append`** - Add content to end of file

- Use for changelogs, logs, updates
- Preserves existing content
- Adds content after existing text

**`prepend`** (NEW) - Add content to beginning of file

- Use for breaking changes, urgent notices
- Preserves existing content
- Adds content before existing text
- Respects frontmatter (content added after frontmatter)

### Return Value

```json
{
  "success": true,
  "path": "docs/api.md",
  "mode": "create",
  "project_folder": "my-project",
  "message": "Note created successfully"
}
```

### Examples

**Create new documentation:**

```javascript
write_note({
  path: 'docs/api.md',
  content: '# API Documentation\n\n## Endpoints\n\n...',
  mode: 'create',
});
```

**Append to changelog:**

```javascript
write_note({
  path: 'CHANGELOG.md',
  content: '\n## v2.0.0 - 2025-11-13\n\n- Added new features\n- Fixed bugs\n',
  mode: 'append',
});
```

**Prepend breaking changes:**

```javascript
write_note({
  path: 'CHANGELOG.md',
  content: '## BREAKING CHANGES - v3.0.0\n\n- API restructured\n- Auth flow changed\n\n',
  mode: 'prepend',
});
```

**Update entire file:**

```javascript
write_note({
  path: 'README.md',
  content: '# My Project\n\nCompletely new content...',
  mode: 'overwrite',
});
```

**Override project context:**

```javascript
write_note({
  path: 'notes.md',
  content: '# Notes',
  mode: 'create',
  project_folder: 'other-project',
});
```

### Use Cases

- Create new documentation files
- Update changelogs and release notes
- Add breaking change notices
- Append log entries
- Rewrite outdated documentation
- Create project-specific notes

### Related Tools

- `batch_write_notes` - Write multiple notes at once
- `update_frontmatter` - Update YAML frontmatter only
- `replace_section` - Update specific sections
- `create_from_template` - Create from templates

### Notes

- Enforces read-before-write for existing files (except create mode)
- Paths must be project-relative (no absolute paths)
- Prepend mode respects frontmatter boundaries
- All modes support markdown content

---

## read_note

Read note content from your Obsidian vault.

### Parameters

| Parameter        | Type   | Required | Default     | Description                       |
| ---------------- | ------ | -------- | ----------- | --------------------------------- |
| `path`           | string | Yes      | -           | Project-relative path to the note |
| `project_folder` | string | No       | Auto-detect | Optional project context override |

### Return Value

```json
{
  "success": true,
  "path": "docs/api.md",
  "content": "# API Documentation\n\n...",
  "project_folder": "my-project"
}
```

### Examples

**Read documentation:**

```javascript
const result = read_note({
  path: 'docs/api.md',
});
console.log(result.content);
```

**Read from specific project:**

```javascript
const result = read_note({
  path: 'README.md',
  project_folder: 'other-project',
});
```

### Use Cases

- Inspect existing documentation
- Read before updating (required for write operations)
- Extract content for processing
- Verify file contents

### Related Tools

- `get_note_metadata` - Get metadata without full content
- `search_notes` - Search across multiple notes
- `write_note` - Write note content

---

## list_notes

List files in a directory with optional fuzzy search support.

### Parameters

| Parameter            | Type    | Required | Default     | Description                             |
| -------------------- | ------- | -------- | ----------- | --------------------------------------- |
| `path`               | string  | No       | `''`        | Directory to list (relative to project) |
| `fuzzy_query`        | string  | No       | -           | Fuzzy search query                      |
| `limit`              | number  | No       | `50`        | Max results to return                   |
| `min_score`          | number  | No       | `-10000`    | Minimum match score                     |
| `include_highlights` | boolean | No       | `true`      | Include match highlights                |
| `project_folder`     | string  | No       | Auto-detect | Optional project context override       |

### Return Value

**Without fuzzy search:**

```json
{
  "files": ["api.md", "guide.md", "setup.md"],
  "count": 3,
  "path": "docs",
  "project_folder": "my-project"
}
```

**With fuzzy search:**

```json
{
  "files": [
    {
      "path": "docs/api/users.md",
      "highlight": "docs/api/<b>user</b>s.md",
      "score": 15
    },
    {
      "path": "docs/guides/user-guide.md",
      "highlight": "docs/guides/<b>user</b>-guide.md",
      "score": 12
    }
  ],
  "total_matches": 2,
  "limited": false,
  "query": "user",
  "search_time_ms": 5,
  "path": "docs",
  "project_folder": "my-project"
}
```

### Fuzzy Search Features

**Intelligent Matching:**

- Case-insensitive search
- Partial matches supported
- Multi-word queries
- Filename matches prioritized (1.5x score boost)

**Match Highlighting:**

- Matched characters wrapped in `<b>` tags
- Example: `docs/api/<b>user</b>s.md` for query "user"
- Can be disabled with `include_highlights: false`

**Performance:**

- Fast search even with 1000+ files
- Results sorted by relevance (score)
- Includes `search_time_ms` metric

### Examples

**List all files in directory:**

```javascript
list_notes({
  path: 'docs',
});
```

**Fuzzy search for files:**

```javascript
list_notes({
  path: 'docs',
  fuzzy_query: 'api',
});
```

**Multi-word fuzzy search:**

```javascript
list_notes({
  path: 'docs',
  fuzzy_query: 'user auth',
  limit: 10,
});
```

**Filter by score threshold:**

```javascript
list_notes({
  path: 'docs',
  fuzzy_query: 'install',
  min_score: -5000, // Only high-quality matches
});
```

**Without highlights:**

```javascript
list_notes({
  path: 'docs',
  fuzzy_query: 'config',
  include_highlights: false,
});
```

### Use Cases

- Browse documentation structure
- Find files by partial name
- Quickly locate specific documentation
- Filter large directories
- Discover related files

### Related Tools

- `search_notes` - Search note content
- `read_note` - Read specific note
- `get_note_metadata` - Get file metadata

### Performance Notes

- Optimized for vaults with 1000+ files
- Search typically completes in <50ms
- Results limited to 50 by default (configurable)
- Filename matches ranked higher than path matches

---

## search_notes

Search note content across multiple files.

### Parameters

| Parameter        | Type    | Required | Default     | Description                       |
| ---------------- | ------- | -------- | ----------- | --------------------------------- |
| `query`          | string  | Yes      | -           | Search query (regex supported)    |
| `path`           | string  | No       | `''`        | Directory to search               |
| `case_sensitive` | boolean | No       | `false`     | Case-sensitive search             |
| `limit`          | number  | No       | `50`        | Max results to return             |
| `project_folder` | string  | No       | Auto-detect | Optional project context override |

### Return Value

```json
{
  "matches": [
    {
      "path": "docs/api.md",
      "line": 15,
      "content": "Authentication is required for all API endpoints",
      "context": "## Authentication\n\nAuthentication is required..."
    }
  ],
  "total_matches": 1,
  "query": "authentication",
  "search_time_ms": 12,
  "project_folder": "my-project"
}
```

### Examples

**Simple text search:**

```javascript
search_notes({
  query: 'authentication',
});
```

**Case-sensitive search:**

```javascript
search_notes({
  query: 'API',
  case_sensitive: true,
});
```

**Regex search:**

```javascript
search_notes({
  query: 'v\\d+\\.\\d+\\.\\d+', // Version numbers
  path: 'CHANGELOG.md',
});
```

**Limited results:**

```javascript
search_notes({
  query: 'TODO',
  limit: 10,
});
```

### Use Cases

- Find specific content across documentation
- Locate TODOs and FIXMEs
- Search for API references
- Find version numbers
- Locate specific terminology

### Related Tools

- `list_notes` - List files by name
- `read_note` - Read full content
- `get_note_metadata` - Get metadata

---

## get_note_metadata

Extract metadata from notes including word count, tags, headings, and frontmatter.

### Parameters

| Parameter        | Type   | Required | Default     | Description                       |
| ---------------- | ------ | -------- | ----------- | --------------------------------- |
| `path`           | string | Yes      | -           | Project-relative path to the note |
| `project_folder` | string | No       | Auto-detect | Optional project context override |

### Return Value

```json
{
  "success": true,
  "path": "docs/api.md",
  "metadata": {
    "word_count": 1250,
    "line_count": 85,
    "frontmatter": {
      "title": "API Documentation",
      "tags": ["api", "docs"],
      "version": "2.0.0"
    },
    "tags": ["api", "docs", "authentication"],
    "headings": [
      { "level": 1, "text": "API Documentation", "line": 1 },
      { "level": 2, "text": "Authentication", "line": 10 },
      { "level": 2, "text": "Endpoints", "line": 25 }
    ],
    "links": {
      "internal": ["[[User Guide]]", "[[Setup]]"],
      "external": ["https://example.com/api"]
    }
  },
  "project_folder": "my-project"
}
```

### Examples

**Get metadata:**

```javascript
const result = get_note_metadata({
  path: 'docs/api.md',
});

console.log('Word count:', result.metadata.word_count);
console.log('Tags:', result.metadata.tags);
console.log('Headings:', result.metadata.headings.length);
```

**Extract frontmatter:**

```javascript
const result = get_note_metadata({
  path: 'docs/guide.md',
});

const frontmatter = result.metadata.frontmatter;
console.log('Title:', frontmatter.title);
console.log('Version:', frontmatter.version);
```

### Use Cases

- Analyze documentation structure
- Extract tags for organization
- Count words for documentation metrics
- Get headings for table of contents
- Extract frontmatter for processing
- Find internal and external links

### Related Tools

- `read_note` - Read full content
- `update_frontmatter` - Update frontmatter
- `replace_section` - Update sections by heading

---

## delete_note

Delete notes with confirmation requirement.

### Parameters

| Parameter        | Type    | Required | Default     | Description                       |
| ---------------- | ------- | -------- | ----------- | --------------------------------- |
| `path`           | string  | Yes      | -           | Project-relative path to the note |
| `confirm`        | boolean | Yes      | -           | Must be `true` to confirm         |
| `project_folder` | string  | No       | Auto-detect | Optional project context override |

### Return Value

```json
{
  "success": true,
  "path": "docs/old-api.md",
  "project_folder": "my-project",
  "message": "Note deleted successfully"
}
```

### Examples

**Delete note:**

```javascript
delete_note({
  path: 'docs/deprecated.md',
  confirm: true,
});
```

**Delete from specific project:**

```javascript
delete_note({
  path: 'temp.md',
  confirm: true,
  project_folder: 'other-project',
});
```

### Use Cases

- Remove deprecated documentation
- Clean up temporary files
- Delete outdated notes
- Remove duplicates

### Safety Features

- Requires explicit `confirm: true` parameter
- Cannot be undone (use with caution)
- Validates path before deletion
- Returns error if file doesn't exist

### Related Tools

- `write_note` - Create new notes
- `list_notes` - List files before deletion

---

## batch_write_notes

Write multiple notes at once with independent processing.

### Parameters

| Parameter        | Type             | Required | Default     | Description                       |
| ---------------- | ---------------- | -------- | ----------- | --------------------------------- |
| `notes`          | Array<NoteWrite> | Yes      | -           | Array of notes to write           |
| `project_folder` | string           | No       | Auto-detect | Optional project context override |

**NoteWrite Schema:**

```typescript
{
  path: string; // Project-relative path
  content: string; // Note content
  mode: 'create' | 'overwrite' | 'append' | 'prepend'; // Write mode
}
```

### Return Value

```json
{
  "success": true,
  "results": [
    {
      "path": "docs/api.md",
      "success": true,
      "mode": "create"
    },
    {
      "path": "docs/guide.md",
      "success": true,
      "mode": "create"
    }
  ],
  "total": 2,
  "successful": 2,
  "failed": 0,
  "project_folder": "my-project"
}
```

### Examples

**Create multiple documentation files:**

```javascript
batch_write_notes({
  notes: [
    {
      path: 'docs/api.md',
      content: '# API Documentation\n\n...',
      mode: 'create',
    },
    {
      path: 'docs/guide.md',
      content: '# User Guide\n\n...',
      mode: 'create',
    },
    {
      path: 'docs/setup.md',
      content: '# Setup Instructions\n\n...',
      mode: 'create',
    },
  ],
});
```

**Mixed operations:**

```javascript
batch_write_notes({
  notes: [
    {
      path: 'CHANGELOG.md',
      content: '\n## v2.0.0\n- New features\n',
      mode: 'append',
    },
    {
      path: 'docs/new-feature.md',
      content: '# New Feature\n\n...',
      mode: 'create',
    },
    {
      path: 'README.md',
      content: '# Updated README\n\n...',
      mode: 'overwrite',
    },
  ],
});
```

### Use Cases

- Initialize new project documentation
- Create multiple related files
- Bulk update documentation
- Generate documentation from templates
- Batch append to multiple logs

### Processing Behavior

- Each note is processed independently
- Failures don't stop other operations
- Returns per-note status in results
- Successful operations complete even if some fail

### Related Tools

- `write_note` - Write single note
- `create_from_template` - Create from templates

---

## Template Tools

Create notes from professional templates with variable substitution.

### list_templates

List all available note templates with descriptions and required variables.

#### Parameters

None

#### Return Value

```json
{
  "templates": [
    {
      "name": "meeting-notes",
      "description": "Meeting notes with attendees and action items",
      "variables": ["title", "date", "attendees"]
    },
    {
      "name": "api-documentation",
      "description": "API endpoint documentation template",
      "variables": ["endpoint", "method", "description"]
    }
  ],
  "count": 2
}
```

#### Examples

**List templates:**

```javascript
const result = list_templates();
console.log('Available templates:', result.templates.length);
result.templates.forEach((t) => {
  console.log(`- ${t.name}: ${t.description}`);
});
```

#### Built-in Templates

1. **meeting-notes** - Meeting notes with attendees and action items
2. **api-documentation** - API endpoint documentation
3. **project-plan** - Project planning template
4. **bug-report** - Bug report template
5. **feature-spec** - Feature specification template

---

### create_from_template

Create a new note from a template with variable substitution.

#### Parameters

| Parameter        | Type                   | Required | Default     | Description                       |
| ---------------- | ---------------------- | -------- | ----------- | --------------------------------- |
| `template_name`  | string                 | Yes      | -           | Template name                     |
| `filename`       | string                 | Yes      | -           | Output filename (with .md)        |
| `variables`      | Record<string, string> | No       | `{}`        | Template variables                |
| `project_folder` | string                 | No       | Auto-detect | Optional project context override |

#### Auto-filled Variables

These variables are automatically filled if not provided:

- `date` - Current date (YYYY-MM-DD)
- `time` - Current time (HH:MM)
- `datetime` - Current datetime (YYYY-MM-DD HH:MM)
- `year` - Current year (YYYY)
- `month` - Current month (MM)
- `day` - Current day (DD)

#### Return Value

```json
{
  "success": true,
  "path": "meetings/2025-11-13-standup.md",
  "template": "meeting-notes",
  "project_folder": "my-project",
  "message": "Note created from template successfully"
}
```

#### Examples

**Create meeting notes:**

```javascript
create_from_template({
  template_name: 'meeting-notes',
  filename: 'meetings/2025-11-13-standup.md',
  variables: {
    title: 'Daily Standup',
    attendees: 'Alice, Bob, Charlie',
  },
  // date is auto-filled
});
```

**Create API documentation:**

```javascript
create_from_template({
  template_name: 'api-documentation',
  filename: 'docs/api/users-endpoint.md',
  variables: {
    endpoint: '/api/users',
    method: 'GET',
    description: 'Retrieve user list',
  },
});
```

**Create project plan:**

```javascript
create_from_template({
  template_name: 'project-plan',
  filename: 'projects/auth-feature.md',
  variables: {
    project_name: 'Authentication Feature',
    owner: 'Alice',
    deadline: '2025-12-31',
  },
});
```

#### Use Cases

- Create consistent meeting notes
- Generate API documentation
- Start new project plans
- Create bug reports
- Write feature specifications

#### Related Tools

- `list_templates` - List available templates
- `write_note` - Write custom content
- `batch_write_notes` - Create multiple notes

---

## Best Practices

### Writing Notes

1. **Use appropriate modes:**
   - `create` for new files
   - `append` for logs/changelogs
   - `prepend` for urgent updates
   - `overwrite` for complete rewrites

2. **Set project context once:**

   ```javascript
   set_project_context({ project_folder: 'my-project' });
   // All subsequent operations use this context
   ```

3. **Use templates for consistency:**
   ```javascript
   create_from_template({
     template_name: 'meeting-notes',
     filename: 'meetings/standup.md',
   });
   ```

### Finding Notes

1. **Use fuzzy search for quick lookups:**

   ```javascript
   list_notes({
     path: 'docs',
     fuzzy_query: 'api user',
   });
   ```

2. **Use search_notes for content:**
   ```javascript
   search_notes({
     query: 'TODO',
     limit: 20,
   });
   ```

### Batch Operations

1. **Group related operations:**

   ```javascript
   batch_write_notes({
     notes: [
       { path: 'docs/api.md', content: '...', mode: 'create' },
       { path: 'docs/guide.md', content: '...', mode: 'create' },
     ],
   });
   ```

2. **Check results for failures:**
   ```javascript
   const result = batch_write_notes({ notes: [...] });
   if (result.failed > 0) {
     console.error('Some operations failed');
   }
   ```

## Common Errors

### Path Errors

- **"Path traversal detected"** - Use project-relative paths only
- **"File not found"** - Verify path and project context
- **"File already exists"** - Use different mode or path

### Permission Errors

- **"Authentication failed"** - Check API key
- **"Connection refused"** - Ensure Obsidian is running

### Validation Errors

- **"Invalid input"** - Check parameter types and values
- **"Missing required field"** - Provide all required parameters

## Related Documentation

- [Editing Tools](./editing-tools.md) - Advanced editing tools
- [Session Tools](./session-tools.md) - Session management
- [Configuration Guide](../configuration.md) - Setup and configuration
