# Run These Tests

Please run each test command below and report the results:

## Test 1: list_notes()

```javascript
list_notes();
```

---

## Test 2: list_notes with subfolder

```javascript
list_notes({ path: 'docs' });
```

---

## Test 3: search_notes (case-insensitive)

```javascript
search_notes({ query: 'API' });
```

---

## Test 4: search_notes (case-sensitive)

```javascript
search_notes({ query: 'api', case_sensitive: true });
```

---

## Test 5: get_note_metadata

```javascript
get_note_metadata({ path: 'TESTING.md' });
```

---

## Test 6: set_project_context

```javascript
set_project_context({ project_folder: 'test-opencode-plugin' });
```

---

## Test 7: batch_write_notes

```javascript
batch_write_notes({
  notes: [
    { path: 'batch-test-1.md', content: '# Batch Test 1\n\nFirst note', mode: 'create' },
    { path: 'batch-test-2.md', content: '# Batch Test 2\n\nSecond note', mode: 'create' },
    { path: 'batch-test-3.md', content: '# Batch Test 3\n\nThird note', mode: 'create' },
  ],
});
```

---

## Test 8: delete_note without confirmation (should fail)

```javascript
delete_note({ path: 'batch-test-1.md', confirm: false });
```

---

## Test 9: delete_note with confirmation

```javascript
delete_note({ path: 'batch-test-1.md', confirm: true });
```

---

## Test 10: list_templates

```javascript
list_templates();
```

---

## Test 11: create_from_template

```javascript
create_from_template({
  template_name: 'changelog',
  filename: 'CHANGELOG-v2.md',
  variables: { version: '0.2.0', date: '2025-11-03' },
});
```

---

## Summary

For each test, report:

- ✅ PASS or ❌ FAIL
- Any error messages
- Unexpected behavior

Then save results to BATCH-4-TESTS.md with updated pass/fail status.
