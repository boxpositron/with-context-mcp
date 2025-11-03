# Retest search_notes After Fix

**Issue**: Tests 3 and 4 failed with "Note not found: Not Found" error

**Fix Applied**: Corrected path handling in search_notes implementation

---

## Test 3: search_notes (case-insensitive) - RETEST

**Command:**

```javascript
search_notes({ query: 'API' });
```

**Expected Output:**

```json
{
  "success": true,
  "query": "API",
  "project_folder": "with-context-mcp",
  "matches": [
    {
      "path": "docs/api.md",
      "snippet": "...# API Documentation...",
      "line": 1
    }
  ],
  "total": 1,
  "limited": false
}
```

**Result:** [ ] PASS / [ ] FAIL  
**Notes:**

---

## Test 4: search_notes (case-sensitive) - RETEST

**Command:**

```javascript
search_notes({ query: 'api', case_sensitive: true });
```

**Expected Output:**
Should return fewer or no results (since "API" is uppercase in the note)

```json
{
  "success": true,
  "query": "api",
  "project_folder": "with-context-mcp",
  "matches": [],
  "total": 0,
  "limited": false
}
```

**Result:** [ ] PASS / [ ] FAIL  
**Notes:**

---

## Instructions

1. Restart OpenCode to reload the fixed plugin
2. Run Test 3 command
3. Run Test 4 command
4. Report results back with PASS/FAIL status
5. Include any error messages or unexpected output

---

## What Was Fixed

- Changed `listNotes(context.projectFolder)` to `listNotes(fullDirPath)`
- Now passing full path: `"Projects/with-context-mcp"` instead of just `"with-context-mcp"`
- Correctly building full paths for `readNote()` calls
- Storing clean filenames in results

The search functionality should now work correctly!
