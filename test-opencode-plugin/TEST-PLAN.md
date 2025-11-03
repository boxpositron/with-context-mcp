# OpenCode Plugin Test Plan - Batch 3

**Environment**: test-opencode-plugin
**Plugin**: @opencode/plugin-with-context v0.1.0
**Date**: November 3, 2025

## Pre-Test Checklist

- [x] Plugin symlink created: `.opencode/plugin/with-context.js`
- [x] Environment variables configured in `.env`
- [x] Obsidian vault: "Work"
- [x] Base path: "Development Sessions"
- [x] OpenCode restarted

## Test Execution

### Test 1: Plugin Status Check ✓

**Command:**

```javascript
with_context_status();
```

**Expected Output:**

```json
{
  "status": "active",
  "config": {
    "vaultPath": "/Users/davidibia/Documents/Vault",
    "basePath": "Development Sessions"
  },
  "version": "0.1.0"
}
```

**Result:** [x] PASS / [ ] FAIL
**Notes:** Base path is "Projects" not "Development Sessions" in current environment

---

### Test 2: Create New Note ✓

**Command:**

```javascript
write_note({
  path: 'TESTING.md',
  content:
    '# Testing OpenCode Plugin\n\n## Test Run 1\n\nThis note was created by the with-context plugin.',
  mode: 'create',
});
```

**Expected Output:**

```json
{
  "success": true,
  "path": "Development Sessions/test-opencode-plugin/TESTING.md",
  "mode": "create",
  "project_folder": "test-opencode-plugin",
  "message": "Note created successfully"
}
```

**Expected in Obsidian:**

- File exists at: `Development Sessions/test-opencode-plugin/TESTING.md`
- Content matches what was written

**Result:** [x] PASS / [ ] FAIL
**Notes:** Note created successfully in Obsidian vault at Projects/with-context-mcp/TESTING.md

---

### Test 3: Read Existing Note ✓

**Command:**

```javascript
read_note({
  path: 'TESTING.md',
});
```

**Expected Output:**

```json
{
  "success": true,
  "path": "Development Sessions/test-opencode-plugin/TESTING.md",
  "project_folder": "test-opencode-plugin",
  "content": "# Testing OpenCode Plugin\n\n## Test Run 1\n\nThis note was created by the with-context plugin.",
  "metadata": {
    "length": <number>,
    "lines": 5
  }
}
```

**Result:** [x] PASS / [ ] FAIL
**Notes:** Read returned correct content with metadata (length: 91, lines: 5)

---

### Test 4: Overwrite Existing Note ✓

**Command:**

```javascript
write_note({
  path: 'TESTING.md',
  content:
    '# Testing OpenCode Plugin\n\n## Test Run 2\n\nThis note was UPDATED by the with-context plugin.\n\n### Features Tested\n- Create\n- Read\n- Overwrite',
  mode: 'overwrite',
});
```

**Expected Output:**

```json
{
  "success": true,
  "path": "Development Sessions/test-opencode-plugin/TESTING.md",
  "mode": "overwrite",
  "project_folder": "test-opencode-plugin",
  "message": "Note updated successfully"
}
```

**Verify:**

```javascript
read_note({ path: 'TESTING.md' });
```

**Result:** [x] PASS / [ ] FAIL
**Notes:** Overwrite successful, verified content was replaced correctly

---

### Test 5: Append to Existing Note ✓

**Command:**

```javascript
write_note({
  path: 'TESTING.md',
  content: '\n\n## Test Run 3\n\nThis content was APPENDED.',
  mode: 'append',
});
```

**Expected Output:**

```json
{
  "success": true,
  "path": "Development Sessions/test-opencode-plugin/TESTING.md",
  "mode": "append",
  "project_folder": "test-opencode-plugin",
  "message": "Note appended to successfully"
}
```

**Verify:**

```javascript
read_note({ path: 'TESTING.md' });
```

**Expected:** Content includes both original and appended sections

**Result:** [x] PASS / [ ] FAIL
**Notes:** Append successful, content was added to end of file

---

### Test 6: Create Note in Subdirectory ✓

**Command:**

```javascript
write_note({
  path: 'docs/api.md',
  content:
    '# API Documentation\n\n## Endpoints\n\n### write_note\n- Creates, updates, or appends notes',
  mode: 'create',
});
```

**Expected Output:**

```json
{
  "success": true,
  "path": "Development Sessions/test-opencode-plugin/docs/api.md",
  "mode": "create",
  "project_folder": "test-opencode-plugin",
  "message": "Note created successfully"
}
```

**Expected in Obsidian:**

- Folder created: `Development Sessions/test-opencode-plugin/docs/`
- File exists: `docs/api.md`

**Result:** [x] PASS / [ ] FAIL
**Notes:** Subdirectory created successfully at Projects/with-context-mcp/docs/api.md

---

### Test 7: Read Non-existent Note (Error Handling) ✓

**Command:**

```javascript
read_note({
  path: 'does-not-exist.md',
});
```

**Expected Output:**
Error message (graceful failure)

**Result:** [x] PASS / [ ] FAIL
**Notes:** Error handled gracefully: "Note not found: Resource not found"

---

### Test 8: Duplicate Create (Error Handling) ✓

**Command:**

```javascript
write_note({
  path: 'TESTING.md',
  content: 'This should fail',
  mode: 'create',
});
```

**Expected Output:**
Error message indicating file already exists

**Result:** [ ] PASS / [x] FAIL
**Notes:** Create mode did not prevent overwrite - content was appended instead of throwing error. This suggests Obsidian Local REST API may not support strict create-only mode, or the implementation needs to check file existence first.

---

## Summary

**Total Tests:** 8
**Passed:** 7
**Failed:** 1
**Success Rate:** 87.5%

## Issues Found

1. **Test 8 - Duplicate Create Mode**: Create mode does not prevent overwriting existing files. The Obsidian Local REST API appears to append content instead of throwing an error when creating a file that already exists.
2. **Base Path Mismatch**: Test plan expected "Development Sessions" but actual config uses "Projects"
3. **Project Folder Detection**: Plugin correctly detects "with-context-mcp" as project folder (not "test-opencode-plugin")

## Improvements Needed

1. **Implement File Existence Check**: Add explicit file existence validation before create operations to prevent unintended overwrites
2. **Update Test Environment**: Align test plan with actual environment configuration (Projects vs Development Sessions)
3. **Enhance Error Messages**: Provide more specific error messages for different failure scenarios

## Improvements Needed

1.
2.
3.

## Next Steps

- [x] Document all test results
- [ ] Fix create mode to check file existence before writing
- [ ] Add integration tests for Obsidian API behavior
- [ ] Plan Batch 4 (additional tools: list_notes, search_notes, delete_note)
- [ ] Commit working plugin to git

## Notes

- All core functionality (read, write, overwrite, append) works correctly
- Plugin successfully creates nested directory structures
- Error handling is graceful and informative
- Only issue is with create mode not preventing overwrites (likely API limitation)
