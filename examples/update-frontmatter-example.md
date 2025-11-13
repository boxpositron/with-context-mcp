# update_frontmatter Tool Examples

This document demonstrates practical usage examples for the `update_frontmatter` tool.

## Example 1: Tagging Documentation Files

**Scenario**: You want to add consistent tags to all your documentation files.

```typescript
// Add "documentation" and "public" tags to API docs
await updateFrontmatter({
  path: 'docs/api.md',
  frontmatter: {
    tags: ['documentation', 'public', 'api'],
  },
  mode: 'merge',
});
```

**Result**: Tags are added while preserving other frontmatter fields like title, author, etc.

## Example 2: Version Tracking

**Scenario**: Update version information when releasing a new version.

```typescript
// Update version and last updated date
await updateFrontmatter({
  path: 'CHANGELOG.md',
  frontmatter: {
    version: '3.0.6',
    updated: '2025-11-13',
    status: 'released',
  },
  mode: 'merge',
});
```

## Example 3: Cleanup Old Metadata

**Scenario**: Replace outdated or messy frontmatter with a clean structure.

```typescript
// Replace entire frontmatter with clean, minimal fields
await updateFrontmatter({
  path: 'docs/legacy-doc.md',
  frontmatter: {
    title: 'Legacy Documentation',
    status: 'archived',
    redirect: 'docs/new-doc.md',
  },
  mode: 'replace',
});
```

**Use Case**: This removes all old fields and replaces with just the specified ones.

## Example 4: Adding Metadata to Generated Files

**Scenario**: You've generated documentation files and want to add metadata.

```typescript
// For a file without frontmatter
await updateFrontmatter({
  path: 'generated/api-reference.md',
  frontmatter: {
    title: 'API Reference',
    generated: true,
    generator: 'typedoc',
    date: '2025-11-13',
  },
  mode: 'merge',
});
```

**Result**: Creates new frontmatter block at the top of the file.

## Example 5: Batch Operations

**Scenario**: Update frontmatter for multiple files in a workflow.

```typescript
// Update multiple files with consistent metadata
const files = ['README.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md'];

for (const file of files) {
  await updateFrontmatter({
    path: file,
    frontmatter: {
      project: 'with-context-mcp',
      type: 'project-docs',
      public: true,
    },
    mode: 'merge',
  });
}
```

## Example 6: Session Tracking

**Scenario**: Track which session last modified a file.

```typescript
// Add session tracking metadata
await updateFrontmatter({
  path: 'docs/architecture.md',
  frontmatter: {
    last_session: 'sess-2025-11-13-001',
    last_modified_by: 'claude-agent',
    last_modified: new Date().toISOString(),
  },
  mode: 'merge',
});
```

## Example 7: Content Classification

**Scenario**: Add classification metadata for vault organization.

```typescript
// Classify note for better organization
await updateFrontmatter({
  path: 'research/paper-notes.md',
  frontmatter: {
    category: 'research',
    priority: 'high',
    tags: ['ai', 'mcp', 'agents'],
    status: 'in-progress',
  },
  mode: 'merge',
});
```

## Example 8: Template Application

**Scenario**: Apply a template's frontmatter structure to an existing note.

```typescript
// Apply meeting note template metadata
await updateFrontmatter({
  path: 'meetings/2025-11-13-standup.md',
  frontmatter: {
    type: 'meeting',
    template: 'standup',
    attendees: ['Alice', 'Bob', 'Charlie'],
    date: '2025-11-13',
    duration: '30min',
  },
  mode: 'replace',
});
```

## Error Handling

Always handle potential errors when using the tool:

```typescript
try {
  const result = await updateFrontmatter({
    path: 'docs/api.md',
    frontmatter: { version: '2.0.0' },
    mode: 'merge',
  });

  console.log('Success:', result.message);
} catch (error) {
  if (error.message.includes('not found')) {
    console.error('File does not exist');
  } else if (error.message.includes('Cannot connect')) {
    console.error('Obsidian API is not available');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Best Practices

1. **Use merge mode by default**: Preserves existing metadata and only updates what you need
2. **Use replace mode carefully**: Only when you want to completely reset frontmatter
3. **Read first when uncertain**: Use `get_note_metadata` to inspect current frontmatter before updating
4. **Consistent field names**: Use consistent naming across your vault (e.g., `tags` not `tag`)
5. **Validate input**: Ensure frontmatter values are valid before passing to the tool
6. **Handle arrays properly**: Arrays should be passed as JavaScript arrays, not strings
7. **Quote special characters**: The tool handles escaping, but be aware of YAML special chars

## Integration with Other Tools

### With get_note_metadata

```typescript
// Read current frontmatter first
const metadata = await getNoteMetadata({ path: 'docs/api.md' });
const currentFrontmatter = metadata.frontmatter;

// Add a new tag while preserving existing ones
await updateFrontmatter({
  path: 'docs/api.md',
  frontmatter: {
    tags: [...(currentFrontmatter?.tags || []), 'new-tag'],
  },
  mode: 'merge',
});
```

### With Session Management

```typescript
// Add changelog entry and update note metadata
await addChangelogEntry({
  type: 'docs',
  message: 'Updated API documentation',
});

await updateFrontmatter({
  path: 'docs/api.md',
  frontmatter: {
    last_updated: new Date().toISOString(),
    session: sessionState.getCurrentSessionId(),
  },
  mode: 'merge',
});
```

## Performance Considerations

- The tool is fast for typical notes (< 1MB)
- For very large files, consider using `read_note` first to check size
- Batch operations should be throttled if updating many files
- The tool reads and writes once per call (single round-trip)

## Troubleshooting

### Issue: "Cannot write to existing file without reading it first"

**Solution**: This is the read-before-write enforcement. Read the file first:

```typescript
await readNote({ path: "docs/api.md" });
await updateFrontmatter({ path: "docs/api.md", ... });
```

### Issue: Frontmatter not being created

**Solution**: Make sure the mode is correct and the file exists. Check for errors in the response.

### Issue: Array values not working

**Solution**: Pass arrays as JavaScript arrays, not strings:

```typescript
// ✅ Correct
frontmatter: {
  tags: ['dev', 'mcp'];
}

// ❌ Wrong
frontmatter: {
  tags: 'dev, mcp';
}
```

### Issue: Special characters in values

**Solution**: The tool handles escaping automatically. Just pass the raw string:

```typescript
frontmatter: {
  title: 'Note with: colon and "quotes"';
}
```
