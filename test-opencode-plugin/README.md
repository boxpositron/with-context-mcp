# OpenCode Plugin Test Environment

This directory is set up for testing the `@opencode/plugin-with-context` plugin.

## Setup

1. **Configure Environment Variables**

   ```bash
   cp .env.example .env
   # Edit .env with your Obsidian settings
   ```

2. **Verify Plugin Installation**

   ```bash
   ls -la .opencode/plugin/
   # Should show with-context.js -> ../../../opencode-plugin-with-context/dist/index.js
   ```

3. **Test with OpenCode**

   Open this directory in OpenCode and the plugin should be automatically loaded.

## Available Tools

Once the plugin is loaded, you can use these tools:

### 1. Check Plugin Status

```typescript
with_context_status();
```

### 2. Write a Note

```typescript
write_note({
  path: 'test-note.md',
  content: '# Test Note\n\nThis is a test.',
  mode: 'create',
});
```

### 3. Read a Note

```typescript
read_note({
  path: 'test-note.md',
});
```

## Testing Checklist

- [ ] Plugin loads without errors
- [ ] `with_context_status` returns configuration
- [ ] `write_note` creates a new note
- [ ] `write_note` with mode "overwrite" updates existing note
- [ ] `write_note` with mode "append" appends to existing note
- [ ] `read_note` retrieves note content
- [ ] Error handling works (e.g., reading non-existent note)
- [ ] Notes appear in Obsidian vault at correct location

## Manual Testing

If you want to test the tools manually without OpenCode:

```bash
# Run the MCP server directly
cd ../
npm run dev

# In another terminal, test with MCP inspector or client
```

## Troubleshooting

### Plugin Not Loading

- Check that the symlink exists: `ls -la .opencode/plugin/`
- Verify environment variables are set
- Check OpenCode console for errors

### Tools Not Working

- Verify Obsidian Local REST API is running
- Check API key and vault name in `.env`
- Ensure vault path exists
- Check Obsidian API plugin is enabled and accessible

### Notes Not Appearing

- Verify `PROJECT_BASE_PATH` exists in your vault
- Check that project folder is created
- Look for errors in OpenCode console
